class MinMaxDisplayNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");

        this.title = "Min/Max";

        this._min = 0;
        this._max = 0;

        this.size = [160, 80];
    }

    onExecute() {
        const input = this.getInputData(0);
        if (!input || input.length === 0) return;

        let min = Infinity;
        let max = -Infinity;

        // fast loop (no for..of)
        for (let i = 0; i < input.length; i++) {
            const v = input[i];
            if (v < min) min = v;
            if (v > max) max = v;
        }

        this._min = min;
        this._max = max;
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;

        ctx.fillStyle = "#AAA";
        ctx.font = "12px monospace";

        ctx.fillText(`min: ${this._min.toFixed(3)}`, 10, 45);
        ctx.fillText(`max: ${this._max.toFixed(3)}`, 10, 65);
    }
}

LiteGraph.registerNodeType("Utility/MinMax Display", MinMaxDisplayNode);

class HistogramDisplayNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");

        this.properties = {
            bins: 32,
            min: 0,
            max: 1
        };

        this.addWidget("slider", "Bins", this.properties.bins, {
            min: 4, max: 128, step: 1, property: "bins"
        });

        this.addWidget("number", "Min", this.properties.min, {
            property: "min"
        });

        this.addWidget("number", "Max", this.properties.max, {
            property: "max"
        });

        this.title = "Histogram";

        this._hist = new Array(128).fill(0);
        this._maxCount = 1;

        // debug info
        this._underflow = 0;
        this._overflow = 0;

        this.size = [220, 200];
    }

    onExecute() {
        const input = this.getInputData(0);
        if (!input || input.length === 0) return;

        const bins = Math.floor(this.properties.bins);
        const hist = this._hist;

        const min = this.properties.min;
        const max = this.properties.max;
        const range = max - min || 1e-6;

        // reset
        for (let i = 0; i < bins; i++) hist[i] = 0;

        let under = 0;
        let over = 0;

        // build histogram
        for (let i = 0; i < input.length; i++) {
            const v = input[i];

            if (v < min) {
                under++;
                continue;
            }
            if (v > max) {
                over++;
                continue;
            }

            let t = (v - min) / range;
            let idx = (t * bins) | 0;
            if (idx >= bins) idx = bins - 1;

            hist[idx]++;
        }

        this._underflow = under;
        this._overflow = over;

        // normalize
        let maxCount = 1;
        for (let i = 0; i < bins; i++) {
            if (hist[i] > maxCount) maxCount = hist[i];
        }

        this._maxCount = maxCount;
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;

        const bins = Math.floor(this.properties.bins);
        const hist = this._hist;
        const maxCount = this._maxCount;

        const w = this.size[0] - 20;
        const h = this.size[1] - 130;

        const x0 = 10;
        const y0 = this.size[1] - 20;

        const barW = w / bins;

        // background
        ctx.fillStyle = "#111";
        ctx.fillRect(x0, y0 - h, w, h);

        // bars
        ctx.fillStyle = "#6CF";

        for (let i = 0; i < bins; i++) {
            const v = hist[i] / maxCount;
            const bh = v * h;

            ctx.fillRect(
                x0 + i * barW,
                y0 - bh,
                Math.max(1, barW - 1),
                bh
            );
        }

        // border
        ctx.strokeStyle = "#555";
        ctx.strokeRect(x0, y0 - h, w, h);

        // labels
        ctx.fillStyle = "#AAA";
        ctx.font = "10px monospace";

        const minStr = this.properties.min.toFixed(2);
        const maxStr = this.properties.max.toFixed(2);

        ctx.fillText(minStr, x0, y0 + 10);
        ctx.fillText(maxStr, x0 + w - 30, y0 + 10);

        // under/overflow indicators
        if (this._underflow > 0 || this._overflow > 0) {
            ctx.fillStyle = "#F66";
            ctx.fillText(
                `under: ${this._underflow}  over: ${this._overflow}`,
                x0,
                y0 - h - 2
            );
        }
    }
}

LiteGraph.registerNodeType("Utility/Histogram Display", HistogramDisplayNode);