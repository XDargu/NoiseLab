// --- Canvas setup ---
const noiseCanvas = document.getElementById("noiseCanvas");
const ctx = noiseCanvas.getContext("2d");
let WIDTH = 1024;
let HEIGHT = 1024;

let maximized = false;
noiseCanvas.onclick = () => {
    if (maximized)
    {
        noiseCanvas.style.width = "256px";
        noiseCanvas.style.height = "256px";
    }
    else
    {
        noiseCanvas.style.width = "calc(100vh - 70px)";
        noiseCanvas.style.height = "calc(100vh - 70px)";
    }

    maximized = !maximized;
}

noiseCanvas.scale = 4;

const PREVIEW_W = 128;
const PREVIEW_H = 128;
const PREVIEW_PADDING = 10;

GPU.init(WIDTH, HEIGHT);


// --- Node evaluation ---
let activeNode = null;

const terrainModeCheck = document.getElementById("terrain-mode")
terrainModeCheck.checked = localStorage.getItem("noiseLabTerrainMode") == "true";

terrainModeCheck.onchange = () => { 

    localStorage.setItem("noiseLabTerrainMode", terrainModeCheck.checked);
    renderNode(graph.activeNode);
    graphCanvas.draw(true)
}

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
function renderNode(node, select = true){
    
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