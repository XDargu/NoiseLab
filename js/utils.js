const canvas = document.getElementById("noiseCanvas");
const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
gl.getExtension("EXT_color_buffer_float");
// Vertex shader
const vsSource = `
    // Vertex shader
    attribute vec3 aPosition;
    attribute vec2 aUV;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying vec2 vUV;
    varying vec3 vPosition;

    void main() {
        vUV = aUV;
        vPosition = (uModelViewMatrix * vec4(aPosition,1.0)).xyz; // position in view space
        gl_Position = uProjectionMatrix * vec4(vPosition, 1.0);
    }
`;

// Fragment shader
const fsSource = `
    // Fragment shader
    precision mediump float;
    varying vec2 vUV;
    varying vec3 vPosition;

    uniform sampler2D uHeightMap;
    uniform float uScale; // how strong the bump effect is
    uniform vec3 uLightDir;

    void main() {
        // Sample height at current UV
        float h = texture2D(uHeightMap, vUV).r;

        // Sample neighboring heights
        float hx = texture2D(uHeightMap, vUV + vec2(1.0/1024.0, 0.0)).r;
        float hy = texture2D(uHeightMap, vUV + vec2(0.0, 1.0/1024.0)).r;

        // Compute tangent-space normal using height differences scaled by uScale
        vec3 normal = normalize(vec3((hx - h) * uScale, (hy - h) * uScale, 1.0));

        // Simple directional lighting
        vec3 lightDir = normalize(uLightDir);
        float diff = max(dot(normal, lightDir), 0.0);

        // Combine ambient and diffuse
        vec3 ambient = vec3(0.2);
        vec3 diffuse = vec3(0.6) * diff;
        vec3 color = ambient + diffuse;

        gl_FragColor = vec4(color, 1.0);
    }
`;

// Compile shader helper
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

// Create shader program
const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Cube data
const positions = new Float32Array([
    // Front face
    -0.5,-0.5,0.5,  0.5,-0.5,0.5,  0.5,0.5,0.5,  -0.5,0.5,0.5,
    // Back face
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,0.5,-0.5,  -0.5,0.5,-0.5,
    // Top face
    -0.5,0.5,-0.5,  0.5,0.5,-0.5,  0.5,0.5,0.5,  -0.5,0.5,0.5,
    // Bottom face
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5,0.5,  -0.5,-0.5,0.5,
    // Right face
    0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5,
    // Left face
    -0.5,-0.5,-0.5, -0.5,0.5,-0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5
]);

const uvs = new Float32Array([
    // Front
    0,0, 1,0, 1,1, 0,1,
    // Back
    0,0, 1,0, 1,1, 0,1,
    // Top
    0,0, 1,0, 1,1, 0,1,
    // Bottom
    0,0, 1,0, 1,1, 0,1,
    // Right
    0,0, 1,0, 1,1, 0,1,
    // Left
    0,0, 1,0, 1,1, 0,1
]);

const indices = new Uint16Array([
    0,1,2, 2,3,0,       // front
    4,5,6, 6,7,4,       // back
    8,9,10, 10,11,8,    // top
    12,13,14, 14,15,12, // bottom
    16,17,18, 18,19,16, // right
    20,21,22, 22,23,20  // left
]);

// Buffers
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
const uvBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// Attribute locations
const posLoc = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(posLoc);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

const uvLoc = gl.getAttribLocation(program, "aUV");
gl.enableVertexAttribArray(uvLoc);
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

// Uniform locations
const uProj = gl.getUniformLocation(program, "uProjectionMatrix");
const uMV = gl.getUniformLocation(program, "uModelViewMatrix");
const uHeightMap = gl.getUniformLocation(program, "uHeightMap");
const uDisplacement = gl.getUniformLocation(program, "uDisplacement");
const uLightDir = gl.getUniformLocation(program, "uLightDir");
const uScale = gl.getUniformLocation(program, "uScale");

// Simple camera
function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov/2);
    const nf = 1/(near-far);
    return [
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(far+near)*nf,-1,
        0,0,(2*far*near)*nf,0
    ];
}

function lookAt(eye, center, up) {
    const z = normalize(subtract(eye, center));
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    return [
        x[0],y[0],z[0],0,
        x[1],y[1],z[1],0,
        x[2],y[2],z[2],0,
        -dot(x,eye),-dot(y,eye),-dot(z,eye),1
    ];
}

// Vector helpers
function subtract(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function normalize(v){const l=Math.hypot(...v);return v.map(x=>x/l);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

// Load texture
function loadTexture(url) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const img = new Image();
    img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.src = url;
    return tex;
}

// Load texture
function loadTextureData(data, width, height) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    // Make sure WebGL2 is active
    if (!gl instanceof WebGL2RenderingContext) console.warn("WebGL2 needed for float textures");

    // Upload float texture
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R32F,           // internal format
        width,
        height,
        0,
        gl.RED,            // format
        gl.FLOAT,          // type
        data
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return tex;
}

// Example usage: send a DataURL from NoiseLab
let heightTexture = null;

// Animation loop
let angle = 0;
function animate() {
    requestAnimationFrame(animate);
    angle += 0.003;

    const proj = new Float32Array(perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 100));
    const mv = new Float32Array(lookAt([2*Math.sin(angle),1,2*Math.cos(angle)],[0,0,0],[0,1,0]));

    gl.uniformMatrix4fv(uProj,false,proj);
    gl.uniformMatrix4fv(uMV,false,mv);
    gl.uniform1f(uDisplacement,0.2);
    gl.activeTexture(gl.TEXTURE0);
    if (heightTexture)
    {
        gl.bindTexture(gl.TEXTURE_2D, heightTexture);
        gl.uniform1i(uHeightMap,0);
    }
    gl.uniform3fv(uLightDir, [0.5,1,0.3]); // example light
    gl.uniform1f(uScale, 1.2);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
}
animate();