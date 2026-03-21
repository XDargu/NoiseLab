// --- Canvas setup ---
const canvas = document.getElementById("noiseCanvas");
const ctx = canvas.getContext("2d");
let WIDTH = canvas.width;
let HEIGHT = canvas.height;

const PREVIEW_W = 128;
const PREVIEW_H = 128;
const PREVIEW_PADDING = 10;

GPU.init(WIDTH, HEIGHT);


// --- Node evaluation ---
let activeNode = null;

const terrainModeCheck = document.getElementById("terrain-mode")
terrainModeCheck.onchange = () => { renderNode(graph.activeNode) }

// --- Graph setup ---
const graphCanvasEl = document.getElementById("graph");
const graph = new LGraph();
const graphCanvas = new LGraphCanvas(graphCanvasEl, graph);
graph.start();

// --- Responsive resizing ---
function resizeGraph() {
    const rect = graphCanvasEl.parentElement.getBoundingClientRect();
    graphCanvasEl.width = rect.width;
    graphCanvasEl.height = rect.height;
    graphCanvas.resize();
}
window.addEventListener("resize", resizeGraph);
resizeGraph();


// --- Click node to preview full canvas ---
function renderNode(node){
    if (!node) return;
    
    // execute all nodes
    graph._nodes_in_order.forEach(n => n.onExecute());

    // render clicked node output
    const output = node?.getOutputData(0);
    if(output)
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

initGraphManager(graphCanvasEl)