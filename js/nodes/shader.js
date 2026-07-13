function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        throw "Shader compile error: " + gl.getShaderInfoLog(shader);
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

function readTexture(texture) {
    const gl = GPU.gl;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const pixels = new Float32Array(WIDTH * HEIGHT * 4);
    gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.FLOAT, pixels);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);

    const out = new Float32Array(WIDTH * HEIGHT);
    for (let i = 0; i < WIDTH * HEIGHT; i++) out[i] = pixels[i * 4];
    return out;
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

// --- Base class for all GPU nodes ---
class GPUNodeBase extends NoiseNode {
    constructor() {
        super();

        this.gl = GPU.gl;

        // Main output texture
        this.outputTexture = this.createTexture();
        this.framebuffer = this.createFramebuffer(this.outputTexture);

        // Optional ping-pong textures for multi-pass shaders
        this._pingTextures = [this.createTexture(), this.createTexture()];
        this._pingFramebuffers = [
            this.createFramebuffer(this._pingTextures[0]),
            this.createFramebuffer(this._pingTextures[1])
        ];
        this._pingCurrent = 0;

        this._inputTextures = [];
        this._uniformCache = {};
    }

    createTexture() {
        const gl = this.gl;
        const tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, WIDTH, HEIGHT, 0, gl.RED, gl.FLOAT, null);
        return tex;
    }

    createFramebuffer(texture) {
        const gl = this.gl;
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        return fb;
    }

    updateInputTexture(slot, data) {
        const gl = this.gl;

        if (!data) {
            this._inputTextures[slot] = GPU.emptyTexture;
            return;
        }

        if (data instanceof WebGLTexture) {
            this._inputTextures[slot] = data;
            return;
        }

        if (!this._inputTextures[slot]) this._inputTextures[slot] = this.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this._inputTextures[slot]);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WIDTH, HEIGHT, gl.RED, gl.FLOAT, new Float32Array(data));
    }

    // Ping pong helpers
    pingRead() {
        return this._pingTextures[this._pingCurrent];
    }

    pingWrite() {
        return this._pingFramebuffers[1 - this._pingCurrent];
    }

    swapPing() {
        this._pingCurrent = 1 - this._pingCurrent;
    }

    setOutputTexture() {
        this.setOutputData(0, this.outputTexture);
    }

    runShader(key, fsSource, inputCount = 1, uniformValues = {}, framebuffer = null, inputTexturesOverride = null) {

        try {
            const gl = this.gl;
            const program = GPU.getProgram(key, quadVS, fsSource);
            gl.useProgram(program);

            // Bind quad
            const posLoc = gl.getAttribLocation(program, "aPos");
            gl.enableVertexAttribArray(posLoc);
            gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            // Bind input textures
            const textures = inputTexturesOverride || this._inputTextures;

            for (let i = 0; i < inputCount; i++) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, textures[i]);
                gl.uniform1i(gl.getUniformLocation(program, "tex" + i), i);
            }

            // Set uniforms
            Object.entries(uniformValues).forEach(([name, value]) => {
                const loc = gl.getUniformLocation(program, name);
                if (typeof value === "number" || typeof value === "boolean")
                {
                    gl.uniform1f(loc, value);
                }
                else if (Array.isArray(value))
                {
                    if (value.length === 2)
                        gl.uniform2fv(loc, value);
                    else if (value.length === 3)
                        gl.uniform3fv(loc, value);
                    else if (value.length === 4)
                        gl.uniform4fv(loc, value);
                }
                else
                {
                    if (value.type == "int")
                        gl.uniform1i(loc, value.value);
                    if (value.type == "float")
                        gl.uniform1f(loc, value.value);
                }
            });

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer || this.framebuffer);
            gl.viewport(0, 0, WIDTH, HEIGHT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } catch(e)
        {
            this._errorMsg = e;
        }
    }

    drawPreviewTexture(ctx = this.previewCtx, fsOverride = null, uniforms = {}) {
        const gl = this.gl;

        /*const fs = fsOverride || `#version 300 es
        precision highp float;
        uniform sampler2D tex0;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float v = texture(tex0, vUv).r;
            fragColor = vec4(v,v,v,1.0);
        }`;*/

        const fs = `#version 300 es
        precision highp float;

        uniform sampler2D tex0;
        uniform int uMode;
        uniform int uTerrainStopCount;
        uniform float uTerrainValues[16];
        uniform vec3 uTerrainColors[16];

        in vec2 vUv;
        out vec4 fragColor;

        vec3 terrainColor(float h) {
            if (h <= uTerrainValues[0])
                return uTerrainColors[0];

            for (int i = 1; i < 16; i++) {
                if (i >= uTerrainStopCount)
                    break;

                if (h <= uTerrainValues[i]) {
                    float range = max(uTerrainValues[i] - uTerrainValues[i - 1], 0.00001);
                    float t = clamp((h - uTerrainValues[i - 1]) / range, 0.0, 1.0);
                    return mix(uTerrainColors[i - 1], uTerrainColors[i], t);
                }
            }

            return uTerrainColors[uTerrainStopCount - 1];
        }

        void main(){
            float v = texture(tex0, vUv).r;

            if (uMode == 0) {
                fragColor = vec4(v, v, v, 1.0); // grayscale
            } else {
                fragColor = vec4(terrainColor(v), 1.0);
            }
        }`;

        const program = GPU.getProgram("preview_" + this.title, quadVS, fs);

        gl.useProgram(program);

        const terrain = getTerrainShaderSettings();

        gl.uniform1i(
            gl.getUniformLocation(program, "uMode"),
            terrain.enabled ? 1 : 0
        );
        gl.uniform1i(gl.getUniformLocation(program, "uTerrainStopCount"), terrain.count);
        gl.uniform1fv(gl.getUniformLocation(program, "uTerrainValues[0]"), terrain.values);
        gl.uniform3fv(gl.getUniformLocation(program, "uTerrainColors[0]"), terrain.colors);

        const posLoc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, GPU.quadBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

        Object.entries(uniforms).forEach(([name, value]) => {
            const loc = gl.getUniformLocation(program, name);
            if (typeof value === "number") gl.uniform1f(loc, value);
            else if (Number.isInteger(value)) gl.uniform1i(loc, value);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        ctx.drawImage(GPU.canvas, 0, 0);
    }
}
