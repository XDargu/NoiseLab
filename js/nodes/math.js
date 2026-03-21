// --- Binary Function Nodes ---
function initBinaryOp(node, name)
{
    node.addInput("A","array");
    node.addInput("B","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

function executeBinaryOp(node, op, key=node.title, uniformValues = {}, uniformDeclarations = []) {
    node.updateInputTexture(0, node.getInputData(0));
    node.updateInputTexture(1, node.getInputData(1));

    const uniformsCode = uniformDeclarations.join("\n");

    const fs = `#version 300 es
    precision highp float;
    ${uniformsCode}
    uniform sampler2D tex0;
    uniform sampler2D tex1;
    in vec2 vUv;
    out vec4 fragColor;
    void main(){
        float a = texture(tex0, vUv).r;
        float b = texture(tex1, vUv).r;
        fragColor = vec4(${op}, 0.0, 0.0, 1.0);
    }`;

    node.runShader(key, fs, 2, uniformValues);
    node.setOutputTexture();
    node.drawPreviewTexture();
}

class AddNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Add")
    }
    onExecute(){
        executeBinaryOp(this, 'a+b')
    }
}
LiteGraph.registerNodeType(`Math/Add`, AddNode);

class MultiplyNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Multiply")
    }
    onExecute(){
        executeBinaryOp(this, 'a*b')
    }
}
LiteGraph.registerNodeType(`Math/Multiply`, MultiplyNode);

class SubtractNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Subtract")
    }
    onExecute(){
        executeBinaryOp(this, 'a-b')
    }
}
LiteGraph.registerNodeType(`Math/Subtract`, SubtractNode);

class MaxNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Max")
    }
    onExecute(){
        executeBinaryOp(this, 'max(a,b)')
    }
}
LiteGraph.registerNodeType(`Math/Max`, MaxNode);

class MinNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Min")
    }
    onExecute(){
        executeBinaryOp(this, 'min(a,b)')
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

function executeUnaryOp(node, op, key=node.title, uniformValues = {}, uniformDeclarations = []) {
    node.updateInputTexture(0, node.getInputData(0));

    const uniformsCode = uniformDeclarations.join("\n");

    const fs = `#version 300 es
    precision highp float;
    ${uniformsCode}
    uniform sampler2D tex0;
    in vec2 vUv;
    out vec4 fragColor;
    void main(){
        float a = texture(tex0, vUv).r;
        fragColor = vec4(${op}, 0.0, 0.0, 1.0);
    }`;

    node.runShader(key, fs, 1, uniformValues);
    node.setOutputTexture();
    node.drawPreviewTexture();
}

class AbsNode extends GPUNodeBase {
    constructor(){
        super();
        initUnaryOp(this, "Abs")
    }
    onExecute(){
        executeUnaryOp(this, 'abs(a)')
    }
}
LiteGraph.registerNodeType(`Math/Abs`, AbsNode);

class ScaleNode extends GPUNodeBase {
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
        executeUnaryOp(
            this,
            'a*amount',
            'scale_uniform',
            { amount: this.properties.amount },
            ['uniform float amount;']
        );
    }
}
LiteGraph.registerNodeType("Math/Scale",ScaleNode);

class ClampNode extends GPUNodeBase {
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
        executeBinaryOp(
            this,
            'clamp(a, minValue, maxValue)',
            'clamp_uniforms',
            { minValue: this.properties.min, maxValue: this.properties.max },
            ['uniform float minValue;', 'uniform float maxValue;']
        );
    }
}
LiteGraph.registerNodeType("Math/Clamp",ClampNode);

class SaturateNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Saturate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        executeUnaryOp(this, `clamp(a, 0.0, 1.0)`);
    }
}

LiteGraph.registerNodeType("Math/Saturate", SaturateNode);

/*class NormalizeNode extends NoiseNode {
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

LiteGraph.registerNodeType("Math/Normalize", NormalizeNode);*/

class InvertNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Invert";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        executeUnaryOp(this, `1.0 - a`);
    }
}

LiteGraph.registerNodeType("Math/Invert", InvertNode);