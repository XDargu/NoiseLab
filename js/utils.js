function directionalNoise(noiseFn, x, y, angle, anisotropy = 40.0) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // rotate coordinates
    let xr = x * cos + y * sin;
    let yr = -x * sin + y * cos;

    // stretch along one axis
    xr *= anisotropy;

    return noiseFn(xr, yr);
}

// --- Math Scope Trick ---
let lerp = (a, b, t) => a + (b - a) * t;
let clamp = (x, min, max) => Math.min(max, Math.max(min, x));
let rand = () => Math.random();

const {
  abs, acos, acosh, asin, asinh, atan, atan2, atanh,
  cbrt, ceil, clz32, cos, cosh, exp, expm1, floor,
  fround, hypot, imul, log, log1p, log2, log10,
  max, min, pow, random, round, sign, sin, sinh,
  sqrt, tan, tanh, trunc,
  E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2
} = Math;

function compile(expr, varNames) {
  return Function(
    ...varNames,
    `return (${expr});`
  );
}

function heightToRGB(height) {

    height = (height / 255)

    // Define color stops for terrain
    const gradient = [
        { h: 0.0, color: [0, 0, 200] },        // Deep water
        { h: 0.1, color: [0, 100, 255] },      // Shallow water
        { h: 0.2, color: [238, 214, 175] },    // Beach
        { h: 0.4, color: [34, 139, 34] },      // Green fields
        { h: 0.6, color: [0, 100, 0] },        // Darker green hills
        { h: 0.8, color: [139, 69, 19] },      // Brown mountains
        { h: 1.5, color: [255, 250, 250] }     // Snow
    ];

    // Find the segment that contains the current height
    let lower = gradient[0];
    let upper = gradient[gradient.length - 1];

    for (let i = 0; i < gradient.length - 1; i++) {
        if (height >= gradient[i].h && height <= gradient[i + 1].h) {
            lower = gradient[i];
            upper = gradient[i + 1];
            break;
        }
    }

    // Interpolation factor
    let t = (height - lower.h) / (upper.h - lower.h);

    // Linear interpolation between colors
    const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * t);
    const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * t);
    const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * t);

    return {
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b),
    }
}

// --- Helper: render 2D noise array to canvas ---
function renderNoise(noiseArray) {
    const imgData = ctx.createImageData(WIDTH, HEIGHT);
    const isTerrainMode = terrainModeCheck.checked;
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        const v = Math.floor((noiseArray[i] + 1) * 127.5);

        const col = isTerrainMode ? heightToRGB(v) : null;
        imgData.data[i*4+0] = col?.r || v;
        imgData.data[i*4+1] = col?.g || v;
        imgData.data[i*4+2] = col?.b || v;
        imgData.data[i*4+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}