// Other nodes
class BlurNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { amount: 2, passes: 3 };
        this.addWidget("slider", "Amount", this.properties.amount, { min: 1, max: 10, property: "amount" });
        this.addWidget("slider", "Passes", this.properties.passes, { min: 1, max: 5, step: 1, precision: 0, property: "passes" });
        this.title = "Blur";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    runPass(direction, normalizedRadius) {
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform vec2 direction;
        uniform float normalizedRadius;

        void main() {
            vec2 texSize = vec2(textureSize(tex0, 0));
            float radiusInPixels = normalizedRadius * max(texSize.x, texSize.y);
            vec2 texel = 1.0 / texSize * 5.0;
            float sum = 0.0;
            float count = 0.0;

            for(int i=-10; i<=10; i++){
                float fi = float(i);
                if(abs(fi) > radiusInPixels) continue;
                vec2 offset = direction * texel * fi;
                sum += texture(tex0, vUv + offset).r;
                count += 1.0;
            }

            fragColor = vec4(vec3(sum/count),1.0);
        }`;

        this.runShader(
            "blur_pass",
            frag,
            1,
            { direction, normalizedRadius },
            this.pingWrite(),
            [this.pingRead()]
        );

        this.swapPing();
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const amount = Math.max(0.001, this.properties.amount * 0.001);
        const passes = Math.max(1, Math.floor(this.properties.passes));

        // Copy input into ping-pong texture 0
        this.runShader(
            "copy_input",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main() { fragColor = texture(tex0, vUv); }`,
            1,
            {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );
        this._pingCurrent = 0;

        for(let i=0; i<passes; i++){
            this.runPass([1,0], amount); // horizontal
            this.runPass([0,1], amount); // vertical
        }

        // Copy final result to main output
        this.runShader(
            "copy_to_main",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main(){ fragColor = texture(tex0,vUv); }`,
            1,
            {},
            this.framebuffer,
            [this.pingRead()]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Blur", BlurNode);

class SobelNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.title = "Sobel Edge";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;

        void main() {
            vec2 texel = 1.0 / vec2(textureSize(tex0, 0));

            float tl = texture(tex0, vUv + texel * vec2(-1,-1)).r;
            float tc = texture(tex0, vUv + texel * vec2( 0,-1)).r;
            float tr = texture(tex0, vUv + texel * vec2( 1,-1)).r;

            float ml = texture(tex0, vUv + texel * vec2(-1, 0)).r;
            float mr = texture(tex0, vUv + texel * vec2( 1, 0)).r;

            float bl = texture(tex0, vUv + texel * vec2(-1, 1)).r;
            float bc = texture(tex0, vUv + texel * vec2( 0, 1)).r;
            float br = texture(tex0, vUv + texel * vec2( 1, 1)).r;

            float gx = -tl -2.0*ml - bl + tr +2.0*mr + br;
            float gy = -tl -2.0*tc - tr + bl +2.0*bc + br;

            float g = sqrt(gx*gx + gy*gy);

            fragColor = vec4(vec3(g), 1.0);
        }`;

        this.runShader("sobel", frag, 1);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Sobel", SobelNode);

class PosterizeNode extends GPUNodeBase {
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
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float levels;

        void main() {
            float v = texture(tex0, vUv).r;
            float stepVal = floor(v * levels);
            float val = stepVal / (levels - 1.0);

            fragColor = vec4(vec3(val), 1.0);
        }`;

        this.runShader("posterize", frag, 1, {
            levels: this.properties.levels
        });

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Posterize", PosterizeNode);

class PixelateNode extends GPUNodeBase {
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
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float pixelSize;

        void main() {
            vec2 size = vec2(textureSize(tex0, 0));
            vec2 uv = vUv * size;

            uv = floor(uv / pixelSize) * pixelSize;

            vec2 finalUv = uv / size;
            float val = texture(tex0, finalUv).r;

            fragColor = vec4(vec3(val), 1.0);
        }`;

        this.runShader("pixelate", frag, 1, {
            pixelSize: this.properties.pixelSize
        });

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Pixelate",PixelateNode);

class ThresholdNode extends GPUNodeBase {
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
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float threshold;
        uniform float soft;

        float smoothThreshold(float edge0, float edge1, float x) {
            float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            return t * t * (3.0 - 2.0 * t);
        }

        void main() {
            float v = texture(tex0, vUv).r;

            float outVal;
            if (soft <= 0.0001) {
                outVal = v >= threshold ? 1.0 : 0.0;
            } else {
                float e0 = threshold - soft;
                float e1 = threshold + soft;
                outVal = smoothThreshold(e0, e1, v);
            }

            fragColor = vec4(vec3(outVal), 1.0);
        }`;

        this.runShader("threshold", frag, 1, {
            threshold: this.properties.threshold,
            soft: this.properties.soft
        });

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Threshold", ThresholdNode);