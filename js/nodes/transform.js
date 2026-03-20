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

class OffsetNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { offsetX: 0, offsetY: 0 }; // normalized offsets
        this.addWidget("slider", "Offset X", this.properties.offsetX, { min: -1, max: 1, property: "offsetX" });
        this.addWidget("slider", "Offset Y", this.properties.offsetY, { min: -1, max: 1, property: "offsetY" });
        this.title = "Offset";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH * HEIGHT).fill(0);
        const out = new Array(WIDTH * HEIGHT);

        const ox = this.properties.offsetX * WIDTH;
        const oy = this.properties.offsetY * HEIGHT;

        const sample = (x, y) => {
            const ix = Math.max(0, Math.min(WIDTH - 1, Math.round(x)));
            const iy = Math.max(0, Math.min(HEIGHT - 1, Math.round(y)));
            return input[iy * WIDTH + ix];
        };

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                out[y * WIDTH + x] = sample(x - ox, y - oy);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Transform/Offset", OffsetNode);

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

class CartesianToPolar extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { scale: 1 };
        this.addWidget("slider", "Scale", this.properties.scale, { min: 0.1, max: 5, property: "scale" });
        this.title = "Cartesian to Polar";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH * HEIGHT).fill(0);
        const out = new Array(WIDTH * HEIGHT);

        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const maxRadius = Math.min(cx, cy) * this.properties.scale;

        const sample = (x, y) => {
            const ix = Math.max(0, Math.min(WIDTH - 1, Math.round(x)));
            const iy = Math.max(0, Math.min(HEIGHT - 1, Math.round(y)));
            return input[iy * WIDTH + ix];
        };

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {

                const dx = x - cx;
                const dy = y - cy;

                const radius = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx);

                // normalize angle 0..1
                const u = (angle + Math.PI) / (2 * Math.PI);
                // normalize radius 0..1
                const v = radius / maxRadius;

                // map into input space
                const sx = u * WIDTH;
                const sy = v * HEIGHT;

                out[y * WIDTH + x] = sample(sx, sy);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Transform/Cartesian to Polar", CartesianToPolar);


class PolarToCartesian extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { scale: 1 };
        this.addWidget("slider", "Scale", this.properties.scale, { min: 0.1, max: 5, property: "scale" });
        this.title = "Polar to Cartesian";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH * HEIGHT).fill(0);
        const out = new Array(WIDTH * HEIGHT);

        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const maxRadius = Math.min(cx, cy) * this.properties.scale;

        const sample = (x, y) => {
            const ix = Math.max(0, Math.min(WIDTH - 1, Math.round(x)));
            const iy = Math.max(0, Math.min(HEIGHT - 1, Math.round(y)));
            return input[iy * WIDTH + ix];
        };

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {

                // output space to polar coords
                const angle = (x / WIDTH) * 2 * Math.PI;
                const radius = (y / HEIGHT) * maxRadius;

                // convert to cartesian
                const sx = cx + Math.cos(angle) * radius;
                const sy = cy + Math.sin(angle) * radius;

                out[y * WIDTH + x] = sample(sx, sy);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Transform/Polar to Cartesian", PolarToCartesian);

class RadialWarpNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addInput("warp", "array"); // optional warp map
        this.addOutput("out", "array");

        this.properties = { angleStrength: 2, radiusStrength: 0 };
        this.addWidget("slider", "Angle Warp", this.properties.angleStrength, { min: -10, max: 10, property: "angleStrength" });
        this.addWidget("slider", "Radius Warp", this.properties.radiusStrength, { min: -2, max: 2, property: "radiusStrength" });

        this.title = "Radial Warp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const input = this.getInputData(0) || new Array(WIDTH*HEIGHT).fill(0);
        const warp = this.getInputData(1) || new Array(WIDTH*HEIGHT).fill(0);

        const out = new Array(WIDTH*HEIGHT);

        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const maxRadius = Math.min(cx, cy);

        const angleStrength = this.properties.angleStrength;
        const radiusStrength = this.properties.radiusStrength;

        const sample = (x, y) => {
            const ix = Math.max(0, Math.min(WIDTH-1, Math.round(x)));
            const iy = Math.max(0, Math.min(HEIGHT-1, Math.round(y)));
            return input[iy*WIDTH + ix];
        };

        for (let y=0; y<HEIGHT; y++) {
            for (let x=0; x<WIDTH; x++) {

                const dx = x - cx;
                const dy = y - cy;

                let radius = Math.sqrt(dx*dx + dy*dy);
                let angle = Math.atan2(dy, dx);

                const w = warp[y*WIDTH + x]; // 0..1

                // apply warp
                angle += (w - 0.5) * angleStrength;
                radius += (w - 0.5) * radiusStrength * maxRadius;

                // back to cartesian
                const sx = cx + Math.cos(angle) * radius;
                const sy = cy + Math.sin(angle) * radius;

                out[y*WIDTH + x] = sample(sx, sy);
            }
        }

        this.setOutputData(0, out);
        this.drawPreview(out);
    }
}

LiteGraph.registerNodeType("Transform/Radial Warp", RadialWarpNode);