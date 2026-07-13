// --- Canvas setup ---
const noiseCanvas = document.getElementById("noiseCanvas");
const ctx = noiseCanvas.getContext("2d");
let WIDTH = 1024;
let HEIGHT = 1024;

let maximized = false;
const mobileViewport = window.matchMedia("(max-width: 760px)");

function updateNoiseCanvasSize() {
    noiseCanvas.classList.toggle("maximized", maximized);

    if (mobileViewport.matches) {
        noiseCanvas.style.width = maximized ? "min(calc(100vw - 24px), calc(100dvh - 185px))" : "min(38vw, 150px)";
        noiseCanvas.style.height = noiseCanvas.style.width;
        return;
    }

    noiseCanvas.style.width = maximized ? "calc(100vh - 120px)" : "256px";
    noiseCanvas.style.height = noiseCanvas.style.width;
}

noiseCanvas.onclick = () => {
    maximized = !maximized;
    updateNoiseCanvasSize();
}
if (mobileViewport.addEventListener)
    mobileViewport.addEventListener("change", updateNoiseCanvasSize);
else
    mobileViewport.addListener(updateNoiseCanvasSize);
window.addEventListener("resize", updateNoiseCanvasSize);
updateNoiseCanvasSize();

noiseCanvas.scale = 4;

const downloadImageBtn = document.getElementById("downloadImageBtn");
downloadImageBtn.onclick = () => {
    const graphName = document.getElementById("currentGraphName").innerText.trim() || "noiselab";
    const safeName = graphName.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");

    noiseCanvas.toBlob(blob => {
        if (!blob) return;

        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `${safeName}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, "image/png");
};

const PREVIEW_W = 128;
const PREVIEW_H = 128;
const PREVIEW_PADDING = 10;

GPU.init(WIDTH, HEIGHT);


// --- Node evaluation ---
let activeNode = null;

// --- Graph setup ---
const graphCanvasEl = document.getElementById("graph");
const graph = new LGraph();
const graphCanvas = new LGraphCanvas(graphCanvasEl, graph);
graph.start();

// Background double-click still opens LiteGraph's add-node search, but
// double-clicking an existing node should not open the default settings panel.
// That panel is sized for LiteGraph's full editor shell and can visually
// compress the graph area in this embedded layout until the page is reloaded.
graphCanvas.onShowNodePanel = () => {};

function enableTouchGraphControls(canvas) {
    let activeTouchId = null;
    let activeMode = null;
    let lastTouchPosition = null;

    function touchToGraphPosition(touch) {
        const rect = canvas.getBoundingClientRect();
        return [
            (touch.clientX - rect.left) / graphCanvas.ds.scale - graphCanvas.ds.offset[0],
            (touch.clientY - rect.top) / graphCanvas.ds.scale - graphCanvas.ds.offset[1]
        ];
    }

    function getTouch(touches) {
        for (let i = 0; i < touches.length; i++) {
            if (touches[i].identifier == activeTouchId)
                return touches[i];
        }

        return null;
    }

    function dispatchMouseFromTouch(type, touch, target) {
        const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: touch.clientX,
            clientY: touch.clientY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            button: 0,
            buttons: type == "mouseup" ? 0 : 1
        });
        Object.defineProperty(event, "which", { value: type == "mouseup" ? 0 : 1 });

        target.dispatchEvent(event);
    }

    canvas.addEventListener("touchstart", e => {
        if (activeTouchId !== null || e.touches.length != 1)
            return;

        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        lastTouchPosition = [touch.clientX, touch.clientY];
        e.preventDefault();

        const graphPosition = touchToGraphPosition(touch);
        const node = graph.getNodeOnPos(graphPosition[0], graphPosition[1], graphCanvas.visible_nodes, 5);
        activeMode = node ? "litegraph" : "pan";

        if (activeMode == "litegraph")
            dispatchMouseFromTouch("mousedown", touch, canvas);
    }, { passive: false });

    canvas.addEventListener("touchmove", e => {
        if (activeTouchId === null)
            return;

        const touch = getTouch(e.changedTouches) || getTouch(e.touches);
        if (!touch)
            return;

        e.preventDefault();

        if (activeMode == "pan") {
            const deltaX = touch.clientX - lastTouchPosition[0];
            const deltaY = touch.clientY - lastTouchPosition[1];
            graphCanvas.ds.offset[0] += deltaX / graphCanvas.ds.scale;
            graphCanvas.ds.offset[1] += deltaY / graphCanvas.ds.scale;
            graphCanvas.dirty_canvas = true;
            graphCanvas.dirty_bgcanvas = true;
            graphCanvas.draw(true, true);
        }
        else {
            dispatchMouseFromTouch("mousemove", touch, document);
        }

        lastTouchPosition = [touch.clientX, touch.clientY];
    }, { passive: false });

    function finishTouch(e) {
        if (activeTouchId === null)
            return;

        const touch = getTouch(e.changedTouches);
        if (!touch)
            return;

        e.preventDefault();

        if (activeMode == "litegraph")
            dispatchMouseFromTouch("mouseup", touch, document);

        activeTouchId = null;
        activeMode = null;
        lastTouchPosition = null;
    }

    canvas.addEventListener("touchend", finishTouch, { passive: false });
    canvas.addEventListener("touchcancel", finishTouch, { passive: false });
}

enableTouchGraphControls(graphCanvasEl);

// --- Responsive resizing ---
function resizeGraph() {
    const container = graphCanvasEl.parentElement;
    const width = Math.max(1, Math.floor(container.clientWidth));
    const height = Math.max(1, Math.floor(container.clientHeight));

    graphCanvas.resize(width, height);
}
window.addEventListener("resize", resizeGraph);
resizeGraph();

const mobileSidebarBtn = document.getElementById("mobileSidebarBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const yourGraphsList = document.getElementById("yourGraphsList");

function setMobileSidebarOpen(open) {
    document.body.classList.toggle("sidebar-open", open);
    mobileSidebarBtn.setAttribute("aria-label", open ? "Close graphs" : "Open graphs");
    mobileSidebarBtn.setAttribute("aria-expanded", open ? "true" : "false");

    setTimeout(resizeGraph, 200);
}

mobileSidebarBtn.onclick = () => setMobileSidebarOpen(!document.body.classList.contains("sidebar-open"));
sidebarBackdrop.onclick = () => setMobileSidebarOpen(false);
yourGraphsList.addEventListener("click", e => {
    if (e.target.closest(".graph-actions")) return;
    if (e.target.closest("li")) setMobileSidebarOpen(false);
});


// --- Click node to preview full canvas ---
function renderNode(node, select = true){
    if (node && select)
        activeNode = node;
    
    // execute all nodes
    graph._nodes_in_order.forEach(n => { if (n.onExecute) n.onExecute() });

    // render clicked node output
    const output = node?.getOutputData(0);
    if(output && select)
    {
        if (node.gl)
            node.drawPreviewTexture(ctx);
        else
            renderNoise(output);
    }
}

graphCanvas.onNodeSelected = node=>{
    activeNode=node;
    renderNode(activeNode);
};

initTerrainEditor();
initGraphManager(graphCanvasEl)

// Welcome modal
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("welcomeModal");
  const closeBtn = document.getElementById("closeWelcomeBtn");

  // Show modal only if user hasn't visited before
  if (!localStorage.getItem("noiseLabVisited")) {
    modal.classList.add("show");
  }

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    localStorage.setItem("noiseLabVisited", "true");
  });
});
