let currentGraphId = null;
let isLoadingGraph = false;
let saveInternal;

const GRAPH_STORAGE_KEY = "noiselab_graphs";
const LAST_GRAPH_STORAGE_KEY = "noiselab_lastgraph";

async function migrateLocalStorageGraphsIfNeeded() {
    if (await NoiseLabStorage.countGraphs() > 0)
        return false;

    const stored = localStorage.getItem(GRAPH_STORAGE_KEY);
    if (!stored)
        return false;

    try {
        const graphs = JSON.parse(stored);

        if (!graphs || Object.keys(graphs).length == 0)
            return false;

        await NoiseLabStorage.saveGraphs(graphs);
        localStorage.removeItem(GRAPH_STORAGE_KEY);
        return true;
    }
    catch (err) {
        console.error("Failed to migrate localStorage graphs to IndexedDB.", err);
        return false;
    }
}

async function hasGraphs() {
    return await NoiseLabStorage.countGraphs() > 0;
}

async function loadAllGraphs() {
    return NoiseLabStorage.getAllGraphs();
}

async function saveAllGraphs(graphs) {
    await NoiseLabStorage.saveGraphs(graphs);
}

function collectGraphImageIds(graphData) {
    const ids = new Set();

    (graphData?.nodes || []).forEach(node => {
        const imageId = node?.properties?.imageId;

        if (node.type == "Generator/Image" && imageId)
            ids.add(imageId);
    });

    return Array.from(ids);
}

function remapGraphImageIds(graphData, imageIdMap) {
    const cloned = JSON.parse(JSON.stringify(graphData));

    (cloned.nodes || []).forEach(node => {
        const imageId = node?.properties?.imageId;

        if (node.type == "Generator/Image" && imageId && imageIdMap[imageId])
            node.properties.imageId = imageIdMap[imageId];
    });

    return cloned;
}

async function buildExportPayload(graph, name) {
    const images = [];

    for (const imageId of collectGraphImageIds(graph)) {
        const image = await NoiseLabStorage.prepareImageForExport(imageId);

        if (image)
            images.push(image);
    }

    return {
        format: "noiselab",
        version: 2,
        name,
        graph,
        images
    };
}

async function importPayload(data) {
    if (!data || data.format != "noiselab" || !data.graph)
        return data;

    const imageIdMap = {};

    for (const image of data.images || []) {
        const record = await NoiseLabStorage.importImage(image);
        imageIdMap[image.id] = record.id;
    }

    return remapGraphImageIds(data.graph, imageIdMap);
}

async function exportGraph(graph, name) {
    if (!graph)
        return;

    const payload = await buildExportPayload(graph, name);
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".noiselab";

    a.click();
    URL.revokeObjectURL(a.href);
}

async function importGraphFromJSON(json, name, idLabel, display = false) {
    const id = "example_" + idLabel;
    await NoiseLabStorage.saveGraph(id, { name, data: json, pinned: false });

    if (display) {
        await renderGraphList();
        await loadGraphById(id);
    }
}

function importGraph(file) {
    if (!file)
        return;

    const reader = new FileReader();
    reader.onload = async evt => {
        try {
            const data = JSON.parse(evt.target.result);
            const graphData = await importPayload(data);
            const name = `${file.name}`;
            const id = "graph_" + Date.now();

            await NoiseLabStorage.saveGraph(id, { name, data: graphData, pinned: false });
            await renderGraphList();
            await loadGraphById(id);
        }
        catch (err) {
            alert("Failed to import: " + err.message);
        }
    };
    reader.readAsText(file);
}

async function createNewGraph() {
    const graphs = await loadAllGraphs();
    const name = `Untitled (${Object.entries(graphs).length})`;
    const id = "graph_" + Date.now();

    await NoiseLabStorage.saveGraph(id, { name, data: {}, pinned: false });
    await renderGraphList();
    document.getElementById("currentGraphName").innerText = name;
    return id;
}

async function loadGraphById(id) {
    clearTimeout(saveInternal);

    const g = await NoiseLabStorage.getGraph(id);
    if (!g)
        return false;

    currentGraphId = id;
    document.getElementById("currentGraphName").innerText = g.name;
    graph.clear();
    isLoadingGraph = true;
    graph.configure(g.data || {});
    isLoadingGraph = false;
    renderNode(graph._nodes_in_order[0]);
    await renderGraphList();
    localStorage.setItem(LAST_GRAPH_STORAGE_KEY, id);

    return true;
}

function autoSaveGraph() {
    clearTimeout(saveInternal);
    saveInternal = setTimeout(async () => {
        if (isLoadingGraph)
            return;

        if (!currentGraphId)
            currentGraphId = await createNewGraph();

        const graphRecord = await NoiseLabStorage.getGraph(currentGraphId);
        const name = graphRecord ? graphRecord.name : "Untitled";
        const pinned = graphRecord ? graphRecord.pinned : false;

        await NoiseLabStorage.saveGraph(currentGraphId, {
            name,
            pinned,
            data: graph.serialize()
        });

        await renderGraphList();
    }, 100);
}

async function renderGraphList() {
    const graphs = await loadAllGraphs();
    const yourList = document.getElementById("yourGraphsList");
    yourList.innerHTML = "";

    const entries = Object.entries(graphs)
        .sort(([idA, a], [idB, b]) => b.pinned - a.pinned);

    entries.forEach(([id, g]) => {
        const li = document.createElement("li");
        li.dataset.id = id;
        if (id == currentGraphId)
            li.classList.add("selected");
        li.title = g.name;
        li.innerHTML = `<div class="graph-title"">${g.pinned ? '<i class="fas fa-thumbtack pinned-icon"></i>' : ''}${g.name}</div>
            <div class="graph-actions">
                <button class="exportGraphBtn" title="Export"><i class="fas fa-file-export"></i></button>
                <button class="pinGraphBtn" title="Pin/Unpin"><i class="fas fa-thumbtack"></i></button>
                <button class="deleteGraphBtn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        li.addEventListener("click", async e => {
            if (e.target.closest(".graph-actions"))
                return;

            await loadGraphById(id);
        });

        li.querySelector(".exportGraphBtn").onclick = async () => {
            const id = li.dataset.id;
            const graphRecord = await NoiseLabStorage.getGraph(id);
            await exportGraph(graphRecord.data, graphRecord.name);
        };

        li.querySelector(".pinGraphBtn").onclick = async () => {
            const id = li.dataset.id;
            const graphRecord = await NoiseLabStorage.getGraph(id);
            graphRecord.pinned = !graphRecord.pinned;
            await NoiseLabStorage.saveGraph(id, graphRecord);
            await renderGraphList();
        };

        li.querySelector(".deleteGraphBtn").onclick = async () => {
            const id = li.dataset.id;
            if (!confirm("Delete this graph?"))
                return;

            await NoiseLabStorage.deleteGraph(id);
            await renderGraphList();

            if (currentGraphId === id) {
                graph.clear();
                document.getElementById("currentGraphName").innerText = "Untitled";
                currentGraphId = null;
                localStorage.removeItem(LAST_GRAPH_STORAGE_KEY);
            }
        };

        yourList.appendChild(li);
    });

    updateStorageUsageIndicator();
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes))
        return "unknown";

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    const precision = unitIndex == 0 || value >= 10 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

async function updateStorageUsageIndicator() {
    const el = document.getElementById("storageUsage");
    if (!el)
        return;

    try {
        const estimate = await NoiseLabStorage.estimateUsage();
        const usage = formatBytes(estimate.usage || 0);

        if (estimate.quota)
            el.textContent = `Storage used: ${usage} of ${formatBytes(estimate.quota)}`;
        else
            el.textContent = `Storage used: ${usage}`;
    }
    catch (err) {
        el.textContent = "Storage used: unavailable";
    }
}

async function initGraphManager(graphCanvasEl) {
    await migrateLocalStorageGraphsIfNeeded();

    document.getElementById("createGraphBtn").addEventListener("click", async () => {
        const id = await createNewGraph();
        await loadGraphById(id);
    });

    document.getElementById("currentGraphName").addEventListener("blur", async e => {
        if (!currentGraphId)
            return;

        const graphRecord = await NoiseLabStorage.getGraph(currentGraphId);
        if (!graphRecord)
            return;

        graphRecord.name = e.target.innerText.trim() || "Untitled";
        await NoiseLabStorage.saveGraph(currentGraphId, graphRecord);
        await renderGraphList();
    });

    document.getElementById("exportBtn").addEventListener("click", async () => {
        if (!currentGraphId)
            return;

        const graphRecord = await NoiseLabStorage.getGraph(currentGraphId);
        await exportGraph(graphRecord.data, graphRecord.name);
    });

    document.getElementById("importBtn").addEventListener("click", () => {
        document.getElementById("fileInput").click();
    });

    document.getElementById("fileInput").addEventListener("change", e => {
        const file = e.target.files[0];
        importGraph(file);
    });

    graph.onNodeAdded = node => {
        renderNode(node, false);
        autoSaveGraph();
    };
    graph.onNodeRemoved = autoSaveGraph;
    graph.onNodeConnectionChange = autoSaveGraph;
    graphCanvas.onNodeMoved = autoSaveGraph;

    graphCanvasEl.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    });

    graphCanvasEl.addEventListener("drop", e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        importGraph(file);
    });

    document.getElementById("graphSearch").addEventListener("input", e => {
        const filter = e.target.value.toLowerCase();
        document.querySelectorAll("#yourGraphsList li").forEach(li => {
            li.style.display = li.innerText.toLowerCase().includes(filter) ? "" : "none";
        });
    });

    if (!await hasGraphs()) {
        await importGraphFromJSON(exampleIsland, "Island", "island");
        await importGraphFromJSON(examplePixelRock, "Pixel Art Rocks", "pixelArtRocks");
        await importGraphFromJSON(exampleWoodPlank, "Wood Planks", "wookPlanks");
        await importGraphFromJSON(exampleEye, "Eye", "eye", true);
    }
    else {
        const lastId = localStorage.getItem(LAST_GRAPH_STORAGE_KEY);
        if (lastId) {
            if (!await loadGraphById(lastId))
                await renderGraphList();
        }
        else {
            await renderGraphList();
        }
    }
}
