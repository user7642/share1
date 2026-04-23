// main.js — VERSION: AUTO EXT FALLBACK

import { appData } from './data.js';

let currentLang = 'vi';
let totalFiles = 0;
let loadedFiles = 0;

const opfsWorker = new Worker('./assets/js/opfs-worker.js');

/**
 * 1. SERVICE WORKER (clean)
 */
function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        const banner = document.getElementById('update-banner');
                        if (banner) banner.style.display = 'block';
                    }
                });
            });
        })
        .catch(err => console.error('❌ SW Registration Error:', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("🔄 Service Worker mới đã kích hoạt.");
        location.reload(); // auto update
    });
}

/**
 * 2. OPFS WORKER RESPONSE
 */
opfsWorker.onmessage = (e) => {
    const { action, buffer, isSync, path, message } = e.data;

    if (action === 'audioBuffer') {
        if (isSync) {
            updateProgress();
        } else if (buffer) {
            const blob = new Blob([buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.play().catch(err => console.warn("🔇 Audio error:", err));
            audio.onended = () => URL.revokeObjectURL(url);
        }
    } 
    else if (action === 'error') {
        console.error(`❌ OPFS Worker Error [${path}]:`, message);
        if (isSync) updateProgress();
    }
};

/**
 * Progress UI
 */
function updateProgress() {
    loadedFiles++;
    if (totalFiles === 0) return;

    const percent = Math.min(Math.round((loadedFiles / totalFiles) * 100), 100);

    const progressFill = document.getElementById('progress-fill');
    const percentText = document.getElementById('sync-percentage');
    const statusText = document.getElementById('sync-status');
    const container = document.getElementById('sync-container');

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `${percent}%`;

    if (loadedFiles >= totalFiles) {
        if (statusText) statusText.textContent = "✅ Đã đồng bộ xong tài nguyên!";
        setTimeout(() => {
            if (container) {
                container.style.opacity = '0';
                setTimeout(() => container.style.display = 'none', 1000);
            }
        }, 2000);
    }
}

/**
 * 3. SYNC MEDIA
 */
async function syncMedia() {
    if (!navigator.locks) return;

    await navigator.locks.request('sync_assets_lock', async () => {
        try {
            const response = await fetch('./media-list.json');
            if (!response.ok) throw new Error("Không tìm thấy media-list.json");

            const manifest = await response.json();
            const fileList = manifest.files || [];

            totalFiles = fileList.length;
            loadedFiles = 0;

            const syncContainer = document.getElementById('sync-container');

            if (totalFiles > 0 && syncContainer) {
                syncContainer.style.display = 'block';
                syncContainer.style.opacity = '1';

                fileList.forEach(file => {
                    opfsWorker.postMessage({
                        action: 'readFile',
                        path: file.path,
                        isSync: true
                    });
                });

                opfsWorker.postMessage({
                    action: 'cleanup',
                    manifestList: fileList.map(f => f.path)
                });
            }

        } catch (err) {
            console.error("❌ Sync error:", err);
        }
    });
}

/**
 * 4. IMAGE FALLBACK (🔥 PHẦN QUAN TRỌNG)
 */
function createImage(categoryId, itemId, display) {
    const img = document.createElement('img');

    const exts = ['svg', 'png', 'jpg', 'webp'];
    let index = 0;

    function tryNext() {
        if (index >= exts.length) {
            console.warn(`⚠️ Không tìm thấy ảnh cho: ${itemId}`);
            return;
        }
        img.src = `./assets/media/image/${categoryId}/${itemId}.${exts[index++]}`;
    }

    img.loading = 'lazy';
    img.alt = display;
    img.onerror = tryNext;

    tryNext();

    return img;
}

/**
 * 5. UI LOGIC
 */
function initAccordion() {
    document.querySelectorAll('.acc-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.classList.toggle('active');

            const content = this.nextElementSibling;
            const isOpen = content.style.display === "block";

            content.style.display = isOpen ? "none" : "block";

            if (!isOpen) {
                const grid = content.querySelector('.grid');
                if (grid) renderGrid(grid.id);
            }
        });
    });
}

function renderGrid(categoryId) {
    const grid = document.getElementById(categoryId);
    if (!grid || grid.children.length > 0 || !appData[categoryId]) return;

    const fragment = document.createDocumentFragment();

    appData[categoryId].forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';

        const img = createImage(categoryId, item.id, item.display);

        const p = document.createElement('p');
        p.textContent = item.display;

        card.appendChild(img);
        card.appendChild(p);

        card.onclick = () => playSound(categoryId, item.id);

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

window.setLang = (lang) => {
    currentLang = lang;
    document.querySelectorAll('.lang-switch button').forEach(btn => {
        btn.classList.toggle('active', btn.id === `btn-${lang}`);
    });
};

/**
 * AUDIO
 */
function playSound(categoryId, itemId) {
    const filePath = `./assets/media/audio/${categoryId}/${currentLang}/${itemId}.mp3`;

    if (/\.(html|js|css)$/i.test(filePath)) return;

    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath,
        isSync: false
    });
}

/**
 * INIT
 */
window.addEventListener('load', () => {
    initAccordion();
    initServiceWorker();

    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }

    setTimeout(syncMedia, 1500);
});
