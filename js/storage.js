const NoiseLabStorage = (() => {
    const DB_NAME = "noiselab";
    const DB_VERSION = 2;
    const GRAPH_STORE = "graphs";
    const IMAGE_STORE = "images";

    let dbPromise = null;

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function transactionDone(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    function openDatabase() {
        if (dbPromise)
            return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("IndexedDB is not available in this browser."));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(GRAPH_STORE))
                    db.createObjectStore(GRAPH_STORE, { keyPath: "id" });

                let imageStore;

                if (!db.objectStoreNames.contains(IMAGE_STORE))
                    imageStore = db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
                else
                    imageStore = request.transaction.objectStore(IMAGE_STORE);

                if (!imageStore.indexNames.contains("hash"))
                    imageStore.createIndex("hash", "hash", { unique: true });
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        return dbPromise;
    }

    function stripId(record) {
        if (!record)
            return null;

        const { id, ...value } = record;
        return value;
    }

    async function countGraphs() {
        const db = await openDatabase();
        return requestToPromise(db.transaction(GRAPH_STORE, "readonly").objectStore(GRAPH_STORE).count());
    }

    async function getGraph(id) {
        const db = await openDatabase();
        const record = await requestToPromise(db.transaction(GRAPH_STORE, "readonly").objectStore(GRAPH_STORE).get(id));
        return stripId(record);
    }

    async function getAllGraphs() {
        const db = await openDatabase();
        const records = await requestToPromise(db.transaction(GRAPH_STORE, "readonly").objectStore(GRAPH_STORE).getAll());
        const graphs = {};

        records.forEach(record => {
            graphs[record.id] = stripId(record);
        });

        return graphs;
    }

    async function saveGraph(id, graphRecord) {
        const db = await openDatabase();
        const transaction = db.transaction(GRAPH_STORE, "readwrite");
        transaction.objectStore(GRAPH_STORE).put({ id, ...graphRecord });
        await transactionDone(transaction);
    }

    async function saveGraphs(graphs) {
        const db = await openDatabase();
        const transaction = db.transaction(GRAPH_STORE, "readwrite");
        const store = transaction.objectStore(GRAPH_STORE);

        store.clear();
        Object.entries(graphs).forEach(([id, graphRecord]) => {
            store.put({ id, ...graphRecord });
        });

        await transactionDone(transaction);
    }

    async function deleteGraph(id) {
        const db = await openDatabase();
        const transaction = db.transaction(GRAPH_STORE, "readwrite");
        transaction.objectStore(GRAPH_STORE).delete(id);
        await transactionDone(transaction);
    }

    async function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    function base64ToBlob(base64, type) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);

        return new Blob([bytes], { type: type || "application/octet-stream" });
    }

    async function hashBlob(blob) {
        const buffer = await blob.arrayBuffer();

        if (crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
            const bytes = Array.from(new Uint8Array(hashBuffer));
            return bytes.map(byte => byte.toString(16).padStart(2, "0")).join("");
        }

        let h1 = 0x811c9dc5;
        let h2 = 0x01000193;
        const bytes = new Uint8Array(buffer);

        for (let i = 0; i < bytes.length; i++) {
            h1 ^= bytes[i];
            h1 = Math.imul(h1, 0x01000193);
            h2 ^= bytes[i];
            h2 = Math.imul(h2, 0x811c9dc5);
        }

        return `fallback-${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}-${bytes.length}`;
    }

    async function getImageByHash(hash) {
        if (!hash)
            return null;

        const db = await openDatabase();
        const store = db.transaction(IMAGE_STORE, "readonly").objectStore(IMAGE_STORE);
        const record = await requestToPromise(store.index("hash").get(hash));
        return record || null;
    }

    async function saveImageBlob(blob, metadata = {}) {
        const db = await openDatabase();
        const hash = metadata.hash || await hashBlob(blob);
        const existing = await getImageByHash(hash);

        if (existing)
            return existing;

        const id = "image_" + Date.now() + "_" + Math.random().toString(36).slice(2);
        const record = {
            id,
            name: metadata.name || blob.name || "Image",
            type: metadata.type || blob.type || "application/octet-stream",
            size: metadata.size || blob.size || 0,
            lastModified: metadata.lastModified || blob.lastModified || Date.now(),
            createdAt: Date.now(),
            hash,
            blob
        };
        const transaction = db.transaction(IMAGE_STORE, "readwrite");
        transaction.objectStore(IMAGE_STORE).put(record);
        await transactionDone(transaction);
        return record;
    }

    async function saveImage(file) {
        return saveImageBlob(file, {
            name: file.name || "Image",
            type: file.type || "application/octet-stream",
            size: file.size || 0,
            lastModified: file.lastModified || Date.now()
        });
    }

    async function getImage(id) {
        if (!id)
            return null;

        const db = await openDatabase();
        return requestToPromise(db.transaction(IMAGE_STORE, "readonly").objectStore(IMAGE_STORE).get(id));
    }

    async function prepareImageForExport(id) {
        const record = await getImage(id);
        if (!record)
            return null;

        const hash = record.hash || await hashBlob(record.blob);

        if (!record.hash) {
            const db = await openDatabase();
            const transaction = db.transaction(IMAGE_STORE, "readwrite");
            transaction.objectStore(IMAGE_STORE).put({ ...record, hash });
            await transactionDone(transaction);
        }

        return {
            id: record.id,
            name: record.name,
            type: record.type,
            size: record.size || record.blob.size || 0,
            lastModified: record.lastModified || Date.now(),
            hash,
            data: await blobToBase64(record.blob)
        };
    }

    async function importImage(imageData) {
        const blob = base64ToBlob(imageData.data, imageData.type);
        return saveImageBlob(blob, {
            name: imageData.name,
            type: imageData.type,
            size: imageData.size || blob.size,
            lastModified: imageData.lastModified,
            hash: imageData.hash
        });
    }

    async function estimateUsage() {
        if (navigator.storage && navigator.storage.estimate)
            return navigator.storage.estimate();

        const graphs = await getAllGraphs();
        const db = await openDatabase();
        const images = await requestToPromise(db.transaction(IMAGE_STORE, "readonly").objectStore(IMAGE_STORE).getAll());
        const graphBytes = new Blob([JSON.stringify(graphs)]).size;
        const imageBytes = images.reduce((total, image) => total + (image.size || image.blob?.size || 0), 0);

        return { usage: graphBytes + imageBytes, quota: null };
    }

    return {
        countGraphs,
        getGraph,
        getAllGraphs,
        saveGraph,
        saveGraphs,
        deleteGraph,
        saveImage,
        getImage,
        getImageByHash,
        prepareImageForExport,
        importImage,
        estimateUsage
    };
})();
