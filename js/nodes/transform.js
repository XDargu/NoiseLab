class WarpNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addInput("warp", "array");
        this.addOutput("out", "array");
        this.properties = { intensity: 5 };
        this.addWidget("slider", "Intensity", this.properties.intensity, { min: 0, max: 50, property: "intensity" });
        this.title = "Warp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const warp = this.getInputData(1) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);
        const intensity = this.properties.intensity;

        const sample = (arr, x, y) => {
            const ix = Math.max(0, Math.min(WIDTH-1, Math.round(x)));
            const iy = Math.max(0, Math.min(HEIGHT-1, Math.round(y)));
            return arr[iy*WIDTH + ix];
        };

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const offset = warp[y*WIDTH + x] * intensity;
                out[y*WIDTH + x] = sample(input, x + offset, y + offset);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Transform/Warp", WarpNode);

class RotateNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { angle: 0 };
        this.addWidget("slider", "Angle", this.properties.angle, { min: 0, max: 360, property: "angle" });
        this.title = "Rotate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);
        const angle = this.properties.angle * Math.PI / 180;
        const cx = WIDTH/2, cy = HEIGHT/2;
        const cos = Math.cos(-angle), sin = Math.sin(-angle);

        const sample = (x, y) => {
            x = Math.max(0, Math.min(WIDTH-1, x));
            y = Math.max(0, Math.min(HEIGHT-1, y));
            return input[y*WIDTH + x];
        };

        for (let y=0; y<HEIGHT; y++) {
            for (let x=0; x<WIDTH; x++) {
                const dx = x - cx, dy = y - cy;
                const sx = Math.round(cos*dx - sin*dy + cx);
                const sy = Math.round(sin*dx + cos*dy + cy);
                out[y*WIDTH + x] = sample(sx, sy);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Transform/Rotate", RotateNode);

class MirrorNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { horizontal: true, vertical: false };
        this.addWidget("toggle", "Horizontal", this.properties.horizontal, { property: "horizontal" });
        this.addWidget("toggle", "Vertical", this.properties.vertical, { property: "vertical" });
        this.title = "Mirror";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);

        for (let y=0; y<HEIGHT; y++) {
            for (let x=0; x<WIDTH; x++) {
                let sx = this.properties.horizontal ? WIDTH-1 - x : x;
                let sy = this.properties.vertical ? HEIGHT-1 - y : y;
                out[y*WIDTH + x] = input[sy*WIDTH + sx];
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}
LiteGraph.registerNodeType("Transform/Mirror", MirrorNode);

class StretchNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { scaleX: 1, scaleY: 1 };
        this.addWidget("slider", "Scale X", this.properties.scaleX, { min: 0.1, max: 5, property: "scaleX" });
        this.addWidget("slider", "Scale Y", this.properties.scaleY, { min: 0.1, max: 5, property: "scaleY" });
        this.title = "Stretch";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const out = new Array(WIDTH*HEIGHT);

        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;

        const sx = this.properties.scaleX;
        const sy = this.properties.scaleY;

        const sample = (x, y) => {
            const ix = Math.max(0, Math.min(WIDTH - 1, Math.round(x)));
            const iy = Math.max(0, Math.min(HEIGHT - 1, Math.round(y)));
            return input[iy * WIDTH + ix];
        };

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {

                // move to center
                let dx = x - cx;
                let dy = y - cy;

                // inverse scale (important!)
                dx /= sx;
                dy /= sy;

                // back to image space
                const sxp = dx + cx;
                const syp = dy + cy;

                out[y * WIDTH + x] = sample(sxp, syp);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Transform/Stretch", StretchNode);