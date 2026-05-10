import { downloadMediaFiles, loadManifestWithPending } from "./downloader.js";
import { getAudioBlob, getImageBlob, initOPFS } from "./opfs.js";

const DB_NAME = "vocab-pwa-db";
const DB_VERSION = 1;
const STORE_META = "meta";
const META_KEY = "download-meta";

const els = {
  overlay: document.querySelector("#download-overlay"),
  count: document.querySelector("#download-count"),
  percent: document.querySelector("#download-percent"),
  bar: document.querySelector("#download-bar"),
  grid: document.querySelector("#vocab-grid"),
  empty: document.querySelector("#empty-state"),
  retryButton: document.querySelector("#retry-download"),
  network: document.querySelector("#network-indicator"),
  cardTemplate: document.querySelector("#vocab-card-template"),
};

function updateNetworkIndicator() {
  const online = navigator.onLine;
  els.network.textContent = online ? "Online" : "Offline";
  els.network.classList.toggle("online", online);
  els.network.classList.toggle("offline", !online);
}

function setOverlay(visible) {
  els.overlay.classList.toggle("hidden", !visible);
}

function setProgress(done, total) {
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);
  els.count.textContent = `${done} / ${total} files`;
  els.percent.textContent = `${percent}%`;
  els.bar.style.width = `${percent}%`;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const store = tx.objectStore(STORE_META);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    const store = tx.objectStore(STORE_META);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function inferWordName(path) {
  const fileName = path.split("/").pop() ?? path;
  const raw = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function createVocabularyItems(manifest) {
  const imageByName = new Map();
  const audioByName = new Map();

  for (const item of manifest) {
    const key = inferWordName(item.path).toLowerCase();
    if (item.type === "image" && !imageByName.has(key)) {
      imageByName.set(key, item.path);
    }
    if (item.type === "audio" && !audioByName.has(key)) {
      audioByName.set(key, item.path);
    }
  }

  const allNames = new Set([...imageByName.keys(), ...audioByName.keys()]);
  return [...allNames]
    .map((name) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      imagePath: imageByName.get(name),
      audioPath: audioByName.get(name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.warn("Service worker registration failed:", error);
  }
}

async function renderVocabularyGrid(items) {
  els.grid.innerHTML = "";

  if (items.length === 0) {
    els.empty.classList.remove("hidden");
    return;
  }

  els.empty.classList.add("hidden");

  for (const item of items) {
    const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
    const image = node.querySelector("img");
    const title = node.querySelector("h3");
    title.textContent = item.name;
    image.alt = item.name;

    if (item.imagePath) {
      try {
        const imageBlob = await getImageBlob(item.imagePath);
        const imageUrl = URL.createObjectURL(imageBlob);
        image.src = imageUrl;
        image.addEventListener("load", () => URL.revokeObjectURL(imageUrl), { once: true });
      } catch (_error) {
        image.removeAttribute("src");
      }
    }

    const playSound = async () => {
      if (!item.audioPath) {
        return;
      }

      try {
        const audioBlob = await getAudioBlob(item.audioPath);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
        audio.addEventListener("ended", () => URL.revokeObjectURL(audioUrl), { once: true });
      } catch (_error) {
        console.warn("Audio not available for", item.name);
      }
    };

    node.addEventListener("click", playSound);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        playSound();
      }
    });

    els.grid.appendChild(node);
  }
}

async function syncMedia(db, meta) {
  const completedSet = new Set(meta.completedPaths ?? []);
  const { manifest, pending } = await loadManifestWithPending(completedSet);

  if (manifest.length === 0) {
    setOverlay(false);
    setProgress(0, 0);
    await renderVocabularyGrid([]);
    return;
  }

  const isDone = pending.length === 0;
  if (!isDone) {
    setOverlay(true);
    setProgress(manifest.length - pending.length, manifest.length);
  }

  if (pending.length > 0) {
    await downloadMediaFiles(pending, {
      async onFileSuccess(path) {
        completedSet.add(path);
        const nextMeta = {
          version: String(manifest.length),
          completedPaths: [...completedSet],
          doneCount: completedSet.size,
          totalCount: manifest.length,
          updatedAt: Date.now(),
        };
        await txPut(db, META_KEY, nextMeta);
      },
      onProgress(stats) {
        const done = manifest.length - pending.length + stats.doneCount;
        setProgress(done, manifest.length);
      },
    });
  }

  const completedMeta = {
    version: String(manifest.length),
    completedPaths: [...completedSet],
    doneCount: completedSet.size,
    totalCount: manifest.length,
    updatedAt: Date.now(),
  };
  await txPut(db, META_KEY, completedMeta);

  setOverlay(false);
  await renderVocabularyGrid(createVocabularyItems(manifest));
}

async function boot() {
  updateNetworkIndicator();
  window.addEventListener("online", updateNetworkIndicator);
  window.addEventListener("offline", updateNetworkIndicator);

  await registerServiceWorker();
  await initOPFS();
  const db = await openDB();
  const meta = (await txGet(db, META_KEY)) ?? {
    version: "0",
    completedPaths: [],
    doneCount: 0,
    totalCount: 0,
    updatedAt: 0,
  };

  els.retryButton.addEventListener("click", async () => {
    await syncMedia(db, { ...meta, completedPaths: [] });
  });

  await syncMedia(db, meta);
}

boot().catch((error) => {
  console.error("Application bootstrap failed:", error);
  setOverlay(false);
  els.empty.classList.remove("hidden");
  els.empty.textContent = "Khong the khoi dong ung dung. Vui long thu tai lai trang.";
});
