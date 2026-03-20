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
                noiseArray[y*WIDTH+x] = (val + 1) * 0.5;
            }
        }
        this.setOutputData(0,noiseArray);
        this.drawPreview(noiseArray);
    }
}
LiteGraph.registerNodeType("Generator/Perlin",PerlinNode);

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
                noiseArray[y*WIDTH+x] = (val + 1) * 0.5;
            }
        }
        this.setOutputData(0,noiseArray);
        this.drawPreview(noiseArray);
    }
}
LiteGraph.registerNodeType("Generator/Simplex",SimplexNode);

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
                noiseArray[y*WIDTH+x] = (val + 1) * 0.5;
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

class CheckerboardNode extends NoiseNode {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { size: 32 };
        this.addWidget("slider", "Size", this.properties.size, { min: 1, max: 128, property: "size" });
        this.title = "Checkerboard";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const out = new Array(WIDTH * HEIGHT);
        const s = Math.max(1, Math.floor(this.properties.size));

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const val = ((Math.floor(x / s) + Math.floor(y / s)) % 2);
                out[y * WIDTH + x] = val;
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Generator/Checkerboard", CheckerboardNode);

class VoronoiNode extends NoiseNode {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { points: 10, seed: 1 };
        this.addWidget("slider", "Points", this.properties.points, { min: 1, max: 100, step: 1, precision: 0, property: "points" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, precision: 0, property: "seed" });
        this.title = "Voronoi";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const out = new Array(WIDTH*HEIGHT);
        const numPoints = Math.max(1, Math.floor(this.properties.points));
        const rng = new RNG(this.properties.seed);

        const points = [];
        for (let i=0; i<numPoints; i++){
            points.push([rng.nextFloatRange(0, WIDTH), rng.nextFloatRange(0, HEIGHT)]);
        }

        for (let y=0; y<HEIGHT; y++){
            for (let x=0; x<WIDTH; x++){
                let closest = Infinity;
                for (let p of points){
                    const dx = x - p[0], dy = y - p[1];
                    closest = Math.min(closest, Math.sqrt(dx*dx + dy*dy));
                }
                out[y*WIDTH + x] = closest / Math.sqrt(WIDTH*WIDTH + HEIGHT*HEIGHT);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Generator/Voronoi", VoronoiNode);

class CircleNode extends NoiseNode {
    constructor() {
        super();
        this.addOutput("out","array");
        this.properties = { radius: 0.25, x:0.5, y:0.5 }; // normalized coords
        this.addWidget("slider","Radius",this.properties.radius,{min:0,max:0.5,property:"radius"});
        this.addWidget("slider","X",this.properties.x,{min:0,max:1,property:"x"});
        this.addWidget("slider","Y",this.properties.y,{min:0,max:1,property:"y"});
        this.title="Circle";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const out = new Array(WIDTH*HEIGHT);
        const cx = this.properties.x*WIDTH;
        const cy = this.properties.y*HEIGHT;
        const r = this.properties.radius * Math.min(WIDTH, HEIGHT);

        for(let y=0;y<HEIGHT;y++){
            for(let x=0;x<WIDTH;x++){
                const dx = x - cx;
                const dy = y - cy;
                out[y*WIDTH + x] = (dx*dx + dy*dy) <= r*r ? 1 : 0;
            }
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Generator/Circle",CircleNode);