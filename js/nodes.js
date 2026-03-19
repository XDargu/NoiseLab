LiteGraph.clearRegisteredTypes()

// --- Base node with preview canvas ---
class NoiseNode extends LGraphNode {
    constructor() {
        super();
        this.previewCanvas = document.createElement("canvas");
        this.previewCanvas.width = WIDTH;
        this.previewCanvas.height = HEIGHT;
        this.previewCtx = this.previewCanvas.getContext("2d");
    }

    onConnectionsChange()
    {
        this.onExecute();
        this.drawPreview(this.getOutputData(0))
    }

    onPropertyChanged()
    { 
        this.onExecute();
        this.drawPreview(this.getOutputData(0))
        renderNode(this)
    }

    drawPreview(noiseArray) {
        if (!noiseArray) return;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;
        const imgData = this.previewCtx.createImageData(w,h);
        const isTerrainMode = terrainModeCheck.checked;
        for (let y=0;y<h;y++){
            for (let x=0;x<w;x++){
                const nx = Math.floor(x/WIDTH*WIDTH);
                const ny = Math.floor(y/HEIGHT*HEIGHT);
                const v = Math.floor((noiseArray[ny*WIDTH+nx]+1)*127.5);
                const idx = (y*w+x)*4;
                const col = isTerrainMode ? heightToRGB(v) : null;

                imgData.data[idx+0] = col?.r || v;
                imgData.data[idx+1] = col?.g || v;
                imgData.data[idx+2] = col?.b || v;
                imgData.data[idx+3] = 255;
            }
        }
        this.previewCtx.putImageData(imgData,0,0);
    }

    onDrawBackground(ctx) {
        if (this.flags.collapsed)
            return;

        const h = this.size[1];
        const w = this.size[0];
        
        if (this.previewCanvas) {
            ctx.drawImage(this.previewCanvas, 
            0, 0, this.previewCanvas.width, this.previewCanvas.height, 
            (w - PREVIEW_W) * 0.5, h - PREVIEW_H - PREVIEW_PADDING * 0.5, PREVIEW_W, PREVIEW_H);
        }
    }
}

// --- Perlin Node ---
class PerlinNode extends NoiseNode {
    constructor() {
        super();
        this.addOutput("noise","array");
        this.properties = { frequency: 5, octaves: 1, amplitude: 1, offset: 0 };
        this.addWidget("slider","Frequency",this.properties.frequency,{min:0,max:20,property:"frequency"});
        this.addWidget("slider","Octaves",this.properties.octaves,{min:0,max:5,step:1,precision:0,property:"octaves"});
        this.addWidget("slider","Amplitude",this.properties.amplitude,{min:0,max:5,property:"amplitude"});
        this.addWidget("slider","Offset",this.properties.offset,{min:0,max:5,property:"offset"});
        this.simplex = new SimplexNoise();
        this.title="Perlin";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const freq = this.properties.frequency;
        const octaves = this.properties.octaves;
        const offset = this.properties.offset;
        let noiseArray = new Array(WIDTH*HEIGHT).fill(0);

        for(let y=0;y<HEIGHT;y++){
            for(let x=0;x<WIDTH;x++){
                let nx=x/WIDTH;
                let ny=y/HEIGHT;
                let val=0, amp=this.properties.amplitude, freqMult=1;
                for(let o=0;o<octaves;o++){
                    val += noise.perlin2(nx*freq*freqMult + offset, ny*freq*freqMult + offset)*amp;
                    amp*=0.5;
                    freqMult*=2;
                }
                noiseArray[y*WIDTH+x] = val;
            }
        }
        this.setOutputData(0,noiseArray);
        this.drawPreview(noiseArray);
    }
}
LiteGraph.registerNodeType("Generator/Perlin",PerlinNode);

// --- Simplex Node ---
class SimplexNode extends NoiseNode {
    constructor() {
        super();
        this.addOutput("noise","array");
        this.properties = { frequency: 5, octaves: 1, amplitude: 1, offset: 0 };
        this.addWidget("slider","Frequency",this.properties.frequency,{min:0,max:20,property:"frequency"});
        this.addWidget("slider","Octaves",this.properties.octaves,{min:0,max:5,step:1,precision:0,property:"octaves"});
        this.addWidget("slider","Amplitude",this.properties.amplitude,{min:0,max:5,property:"amplitude"});
        this.addWidget("slider","Offset",this.properties.offset,{min:0,max:5,property:"offset"});
        this.simplex = new SimplexNoise();
        this.title="Simplex";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const freq = this.properties.frequency;
        const octaves = this.properties.octaves;
        const offset = this.properties.offset;
        let noiseArray = new Array(WIDTH*HEIGHT).fill(0);

        for(let y=0;y<HEIGHT;y++){
            for(let x=0;x<WIDTH;x++){
                let nx=x/WIDTH;
                let ny=y/HEIGHT;
                let val=0, amp=this.properties.amplitude, freqMult=1;
                for(let o=0;o<octaves;o++){
                    val += this.simplex.noise2D(nx*freq*freqMult + offset, ny*freq*freqMult + offset)*amp;
                    amp*=0.5;
                    freqMult*=2;
                }
                noiseArray[y*WIDTH+x] = val;
            }
        }
        this.setOutputData(0,noiseArray);
        this.drawPreview(noiseArray);
    }
}
LiteGraph.registerNodeType("Generator/Simplex",SimplexNode);

// --- Directional Node ---
class DirectionalNoiseNode extends NoiseNode {
    constructor() {
        super();
        this.addOutput("noise","array");
        this.properties = { frequency: 5, stretch: 20, amplitude: 1, offset: 0, angle: 0 };
        this.addWidget("slider","Frequency",this.properties.frequency,{min:0,max:20,property:"frequency"});
        this.addWidget("slider","Stretch",this.properties.stretch,{min:0,max:50,property:"stretch"});
        this.addWidget("slider","Amplitude",this.properties.amplitude,{min:0,max:5,property:"amplitude"});
        this.addWidget("slider","Offset",this.properties.offset,{min:0,max:5,property:"offset"});
        this.addWidget("slider","Angle",this.properties.angle,{min:0,max: 360,property:"angle"});
        this.simplex = new SimplexNoise();
        this.title="DirectionalNoise";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const freq = this.properties.frequency;
        const offset = this.properties.offset;
        const angle = this.properties.angle / 360 * Math.PI * 2;
        const stretch = this.properties.stretch;
        const amp = this.properties.amplitude;
        let noiseArray = new Array(WIDTH*HEIGHT).fill(0);

        for(let y=0;y<HEIGHT;y++){
            for(let x=0;x<WIDTH;x++){
                let nx=x/WIDTH;
                let ny=y/HEIGHT;
                const val = directionalNoise((x, y) => { return this.simplex.noise2D(x*freq + offset, y*freq + offset)*amp }, nx, ny, angle, stretch);
                noiseArray[y*WIDTH+x] = val;
            }
        }

        this.setOutputData(0,noiseArray);
        this.drawPreview(noiseArray);
    }
}
LiteGraph.registerNodeType("Generator/DirectionalNoise",DirectionalNoiseNode);

class FormulaXYNode extends NoiseNode {
    constructor(){
        super();
        this.properties = { formula: "x*y" }; // Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2)) - 0.3 <- circle
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        this.addOutput("out","array");
        this.title = "FormulaXYNode";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }
    onExecute(){
        let noiseArray = new Array(WIDTH*HEIGHT).fill(0);

        try
        {
            const formula = this.properties.formula;
            const f = compile(formula, ["x", "y"]);

            for(let ypos=0;ypos<HEIGHT;ypos++){
                for(let xpos=0;xpos<WIDTH;xpos++){
                    let x = xpos/WIDTH;
                    let y = ypos/HEIGHT;
                    const val = f(x, y)
                    noiseArray[ypos*WIDTH+xpos] = val;
                }
            }
        }
        catch(e)
        {
            // TODO: Display error!
            noiseArray = new Array(WIDTH*HEIGHT).fill(0);
            this.add
        }
        
        this.setOutputData(0,noiseArray);
        this.drawPreview(noiseArray);
    }
}
LiteGraph.registerNodeType(`Generator/FormulaXY`, FormulaXYNode);


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
LiteGraph.registerNodeType(`Function/Add`, AddNode);

class MultiplyNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Multiply")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>a*b)
    }
}
LiteGraph.registerNodeType(`Function/Multiply`, MultiplyNode);

class SubtractNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Subtract")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>a-b)
    }
}
LiteGraph.registerNodeType(`Function/Subtract`, SubtractNode);

class MaxNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Max")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>Math.max(a,b))
    }
}
LiteGraph.registerNodeType(`Function/Max`, MaxNode);

class MinNode extends NoiseNode {
    constructor(){
        super();
        initBinaryOp(this, "Min")
    }
    onExecute(){
        executeBinaryOp(this, (a,b)=>Math.min(a,b))
    }
}
LiteGraph.registerNodeType(`Function/Min`, MinNode);

class Formula2Node extends NoiseNode {
    constructor(){
        super();
        this.properties = { formula: "a+b" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        initBinaryOp(this, "Formula2")
    }
    onExecute(){
        const f = compile(this.properties.formula, ["a", "b", "x", "y"]);
        executeBinaryOp(this, (a,b,x,y)=>f(a, b, x, y))
    }
}
LiteGraph.registerNodeType(`Function/Formula2`, Formula2Node);

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
LiteGraph.registerNodeType(`Function/Abs`, AbsNode);

class Formula1Node extends NoiseNode {
    constructor(){
        super();
        this.properties = { formula: "a*a" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        initUnaryOp(this, "Formula1")
    }
    onExecute(){
        const f = compile(this.properties.formula, ["a", "x", "y"]);
        executeUnaryOp(this, (a, x, y)=>f(a, x, y))
    }
}
LiteGraph.registerNodeType(`Function/Formula1`, Formula1Node);


// Other nodes
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
LiteGraph.registerNodeType("Function/Scale",ScaleNode);

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
LiteGraph.registerNodeType("Function/Clamp",ClampNode);

// Other nodes
class BlurNode extends NoiseNode {
    constructor(){
        super();
        this.addInput("value","array");
        this.addOutput("out","array");
        this.properties = { amount : 2 };
        this.addWidget("slider","Amount", this.properties.amount,{min:1,max: 10, property:"amount"});
        this.title="Blur";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }
    
    onExecute(){

        
        const input=this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const amount = Math.max(1, Math.floor(this.properties.amount));
        const out = new Array(WIDTH * HEIGHT).fill(0);

        // define a simple box kernel size based on amount
        const kernelSize = amount * 2 + 1; // e.g., amount=2 => 5x5 kernel
        const kernelArea = kernelSize * kernelSize;

        // helper to safely get input with edge clamping
        const sample = (x, y) => {
            x = Math.max(0, Math.min(WIDTH - 1, x));
            y = Math.max(0, Math.min(HEIGHT - 1, y));
            return input[y * WIDTH + x];
        };

        for (let ypos = 0; ypos < HEIGHT; ypos++) {
            for (let xpos = 0; xpos < WIDTH; xpos++) {
                let sum = 0;

                // sum all neighbors within kernel
                for (let ky = -amount; ky <= amount; ky++) {
                    for (let kx = -amount; kx <= amount; kx++) {
                        sum += sample(xpos + kx, ypos + ky);
                    }
                }

                // average to get blurred value
                out[ypos * WIDTH + xpos] = sum / kernelArea;
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Function/Blur",BlurNode);

class SobelNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.title = "Sobel Edge";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH * HEIGHT).fill(0);
        const out = new Array(WIDTH * HEIGHT).fill(0);

        // Sobel kernels
        const kernelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        const kernelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        const sample = (x, y) => {
            x = Math.max(0, Math.min(WIDTH - 1, x));
            y = Math.max(0, Math.min(HEIGHT - 1, y));
            return input[y * WIDTH + x];
        };

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const val = sample(x + kx, y + ky);
                        gx += val * kernelX[ky + 1][kx + 1];
                        gy += val * kernelY[ky + 1][kx + 1];
                    }
                }

                // edge magnitude
                out[y * WIDTH + x] = Math.sqrt(gx * gx + gy * gy);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Function/Sobel", SobelNode);

class PosterizeNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { levels: 4 }; // number of steps
        this.addWidget("slider", "Levels", this.properties.levels, { min: 2, max: 20, step: 1, precision: 0, property: "levels" });
        this.title = "Posterize";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH * HEIGHT).fill(0);
        const levels = Math.max(2, Math.floor(this.properties.levels));
        const out = new Array(WIDTH * HEIGHT);

        for (let i = 0; i < input.length; i++) {
            // map value 0..1 to discrete steps
            let v = input[i];
            let step = Math.floor(v * levels);      // step index
            out[i] = step / (levels - 1);          // normalize back to 0..1
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Function/Posterize", PosterizeNode);