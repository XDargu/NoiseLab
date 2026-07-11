class ImageUploadNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = {
            imageId: null,
            fileName: "No image",
            fit: "Cover"
        };

        this.addWidget("button", "Upload", "", () => this.pickImage());
        this.fileWidget = this.addWidget("text", "File", this.properties.fileName, { property: "fileName" });
        this.addWidget("combo", "Fit", this.properties.fit, {
            values: ["Cover", "Contain", "Stretch"],
            property: "fit"
        });

        this.title = "Image";
        this.size[0] = Math.max(this.size[0], 220);
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;

        this._image = null;
        this._loadingImageId = null;
        this._loadedImageId = null;
        this._renderedImageId = null;
        this._renderedFit = null;
    }

    onConfigure() {
        this.updateFileWidget();
        if (this.properties.imageId)
            this.loadImageFromStore();
    }

    updateFileWidget() {
        if (this.fileWidget)
            this.fileWidget.value = this.properties.fileName || "No image";
    }

    pickImage() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async () => {
            const file = input.files && input.files[0];
            if (!file)
                return;

            try {
                const record = await NoiseLabStorage.saveImage(file);
                this.properties.imageId = record.id;
                this.properties.fileName = record.name;
                this.updateFileWidget();
                await this.loadImageFromStore(true);
                this.onExecute();
                renderNode(this);
                autoSaveGraph();
                graphCanvas.draw(true, true);
                updateStorageUsageIndicator();
            }
            catch (err) {
                alert("Failed to store image: " + err.message);
            }
        };

        input.click();
    }

    loadImageFromStore(force = false) {
        const imageId = this.properties.imageId;

        if (!imageId)
            return Promise.resolve(null);

        if (!force && this._loadedImageId == imageId && this._image)
            return Promise.resolve(this._image);

        if (!force && this._loadingImageId == imageId)
            return this._loadingPromise;

        this._loadingImageId = imageId;
        this._loadingPromise = NoiseLabStorage.getImage(imageId)
            .then(record => {
                if (!record)
                    throw new Error("The image could not be found in local storage.");

                if (!this.properties.fileName || this.properties.fileName == "No image") {
                    this.properties.fileName = record.name || "Image";
                    this.updateFileWidget();
                }

                return this.decodeImage(record.blob);
            })
            .then(image => {
                this._image = image;
                this._loadedImageId = imageId;
                this._renderedImageId = null;
                this._loadingImageId = null;
                this.onExecute();
                graphCanvas.draw(true, true);
                return image;
            })
            .catch(err => {
                this._loadingImageId = null;
                console.error(err);
                return null;
            });

        return this._loadingPromise;
    }

    decodeImage(blob) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const image = new Image();

            image.onload = () => {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("The selected file could not be decoded as an image."));
            };

            image.src = url;
        });
    }

    clearOutputTexture() {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    imageToFloatData(image) {
        const canvas = document.createElement("canvas");
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        let drawX = 0;
        let drawY = 0;
        let drawW = WIDTH;
        let drawH = HEIGHT;
        const imageAspect = image.width / image.height;
        const outputAspect = WIDTH / HEIGHT;

        if (this.properties.fit == "Contain") {
            if (imageAspect > outputAspect) {
                drawW = WIDTH;
                drawH = WIDTH / imageAspect;
            }
            else {
                drawH = HEIGHT;
                drawW = HEIGHT * imageAspect;
            }

            drawX = (WIDTH - drawW) * 0.5;
            drawY = (HEIGHT - drawH) * 0.5;
        }
        else if (this.properties.fit == "Cover") {
            if (imageAspect > outputAspect) {
                drawH = HEIGHT;
                drawW = HEIGHT * imageAspect;
            }
            else {
                drawW = WIDTH;
                drawH = WIDTH / imageAspect;
            }

            drawX = (WIDTH - drawW) * 0.5;
            drawY = (HEIGHT - drawH) * 0.5;
        }

        ctx.drawImage(image, drawX, drawY, drawW, drawH);

        const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
        const values = new Float32Array(WIDTH * HEIGHT);

        for (let y = 0; y < HEIGHT; y++) {
            const sourceY = HEIGHT - 1 - y;

            for (let x = 0; x < WIDTH; x++) {
                const sourceIndex = (sourceY * WIDTH + x) * 4;
                const r = pixels[sourceIndex] / 255;
                const g = pixels[sourceIndex + 1] / 255;
                const b = pixels[sourceIndex + 2] / 255;
                const a = pixels[sourceIndex + 3] / 255;
                values[y * WIDTH + x] = (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
            }
        }

        return values;
    }

    uploadImageToTexture() {
        const gl = this.gl;
        const values = this.imageToFloatData(this._image);

        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WIDTH, HEIGHT, gl.RED, gl.FLOAT, values);

        this._renderedImageId = this.properties.imageId;
        this._renderedFit = this.properties.fit;
    }

    onExecute() {
        if (!this.properties.imageId) {
            this.clearOutputTexture();
            this.setOutputTexture();
            this.drawPreviewTexture();
            return;
        }

        if (!this._image || this._loadedImageId != this.properties.imageId) {
            this.loadImageFromStore();
            this.setOutputTexture();
            return;
        }

        if (this._renderedImageId != this.properties.imageId || this._renderedFit != this.properties.fit)
            this.uploadImageToTexture();

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Image", ImageUploadNode);
