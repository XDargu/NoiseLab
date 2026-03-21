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
        if (isLoadingGraph) return;

        this.onExecute();
        this.drawPreview(this.getOutputData(0))
    }

    onPropertyChanged()
    { 
        if (isLoadingGraph) return;

        this.onExecute();
        this.drawPreview(this.getOutputData(0))
        renderNode(this)

        // Needed to save changes of props
        autoSaveGraph();
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
                const v = Math.floor(noiseArray[ny*WIDTH+nx]*255);
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