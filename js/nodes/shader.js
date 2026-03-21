// --- WebGL helper functions ---
function createGLCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const gl = canvas.getContext("webgl2");
    if (!gl) throw "WebGL2 not supported";
    return { canvas, gl };
}

function createTexture(gl, width, height, data=null) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, width, height, 0, gl.RED, gl.FLOAT, data);
    return tex;
}

function createFramebuffer(gl, texture) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return fb;
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        throw "Shader compile error";
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw "Program link error";
    }
    return program;
}

// Fullscreen quad
const quadVS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos,0,1);
}`;



const GPU = {
    gl: null,
    canvas: null,
    quadBuffer: null,
    shaderCache: {},
    emptyTexture: null,

    init(width, height) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) throw "WebGL2 not supported";
        
        const gl = this.gl;
        
        // Required for float rendering
        gl.getExtension("EXT_color_buffer_float");
        
        // Fullscreen quad
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
            gl.STATIC_DRAW
        );
        
        this.emptyTexture = gl.createTexture(this.gl, WIDTH, HEIGHT, new Float32Array(WIDTH*HEIGHT).fill(0));
    },

    getProgram(key, vs, fs) {
        if (!this.shaderCache[key]) {
            this.shaderCache[key] = createProgram(this.gl, vs, fs);
        }
        return this.shaderCache[key];
    }
};

class GPUNode extends NoiseNode {
    constructor() {
        super();

        this.gl = GPU.gl;

        this.outputTexture = this.createTexture();
        this.framebuffer = this.createFramebuffer(this.outputTexture);

        this._inputTextures = [];
    }

    createTexture() {
        const gl = this.gl;
        const tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R32F,
            WIDTH,
            HEIGHT,
            0,
            gl.RED,
            gl.FLOAT,
            null
        );

        return tex;
    }

    createFramebuffer(texture) {
        const gl = this.gl;
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );
        return fb;
    }

    updateInputTexture(slot, arrayOrTex) {
        const gl = this.gl;

        if (!arrayOrTex) {
            this._inputTextures[slot] = GPU.emptyTexture;
            return;
        }

        // If already a GPU texture, just use it
        if (arrayOrTex instanceof WebGLTexture) {
            this._inputTextures[slot] = arrayOrTex;
            return;
        }

        // Otherwise upload CPU data
        if (!this._inputTextures[slot]) {
            this._inputTextures[slot] = this.createTexture();
        }

        gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[slot]);
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0, 0, 0,
            WIDTH, HEIGHT,
            gl.RED,
            gl.FLOAT,
            new Float32Array(arrayOrTex)
        );
    }

    runShader(key, fsSource, inputCount) {
        const gl = this.gl;

        const program = GPU.getProgram(key, quadVS, fsSource);
        gl.useProgram(program);

        // Bind quad
        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Bind inputs
        for (let i = 0; i < inputCount; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[i]);
            gl.uniform1i(gl.getUniformLocation(program, "tex" + i), i);
        }

        // Render
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // output is now a TEXTURE
    setOutputTexture() {
        this.setOutputData(0, this.outputTexture);
    }

    // GPU preview
    /*drawPreviewTexture() {
        const gl = this.gl;

        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float v = texture(tex0, vUv).r;
            fragColor = vec4(v, v, v, 1.0);
        }`;

        const program = GPU.getProgram("preview", quadVS, fs);

        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Copy GPU canvas to the node preview canvas
        this.previewCtx.drawImage(GPU.canvas, 0, 0);
        console.log('draw preview: ' + this.title);
    }*/

    drawPreviewTexture(ctx = this.previewCtx) {
        const gl = this.gl;

        const fs = `#version 300 es
        precision highp float;

        uniform sampler2D tex0;
        uniform int uMode;

        in vec2 vUv;
        out vec4 fragColor;

        vec3 terrainColor(float h) {
            if (h < 0.1) {
                float t = (h - 0.0) / 0.1;
                return mix(vec3(0.0,0.0,200.0/255.0), vec3(0.0,100.0/255.0,1.0), t);
            } else if (h < 0.2) {
                float t = (h - 0.1) / 0.1;
                return mix(vec3(0.0,100.0/255.0,1.0), vec3(238.0/255.0,214.0/255.0,175.0/255.0), t);
            } else if (h < 0.4) {
                float t = (h - 0.2) / 0.2;
                return mix(vec3(238.0/255.0,214.0/255.0,175.0/255.0), vec3(34.0/255.0,139.0/255.0,34.0/255.0), t);
            } else if (h < 0.6) {
                float t = (h - 0.4) / 0.2;
                return mix(vec3(34.0/255.0,139.0/255.0,34.0/255.0), vec3(0.0,100.0/255.0,0.0), t);
            } else if (h < 0.8) {
                float t = (h - 0.6) / 0.2;
                return mix(vec3(0.0,100.0/255.0,0.0), vec3(139.0/255.0,69.0/255.0,19.0/255.0), t);
            } else {
                float t = (h - 0.8) / 0.7;
                return mix(vec3(139.0/255.0,69.0/255.0,19.0/255.0), vec3(1.0), t);
            }
        }

        void main(){
            float v = texture(tex0, vUv).r;

            if (uMode == 0) {
                fragColor = vec4(v, v, v, 1.0); // grayscale
            } else {
                fragColor = vec4(terrainColor(v), 1.0);
            }
        }`;

        const program = GPU.getProgram("preview_terrain", quadVS, fs);

        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        const isTerrainMode = terrainModeCheck.checked;

        gl.uniform1i(
            gl.getUniformLocation(program, "uMode"),
            isTerrainMode ? 1 : 0
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        ctx.drawImage(GPU.canvas, 0, 0);
    }
}


class GPUPerlinNode extends GPUNode {
    constructor() {
        super();
        this.addOutput("noise","array");

        this.properties = { frequency: 5, octaves: 1, amplitude: 1, offset: 0 };

        this.addWidget("slider","Frequency",this.properties.frequency,{min:0,max:20,property:"frequency"});
        this.addWidget("slider","Octaves",this.properties.octaves,{min:0,max:8,step:1,precision:0,property:"octaves"});
        this.addWidget("slider","Amplitude",this.properties.amplitude,{min:0,max:5,property:"amplitude"});
        this.addWidget("slider","Offset",this.properties.offset,{min:0,max:5,property:"offset"});

        this.title="Perlin (GPU)";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const { frequency, octaves, amplitude, offset } = this.properties;

        const fs = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float uFrequency;
        uniform int uOctaves;
        uniform float uAmplitude;
        uniform float uOffset;

        // --- Hash ---
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
        }

        // --- Gradient ---
        vec2 gradient(vec2 p) {
            float angle = hash(p) * 6.2831853;
            return vec2(cos(angle), sin(angle));
        }

        // --- Perlin ---
        float perlin(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            vec2 g00 = gradient(i + vec2(0.0,0.0));
            vec2 g10 = gradient(i + vec2(1.0,0.0));
            vec2 g01 = gradient(i + vec2(0.0,1.0));
            vec2 g11 = gradient(i + vec2(1.0,1.0));

            float v00 = dot(g00, f - vec2(0.0,0.0));
            float v10 = dot(g10, f - vec2(1.0,0.0));
            float v01 = dot(g01, f - vec2(0.0,1.0));
            float v11 = dot(g11, f - vec2(1.0,1.0));

            vec2 u = f*f*(3.0-2.0*f); // smoothstep

            return mix(
                mix(v00, v10, u.x),
                mix(v01, v11, u.x),
                u.y
            );
        }

        void main() {
            vec2 uv = vUv;

            float val = 0.0;
            float amp = uAmplitude;
            float freq = 1.0;

            for(int i = 0; i < 8; i++) {
                if(i >= uOctaves) break;

                vec2 p = uv * uFrequency * freq + uOffset;
                val += perlin(p) * amp;

                amp *= 0.5;
                freq *= 2.0;
            }

            // normalize to 0-1 like your CPU version
            val = (val + 1.0) * 0.5;

            fragColor = vec4(val, 0.0, 0.0, 1.0);
        }`;

        const gl = this.gl;

        const program = GPU.getProgram("perlin", quadVS, fs);
        gl.useProgram(program);

        // Bind quad
        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Uniforms
        gl.uniform1f(gl.getUniformLocation(program, "uFrequency"), frequency);
        gl.uniform1i(gl.getUniformLocation(program, "uOctaves"), octaves);
        gl.uniform1f(gl.getUniformLocation(program, "uAmplitude"), amplitude);
        gl.uniform1f(gl.getUniformLocation(program, "uOffset"), offset);

        // Render
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/PerlinGPU", GPUPerlinNode);

class GPUFormulaXYNode extends GPUNode {
    constructor(){
        super();

        this.properties = { formula: "x*y" };

        this.addWidget("text", "Formula", this.properties.formula, {
            property: "formula"
        });

        this.addOutput("out","array");

        this.title = "FormulaXY (GPU)";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    buildShader(formula) {
        return `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        void main(){
            float x = vUv.x;
            float y = vUv.y;

            float val = ${formula};

            fragColor = vec4(val, 0.0, 0.0, 1.0);
        }`;
    }

    onExecute(){
        const formula = this.properties.formula;

        let fs;
        let program;

        try {
            fs = this.buildShader(formula);

            // IMPORTANT: cache per formula
            program = GPU.getProgram("formulaXY_" + formula, quadVS, fs);
        } catch (e) {
            console.error("Shader build error:", e);
            return;
        }

        const gl = this.gl;

        gl.useProgram(program);

        // quad
        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // render
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/FormulaXY_GPU", GPUFormulaXYNode);



function initBinaryOpGPU(node, name) {
    node.addInput("A","array");
    node.addInput("B","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

function initUnaryOpGPU(node, name) {
    node.addInput("A","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

class GPUAddNode extends GPUNode {
    constructor() {
        super();
        initBinaryOpGPU(this, "Add");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;
            fragColor = vec4(a + b, 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        this.runShader("add", fs, 2);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Math/Add_GPU`, GPUAddNode);

class GPUMultiplyNode extends GPUNode {
    constructor() {
        super();
        initBinaryOpGPU(this, "Multiply");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;
            fragColor = vec4(a * b, 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        this.runShader("mul", fs, 2);
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Math/Multiply_GPU`, GPUMultiplyNode);

class GPUSubtractNode extends GPUNode {
    constructor() {
        super();
        initBinaryOpGPU(this, "Subtract");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;
            fragColor = vec4(a - b, 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        this.runShader("sub", fs, 2);
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Math/Subtract_GPU`, GPUSubtractNode);

class GPUMaxNode extends GPUNode {
    constructor() {
        super();
        initBinaryOpGPU(this, "Max");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;
            fragColor = vec4(max(a,b), 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        this.runShader("max", fs, 2);
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Math/Max_GPU`, GPUMaxNode);

class GPUMinNode extends GPUNode {
    constructor() {
        super();
        initBinaryOpGPU(this, "Min");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;
            fragColor = vec4(min(a,b), 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        this.runShader("min", fs, 2);
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Math/Min_GPU`, GPUMinNode);

class GPUAbsNode extends GPUNode {
    constructor() {
        super();
        initUnaryOpGPU(this, "Abs");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float a = texture(tex0, vUv).r;
            fragColor = vec4(abs(a), 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.runShader("abs", fs, 1);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Math/Abs_GPU`, GPUAbsNode);

class GPUScaleNode extends GPUNode {
    constructor() {
        super();
        this.addInput("value","array");
        this.addOutput("out","array");

        this.properties = { amount: 2 };
        this.addWidget("slider","Amount", this.properties.amount,{
            min:-10,max:10,property:"amount"
        });

        this.title="Scale";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;

        uniform sampler2D tex0;
        uniform float amount;

        in vec2 vUv;
        out vec4 fragColor;

        void main(){
            float v = texture(tex0, vUv).r;
            fragColor = vec4(v * amount, 0.0, 0.0, 1.0);
        }`;

        const gl = this.gl;

        this.updateInputTexture(0, this.getInputData(0));

        const program = GPU.getProgram("scale", quadVS, fs);
        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(gl.getUniformLocation(program, "amount"), this.properties.amount);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[0]);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType(`Math/Scale_GPU`, GPUScaleNode);

class GPUClampNode extends GPUNode {
    constructor() {
        super();

        this.addInput("value","array");
        this.addOutput("out","array");

        this.properties = { min: -1, max: 1 };

        this.addWidget("slider","Min", this.properties.min,{min:-5,max:5,property:"min"});
        this.addWidget("slider","Max", this.properties.max,{min:-5,max:5,property:"max"});

        this.title="Clamp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;

        uniform sampler2D tex0;
        uniform float minVal;
        uniform float maxVal;

        in vec2 vUv;
        out vec4 fragColor;

        void main(){
            float v = texture(tex0, vUv).r;
            fragColor = vec4(clamp(v, minVal, maxVal), 0.0, 0.0, 1.0);
        }`;

        const gl = this.gl;

        this.updateInputTexture(0, this.getInputData(0));

        const program = GPU.getProgram("clamp", quadVS, fs);
        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(gl.getUniformLocation(program, "minVal"), this.properties.min);
        gl.uniform1f(gl.getUniformLocation(program, "maxVal"), this.properties.max);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[0]);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType(`Math/Clamp_GPU`, GPUClampNode);

class GPUInvertNode extends GPUNode {
    constructor() {
        super();
        initUnaryOpGPU(this, "Invert");
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float v = texture(tex0, vUv).r;
            fragColor = vec4(1.0 - v, 0.0, 0.0, 1.0);
        }`;

        this.updateInputTexture(0, this.getInputData(0));
        this.runShader("invert", fs, 1);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType(`Math/Invert_GPU`, GPUInvertNode);

class GPUFormula1Node extends GPUNode {
    constructor(){
        super();

        this.properties = { formula: "a*a" };

        this.addWidget("text", "Formula", this.properties.formula, {
            property: "formula"
        });

        initUnaryOpGPU(this, "Formula1");
    }

    buildShader(formula) {
        return `#version 300 es
        precision highp float;

        uniform sampler2D tex0;
        in vec2 vUv;
        out vec4 fragColor;

        void main(){
            float a = texture(tex0, vUv).r;
            float x = vUv.x;
            float y = vUv.y;

            float val = ${formula};

            fragColor = vec4(val, 0.0, 0.0, 1.0);
        }`;
    }

    onExecute(){
        const formula = this.properties.formula;

        let program;

        try {
            const fs = this.buildShader(formula);
            program = GPU.getProgram("formula1_" + formula, quadVS, fs);
        } catch(e) {
            console.error(e);
            return;
        }

        const gl = this.gl;

        this.updateInputTexture(0, this.getInputData(0));

        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[0]);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType(`Expression/Formula1_GPU`, GPUFormula1Node);

class GPUFormula2Node extends GPUNode {
    constructor(){
        super();

        this.properties = { formula: "a*a" };

        this.addWidget("text", "Formula", this.properties.formula, {
            property: "formula"
        });

        initBinaryOpGPU(this, "Formula2");
    }

    buildShader(formula) {
        return `#version 300 es
        precision highp float;

        uniform sampler2D tex0;
        in vec2 vUv;
        out vec4 fragColor;

        void main(){
            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;
            float x = vUv.x;
            float y = vUv.y;

            float val = ${formula};

            fragColor = vec4(val, 0.0, 0.0, 1.0);
        }`;
    }

    onExecute(){
        const formula = this.properties.formula;

        let program;

        try {
            const fs = this.buildShader(formula);
            program = GPU.getProgram("formula1_" + formula, quadVS, fs);
        } catch(e) {
            console.error(e);
            return;
        }

        const gl = this.gl;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[0]);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType(`Expression/Formula2_GPU`, GPUFormula2Node);
