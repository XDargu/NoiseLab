// --- Binary Function Nodes ---
function initBinaryOp(node, name)
{
    node.addInput("A","array");
    node.addInput("B","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

function executeBinaryOp(node, func)
{
    const a=node.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
    const b=node.getInputData(1) || new Array(WIDTH*HEIGHT).fill(0);
    const out = a.map((v, i) => {
        const x = i % WIDTH;
        const y = i / WIDTH;
        return func(v, b[i], x / WIDTH, y / HEIGHT);
    });
    node.setOutputData(0,out);
    node.drawPreview(out);
}

class AddNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Add")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>a+b)
    }
}
LiteGraph.registerNodeType(`Math/Add`, AddNode);

class MultiplyNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Multiply")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>a*b)
    }
}
LiteGraph.registerNodeType(`Math/Multiply`, MultiplyNode);

class SubtractNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Subtract")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>a-b)
    }
}
LiteGraph.registerNodeType(`Math/Subtract`, SubtractNode);

class MaxNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Max")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>Math.max(a,b))
    }
}
LiteGraph.registerNodeType(`Math/Max`, MaxNode);

class MinNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Min")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>Math.min(a,b))
    }
}
LiteGraph.registerNodeType(`Math/Min`, MinNode);

// --- Unary Function Nodes ---
function initUnaryOp(node, name)
{
    node.addInput("A","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

function executeUnaryOp(node, func)
{
    const a=node.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
    const out = a.map((v, i) => {
        const x = i % WIDTH;
        const y = i / WIDTH;
        return func(v, x / WIDTH, y / HEIGHT);
    });
    node.setOutputData(0,out);
    node.drawPreview(out);
}

class AbsNode extends NoiseNode {
    constructor(){
        super();
        initUnaryOp(this, "Abs")
    }
    onExecute(){
        executeUnaryOp(this, (a)=>Math.abs(a))
    }
}
LiteGraph.registerNodeType(`Math/Abs`, AbsNode);

class ScaleNode extends NoiseNode {
    constructor(){
        super();
        this.addInput("value","array");
        this.addOutput("out","array");
        this.properties = { amount : 2 };
        this.addWidget("slider","Amount", this.properties.amount,{min:-10,max: 10, property:"amount"});
        this.title="Scale";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }
    
    onExecute(){
        const input=this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const amount=this.properties.amount;
        const out=input.map(v=>v*amount);
        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Math/Scale",ScaleNode);

class ClampNode extends NoiseNode {
    constructor(){
        super();
        this.addInput("value","array");
        this.addOutput("out","array");
        this.properties={min:-1, max:1};
        this.addWidget("slider","Min", this.properties.min,{min:-5,max: 5, property:"min"});
        this.addWidget("slider","Max", this.properties.max,{min:-5,max: 5, property:"max"});
        this.title="Clamp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }
    
    onExecute(){
        const input=this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const min=this.properties.min;
        const max=this.properties.max;
        const out=input.map(v=>Math.max(min,Math.min(max,v)));
        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Math/Clamp",ClampNode);

class SaturateNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Saturate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);

        for (let i = 0; i < input.length; i++) {
            const v = input[i];
            out[i] = v < 0 ? 0 : (v > 1 ? 1 : v);
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Math/Saturate", SaturateNode);

class NormalizeNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Normalize";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);

        let min = Infinity;
        let max = -Infinity;

        // find min/max
        for(let i=0;i<input.length;i++){
            const v = input[i];
            if(v < min) min = v;
            if(v > max) max = v;
        }

        const range = max - min || 1; // avoid div by 0

        // normalize
        for(let i=0;i<input.length;i++){
            out[i] = (input[i] - min) / range;
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Math/Normalize", NormalizeNode);

class InvertNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Invert";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);

        for(let i=0;i<input.length;i++){
            out[i] = 1 - input[i];
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Math/Invert", InvertNode);