const TERRAIN_MIN_VALUE = 0;
const TERRAIN_MAX_VALUE = 1.5;
const TERRAIN_MAX_STOPS = 16;

const DEFAULT_TERRAIN_CONFIG = {
    enabled: false,
    stops: [
        { value: 0.0, color: "#0000c8" },
        { value: 0.1, color: "#0064ff" },
        { value: 0.2, color: "#eed6af" },
        { value: 0.4, color: "#228b22" },
        { value: 0.6, color: "#006400" },
        { value: 0.8, color: "#8b4513" },
        { value: 1.5, color: "#ffffff" }
    ]
};

let terrainEditorConfig = cloneTerrainConfig(DEFAULT_TERRAIN_CONFIG);
let terrainPreviewFrame = null;

function cloneTerrainConfig(config) {
    return {
        enabled: Boolean(config.enabled),
        stops: config.stops.map(stop => ({ value: stop.value, color: stop.color }))
    };
}

function clampTerrainValue(value) {
    return Math.min(TERRAIN_MAX_VALUE, Math.max(TERRAIN_MIN_VALUE, value));
}

function normalizeTerrainColor(color) {
    const value = String(color || "").trim();
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "#000000";
}

function normalizeTerrainConfig(config, fallbackEnabled = false) {
    const sourceStops = Array.isArray(config?.stops) ? config.stops : [];
    const stops = sourceStops
        .map(stop => ({
            value: clampTerrainValue(Number(stop?.value)),
            color: normalizeTerrainColor(stop?.color)
        }))
        .filter(stop => Number.isFinite(stop.value))
        .slice(0, TERRAIN_MAX_STOPS)
        .sort((a, b) => a.value - b.value);

    const normalizedStops = stops.length >= 2
        ? stops
        : cloneTerrainConfig(DEFAULT_TERRAIN_CONFIG).stops;

    return {
        enabled: typeof config?.enabled == "boolean" ? config.enabled : fallbackEnabled,
        stops: normalizedStops
    };
}

function getTerrainConfig() {
    return normalizeTerrainConfig(graph?.extra?.terrain, false);
}

function getTerrainShaderSettings() {
    const config = getTerrainConfig();
    const values = new Float32Array(TERRAIN_MAX_STOPS);
    const colors = new Float32Array(TERRAIN_MAX_STOPS * 3);

    config.stops.forEach((stop, index) => {
        const rgb = terrainHexToRgb(stop.color);
        values[index] = stop.value;
        colors[index * 3] = rgb[0] / 255;
        colors[index * 3 + 1] = rgb[1] / 255;
        colors[index * 3 + 2] = rgb[2] / 255;
    });

    return {
        enabled: config.enabled,
        count: config.stops.length,
        values,
        colors
    };
}

function terrainHexToRgb(hex) {
    const value = parseInt(normalizeTerrainColor(hex).slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function terrainRgbToHex(rgb) {
    return "#" + rgb.map(channel => Math.round(channel).toString(16).padStart(2, "0")).join("");
}

function interpolateTerrainColor(a, b, amount) {
    const colorA = terrainHexToRgb(a);
    const colorB = terrainHexToRgb(b);
    return terrainRgbToHex(colorA.map((channel, index) => channel + (colorB[index] - channel) * amount));
}

function loadTerrainConfigFromGraph() {
    const hasSavedConfig = Boolean(graph.extra?.terrain);
    const legacyEnabled = localStorage.getItem("noiseLabTerrainMode") == "true";
    const defaultEnabled = currentGraphId == "example_island" ? true : legacyEnabled;
    terrainEditorConfig = normalizeTerrainConfig(graph.extra?.terrain, defaultEnabled);
    graph.extra = graph.extra || {};
    graph.extra.terrain = cloneTerrainConfig(terrainEditorConfig);

    const terrainModeCheck = document.getElementById("terrain-mode");
    if (terrainModeCheck)
        terrainModeCheck.checked = terrainEditorConfig.enabled;

    renderTerrainEditor();
    return !hasSavedConfig;
}

function storeTerrainConfig(rerenderStops = false) {
    const normalized = normalizeTerrainConfig(terrainEditorConfig);
    graph.extra = graph.extra || {};
    graph.extra.terrain = cloneTerrainConfig(normalized);

    if (rerenderStops) {
        terrainEditorConfig = cloneTerrainConfig(normalized);
        renderTerrainEditor();
    }
    else {
        renderTerrainGradient(normalized);
        updateTerrainStopCount(normalized.stops.length);
    }

    scheduleTerrainPreview();
    autoSaveGraph();
}

function scheduleTerrainPreview() {
    if (terrainPreviewFrame !== null)
        return;

    terrainPreviewFrame = requestAnimationFrame(() => {
        terrainPreviewFrame = null;
        const node = activeNode || graph?._nodes_in_order?.[0];
        if (node)
            renderNode(node);
        graphCanvas.setDirty(true, false);
    });
}

function renderTerrainGradient(config = terrainEditorConfig) {
    const gradient = document.getElementById("terrainGradientPreview");
    if (!gradient)
        return;

    const sortedStops = [...config.stops].sort((a, b) => a.value - b.value);
    const cssStops = sortedStops.map(stop => {
        const position = ((stop.value - TERRAIN_MIN_VALUE) / (TERRAIN_MAX_VALUE - TERRAIN_MIN_VALUE)) * 100;
        return `${stop.color} ${position.toFixed(2)}%`;
    });
    gradient.style.background = `linear-gradient(to right, ${cssStops.join(", ")})`;
}

function updateTerrainStopCount(count) {
    const addButton = document.getElementById("addTerrainStopBtn");
    if (!addButton)
        return;

    addButton.disabled = count >= TERRAIN_MAX_STOPS;
    addButton.title = addButton.disabled ? `Maximum ${TERRAIN_MAX_STOPS} colors` : "Add a color stop";
}

function renderTerrainEditor() {
    const stopsContainer = document.getElementById("terrainStops");
    if (!stopsContainer)
        return;

    terrainEditorConfig = normalizeTerrainConfig(terrainEditorConfig);
    stopsContainer.innerHTML = "";
    terrainEditorConfig.stops.forEach((stop, index) => {
        stopsContainer.appendChild(createTerrainStopRow(stop, index));
    });

    renderTerrainGradient(terrainEditorConfig);
    updateTerrainStopCount(terrainEditorConfig.stops.length);
}

function createTerrainStopRow(stop, index) {
    const row = document.createElement("div");
    row.className = "terrain-stop";

    const controls = document.createElement("div");
    controls.className = "terrain-stop-controls";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = stop.color;
    colorInput.className = "terrain-color-input";
    colorInput.setAttribute("aria-label", `Color ${index + 1}`);

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.value = stop.color;
    hexInput.maxLength = 7;
    hexInput.spellcheck = false;
    hexInput.className = "terrain-hex-input";
    hexInput.setAttribute("aria-label", `Hex color ${index + 1}`);

    const valueLabel = document.createElement("label");
    valueLabel.className = "terrain-value-label";
    valueLabel.textContent = "Height";

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.min = TERRAIN_MIN_VALUE;
    valueInput.max = TERRAIN_MAX_VALUE;
    valueInput.step = 0.01;
    valueInput.value = stop.value;
    valueInput.className = "terrain-value-input";
    valueInput.setAttribute("aria-label", `Height for color ${index + 1}`);
    valueLabel.appendChild(valueInput);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "terrain-remove-stop";
    removeButton.title = "Remove color";
    removeButton.setAttribute("aria-label", `Remove color ${index + 1}`);
    removeButton.innerHTML = '<i class="fas fa-trash"></i>';
    removeButton.disabled = terrainEditorConfig.stops.length <= 2;

    controls.append(colorInput, hexInput, valueLabel, removeButton);

    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    rangeInput.min = TERRAIN_MIN_VALUE;
    rangeInput.max = TERRAIN_MAX_VALUE;
    rangeInput.step = 0.01;
    rangeInput.value = stop.value;
    rangeInput.className = "terrain-value-range";
    rangeInput.setAttribute("aria-label", `Height slider for color ${index + 1}`);

    colorInput.addEventListener("input", () => {
        terrainEditorConfig.stops[index].color = colorInput.value;
        hexInput.value = colorInput.value;
        hexInput.classList.remove("invalid");
        storeTerrainConfig();
    });

    hexInput.addEventListener("input", () => {
        const color = hexInput.value.trim();
        const isValid = /^#[0-9a-f]{6}$/i.test(color);
        hexInput.classList.toggle("invalid", !isValid);
        if (!isValid)
            return;

        terrainEditorConfig.stops[index].color = color.toLowerCase();
        colorInput.value = color;
        storeTerrainConfig();
    });

    function setValue(value, source) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed))
            return;

        const nextValue = clampTerrainValue(parsed);
        terrainEditorConfig.stops[index].value = nextValue;
        if (source != valueInput)
            valueInput.value = nextValue;
        if (source != rangeInput)
            rangeInput.value = nextValue;
        storeTerrainConfig();
    }

    valueInput.addEventListener("input", () => setValue(valueInput.value, valueInput));
    valueInput.addEventListener("change", () => storeTerrainConfig(true));
    rangeInput.addEventListener("input", () => setValue(rangeInput.value, rangeInput));
    rangeInput.addEventListener("change", () => storeTerrainConfig(true));

    removeButton.addEventListener("click", () => {
        if (terrainEditorConfig.stops.length <= 2)
            return;
        terrainEditorConfig.stops.splice(index, 1);
        storeTerrainConfig(true);
    });

    row.append(controls, rangeInput);
    return row;
}

function addTerrainStop() {
    if (terrainEditorConfig.stops.length >= TERRAIN_MAX_STOPS)
        return;

    const stops = [...terrainEditorConfig.stops].sort((a, b) => a.value - b.value);
    let left = stops[0];
    let right = stops[1];
    let largestGap = right.value - left.value;

    for (let index = 1; index < stops.length - 1; index++) {
        const gap = stops[index + 1].value - stops[index].value;
        if (gap > largestGap) {
            largestGap = gap;
            left = stops[index];
            right = stops[index + 1];
        }
    }

    const value = (left.value + right.value) * 0.5;
    terrainEditorConfig.stops.push({
        value: Math.round(value * 100) / 100,
        color: interpolateTerrainColor(left.color, right.color, 0.5)
    });
    storeTerrainConfig(true);
}

function setTerrainEditorOpen(open, restoreFocus = true) {
    const editor = document.getElementById("terrainEditor");
    const button = document.getElementById("terrainPaletteBtn");
    editor.hidden = !open;
    button.setAttribute("aria-expanded", String(open));

    if (open) {
        renderTerrainEditor();
        editor.querySelector("input, button")?.focus();
    }
    else if (restoreFocus) {
        button.focus();
    }
}

function initTerrainEditor() {
    const terrainModeCheck = document.getElementById("terrain-mode");
    const paletteButton = document.getElementById("terrainPaletteBtn");
    const editor = document.getElementById("terrainEditor");

    terrainModeCheck.addEventListener("change", () => {
        terrainEditorConfig.enabled = terrainModeCheck.checked;
        storeTerrainConfig();
    });

    paletteButton.addEventListener("click", () => {
        setTerrainEditorOpen(editor.hidden);
    });
    document.getElementById("closeTerrainEditorBtn").addEventListener("click", () => setTerrainEditorOpen(false));
    document.getElementById("addTerrainStopBtn").addEventListener("click", addTerrainStop);
    document.getElementById("resetTerrainStopsBtn").addEventListener("click", () => {
        const enabled = terrainEditorConfig.enabled;
        terrainEditorConfig = cloneTerrainConfig(DEFAULT_TERRAIN_CONFIG);
        terrainEditorConfig.enabled = enabled;
        storeTerrainConfig(true);
    });

    document.addEventListener("pointerdown", event => {
        if (!editor.hidden && !document.getElementById("terrainControls").contains(event.target))
            setTerrainEditorOpen(false, false);
    });
    document.addEventListener("keydown", event => {
        if (event.key == "Escape" && !editor.hidden)
            setTerrainEditorOpen(false);
    });

    renderTerrainEditor();
}
