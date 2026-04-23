// main.js - Hệ thống quản lý PWA Generic Core v3.2 (Updated Paths)
import { appData } from './data.js';

let currentLang = 'vi';

// Cập nhật đường dẫn đến Worker do main.js đã chuyển vào assets/js/
const opfsWorker = new Worker('assets/js/opfs-worker.js');

let totalFiles = 0;
let loadedFiles = 0;

/**
 * 1. XỬ LÝ PHẢN HỒI TỪ WORKER
 */
opfsWorker.onmessage = (e) => {
    const { action, buffer, isSync, path } = e.data;

    if (action === 'audioBuffer') {
        if (isSync) {
            updateProgress();
        } else if (buffer) {
            const blob = new Blob([buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play().catch(console.warn);
            audio.onended = () => URL.revokeObjectURL(url);
        }
    } else if (action === 'error' && isSync) {
        updateProgress(); 
    }
};

function updateProgress() {
    loadedFiles++;
    if (totalFiles === 0) return;
    const percent = Math.round((loadedFiles / totalFiles) * 100);
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) progressFill.style.width = `${percent}%`;
    const percentText = document.getElementById('sync-percentage');
    if (percentText) percentText.textContent = `${percent}%`;
    
    if (loadedFiles >= totalFiles) {
        const statusText = document.getElementById('sync-status');
        if (statusText) statusText.textContent = "✅ Đã đồng bộ xong!";
        const container = document.getElementById('sync-container');
        if (container) {
            setTimeout(() => {
                container.style.opacity = '0';
                setTimeout(() => container.style.display = 'none', 1000);
            }, 2000);
        }
    }
}

/**
 * 2. ĐỒNG BỘ DỮ LIỆU
 */
async function syncMedia() {
    const syncContainer = document.getElementById('sync-container');
    if (!navigator.locks) return; 

    await navigator.locks.request('sync_assets_lock', async (lock) => {
        try {
            // Đảm bảo manifest.json nằm ở gốc của website
            const response = await fetch('manifest.json'); 
            if (!response.ok) throw new Error("Không tìm thấy manifest.json");
            const manifest = await response.json();
            totalFiles = manifest.files.length;
            loadedFiles = 0;

            if (totalFiles > 0 && syncContainer) {
                syncContainer.style.display = 'block';
                syncContainer.style.opacity = '1';
            }

            manifest.files.forEach(file => {
                opfsWorker.postMessage({ action: 'readFile', path: file.path, isSync: true });
            });
        } catch (err) {
            console.error("❌ Lỗi đồng bộ:", err);
        }
    });
}

window.addEventListener('load', () => {
    setTimeout(syncMedia, 2000);
});

/**
 * 3. LOGIC GIAO DIỆN
 */
document.querySelectorAll('.acc-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
            const grid = content.querySelector('.grid');
            if (grid) renderGrid(grid.id);
        }
    });
});

function renderGrid(categoryId) {
    const grid = document.getElementById(categoryId);
    
    if (!grid || grid.children.length > 0 || !appData[categoryId]) return;

    appData[categoryId].forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const extension = item.ext || 'svg';
        // Đường dẫn ảnh (assets/media/image/...)
        const imgPath = `assets/media/image/${categoryId}/${item.id}.${extension}`;
        
        card.innerHTML = `
            <img src="${imgPath}" alt="${item.display}" loading="lazy">
            <p>${item.display}</p>
        `;
        
        card.onclick = () => playSound(categoryId, item.id);
        grid.appendChild(card);
    });
}

window.setLang = (lang) => {
    currentLang = lang;
    document.querySelectorAll('.lang-switch button').forEach(btn => {
        btn.classList.toggle('active', btn.id === `btn-${lang}`);
    });
};

function playSound(categoryId, itemId) {
    // Đường dẫn âm thanh (assets/media/audio/...)
    const filePath = `assets/media/audio/${categoryId}/${currentLang}/${itemId}.mp3`;
    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath,
        isSync: false 
    });
}
