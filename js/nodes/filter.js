// Other nodes
class BlurNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { amount: 2, passes: 3 };
        this.addWidget("slider", "Amount", this.properties.amount, { min: 1, max: 10, property: "amount" });
        this.addWidget("slider", "Passes", this.properties.passes, { min: 1, max: 5, step: 1, property: "passes" });
        this.title = "Blur";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    boxBlur(input, amount) {
        const temp = new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT).fill(0);
        const kernelSize = amount*2+1;

        // Horizontal pass
        for(let y=0;y<HEIGHT;y++){
            let sum=0;
            for(let kx=-amount;kx<=amount;kx++){
                let x = Math.max(0, Math.min(WIDTH-1, kx));
                sum += input[y*WIDTH + x];
            }
            for(let x=0;x<WIDTH;x++){
                temp[y*WIDTH + x] = sum / kernelSize;
                let remove = input[y*WIDTH + Math.max(0, x-amount)];
                let add = input[y*WIDTH + Math.min(WIDTH-1, x+amount+1)];
                sum = sum - remove + add;
            }
        }

        // Vertical pass
        for(let x=0;x<WIDTH;x++){
            let sum=0;
            for(let ky=-amount;ky<=amount;ky++){
                let y = Math.max(0, Math.min(HEIGHT-1, ky));
                sum += temp[y*WIDTH + x];
            }
            for(let y=0;y<HEIGHT;y++){
                out[y*WIDTH + x] = sum / kernelSize;
                let remove = temp[Math.max(0, y-amount)*WIDTH + x];
                let add = temp[Math.min(HEIGHT-1, y+amount+1)*WIDTH + x];
                sum = sum - remove + add;
            }
        }

        return out;
    }

    onExecute() {
        let input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const amount = Math.max(1, Math.floor(this.properties.amount));
        const passes = Math.max(1, Math.floor(this.properties.passes));

        let out = input;
        for(let i=0;i<passes;i++){
            out = this.boxBlur(out, amount);
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Filter/Blur", BlurNode);

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

LiteGraph.registerNodeType("Filter/Sobel", SobelNode);

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

LiteGraph.registerNodeType("Filter/Posterize", PosterizeNode);

class PixelateNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.properties = { pixelSize: 8 };
        this.addWidget("slider","Pixel Size",this.properties.pixelSize,{min:1,max:64,property:"pixelSize"});
        this.title="Pixelate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);
        const size = Math.max(1, Math.floor(this.properties.pixelSize));

        for(let y=0;y<HEIGHT;y++){
            for(let x=0;x<WIDTH;x++){
                const px = Math.floor(x/size)*size;
                const py = Math.floor(y/size)*size;
                const val = input[py*WIDTH + px];
                out[y*WIDTH + x] = val;
            }
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Filter/Pixelate",PixelateNode);

class ThresholdNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.properties = { threshold: 0.5, soft: 0 };
        this.addWidget("slider","Threshold",this.properties.threshold,{min:0,max:1,property:"threshold"});
        this.addWidget("slider","Soft",this.properties.soft,{min:0,max:0.5,property:"soft"});
        this.title = "Threshold / Mask";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const t = this.properties.threshold;
        const s = this.properties.soft;
        const out = new Array(WIDTH*HEIGHT);

        if(s <= 0){
            // hard threshold
            for(let i=0;i<WIDTH*HEIGHT;i++){
                out[i] = input[i] >= t ? 1 : 0;
            }
        } else {
            // soft threshold using smoothstep
            const smoothstep = (edge0, edge1, x) => {
                const t = Math.max(0, Math.min(1, (x - edge0)/(edge1 - edge0)));
                return t*t*(3-2*t);
            };
            const edge0 = t - s;
            const edge1 = t + s;
            for(let i=0;i<WIDTH*HEIGHT;i++){
                out[i] = smoothstep(edge0, edge1, input[i]);
            }
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Filter/Threshold", ThresholdNode);