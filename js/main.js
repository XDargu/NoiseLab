// --- Canvas setup ---
const canvas = document.getElementById("noiseCanvas");
const ctx = canvas.getContext("2d");
let WIDTH = canvas.width;
let HEIGHT = canvas.height;

const PREVIEW_W = 128;
const PREVIEW_H = 128;
const PREVIEW_PADDING = 10;


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
    // execute all nodes
    graph._nodes_in_order.forEach(n => n.onExecute());

    // render clicked node output
    const output = node?.getOutputData(0);
    if(output) renderNoise(output);
}

graphCanvas.onNodeSelected = node=>{
    activeNode=node;
    renderNode(activeNode);
};



// --- Example nodes ---
function syncWidgets(node) {
    if (!node.widgets) return;
    for (const w of node.widgets) {
        if (w.options?.property) {
            w.value = node.properties[w.options.property];
        }
    }
}

const p1=new PerlinNode();
p1.pos=[10,10];
p1.properties.frequency = 6.2;
p1.properties.octaves = 3;
p1.properties.amplitude=2.6;
p1.properties.offset=2.6;
graph.add(p1);
syncWidgets(p1)

const p2=new PerlinNode();
p2.pos=[10,350];
p2.properties.frequency=1.3;
p2.properties.amplitude=2.4;
p2.properties.offset=2.9;
graph.add(p2);
syncWidgets(p2)

const scale1 = new ScaleNode();
scale1.pos=[270,350];
scale1.properties.amount = 3.2;
graph.add(scale1);
syncWidgets(scale1)

p2.connect(0, scale1, 0)

const clamp1 = new ClampNode();
clamp1.pos=[530,350];
clamp1.properties.min = -3.3;
clamp1.properties.max = 0.75;
graph.add(clamp1)
syncWidgets(clamp1)

scale1.connect(0, clamp1, 0)

const addNode = new AddNode();
addNode.pos=[840,10];
graph.add(addNode);

p1.connect(0, addNode, 0)
clamp1.connect(0, addNode, 1)


const formXY = new FormulaXYNode();
formXY.properties.formula = "sqrt(pow(x - 0.5, 2) + pow(y - 0.5, 2)) - 0.3";
formXY.pos=[10,700];
graph.add(formXY);
syncWidgets(formXY);

const form2 = new Formula1Node();
form2.properties.formula = "-a";
form2.pos=[270,700];
graph.add(form2);
syncWidgets(form2);

formXY.connect(0, form2, 0);

const scale2 = new ScaleNode();
scale2.properties.amount = 10;
scale2.pos=[530,700];
graph.add(scale2);
syncWidgets(scale2);

form2.connect(0, scale2, 0);

const clamp2 = new ClampNode();
clamp2.pos=[790,700];
clamp2.properties.min = -5;
clamp2.properties.max = 0.22;
graph.add(clamp2);
syncWidgets(clamp2);

scale2.connect(0, clamp2, 0)


const addNode2 = new AddNode();
addNode2.pos=[1300,350];
graph.add(addNode2);
syncWidgets(addNode2);

addNode.connect(0, addNode2, 0)
clamp2.connect(0, addNode2, 1)

renderNode(addNode2)