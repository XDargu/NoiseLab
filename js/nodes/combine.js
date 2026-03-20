class MaskBlendNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("A","array");
        this.addInput("B","array");
        this.addInput("Mask","array");
        this.addOutput("out","array");
        this.properties = {};
        this.title="Mask Blend";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const A = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const B = this.getInputData(1) || new Array(WIDTH*HEIGHT).fill(0);
        const mask = this.getInputData(2) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);

        for(let i=0;i<WIDTH*HEIGHT;i++){
            out[i] = mask[i]*A[i] + (1-mask[i])*B[i];
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Combine/Mask Blend",MaskBlendNode);

class MixNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("A", "array");
        this.addInput("B", "array");
        this.addOutput("out", "array");
        this.properties = { t: 0.5 };
        this.addWidget("slider", "Factor", this.properties.t, { min: 0, max: 1, property: "t" });
        this.title = "Mix / Lerp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const A = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const B = this.getInputData(1) || new Array(WIDTH*HEIGHT).fill(0);
        const t = this.properties.t;
        const out = new Array(WIDTH*HEIGHT);

        for(let i=0;i<WIDTH*HEIGHT;i++){
            out[i] = A[i]*(1-t) + B[i]*t;
        }

        this.setOutputData(0,out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Combine/Mix", MixNode);