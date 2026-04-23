// main.js - Hệ thống quản lý PWA Generic Core v3.2 (Full Optimized)
import { appData } from './data.js';

let currentLang = 'vi';
let totalFiles = 0;
let loadedFiles = 0;

// FIX 1: Loại bỏ dấu / ở đầu để Worker tìm đúng file trong thư mục assets/js
const opfsWorker = new Worker('assets/js/opfs-worker.js');

/**
 * 1. QUẢN LÝ SERVICE WORKER & THÔNG BÁO CẬP NHẬT
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // FIX 2: Loại bỏ dấu / ở đầu để đăng ký SW tại thư mục hiện tại
        navigator.serviceWorker.register('service-worker.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        const banner = document.getElementById('update-banner');
                        if (banner) banner.style.display = 'block';
                    }
                });
            });
        }).catch(err => console.error('❌ SW Registration Error:', err));
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("🔄 Service Worker mới đã kích hoạt thành công.");
    });
}

/**
 * 2. XỬ LÝ PHẢN HỒI TỪ OPFS WORKER
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
            audio.play().catch(err => console.warn("🔇 Lỗi phát âm thanh:", err));
            audio.onended = () => URL.revokeObjectURL(url);
        }
    } else if (action === 'error') {
        console.error(`❌ OPFS Worker Error [${path}]:`, message);
        if (isSync) updateProgress(); 
    }
};

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
 * 3. ĐỒNG BỘ DỮ LIỆU MEDIA (OPFS)
 */
async function syncMedia() {
    if (!navigator.locks) return;

    await navigator.locks.request('sync_assets_lock', async () => {
        try {
            // FIX 3: Fetch manifest.json từ thư mục hiện tại
            const response = await fetch('manifest.json'); 
            if (!response.ok) throw new Error("Không tìm thấy manifest.json");
            
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
                        // Dữ liệu trong manifest.json nên là đường dẫn tương đối (không có / đầu)
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
            console.error("❌ Lỗi đồng bộ tài nguyên:", err);
        }
    });
}

/**
 * 4. LOGIC GIAO DIỆN & RENDER
 */
function initAccordion() {
    document.querySelectorAll('.acc-btn').forEach(btn => {
        btn.addEventListener('click', function() {
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
        const ext = item.ext || 'svg';
        // FIX 4: Đường dẫn ảnh tương đối
        const imgPath = `assets/media/image/${categoryId}/${item.id}.${ext}`;
        
        card.innerHTML = `
            <img src="${imgPath}" alt="${item.display}" loading="lazy">
            <p>${item.display}</p>
        `;
        
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

function playSound(categoryId, itemId) {
    // FIX 5: Đường dẫn audio tương đối
    const filePath = `assets/media/audio/${categoryId}/${currentLang}/${itemId}.mp3`;
    if (/\.(html|js|css)$/i.test(filePath)) return;

    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath,
        isSync: false 
    });
}

/**
 * 5. KHỞI CHẠY HỆ THỐNG
 */
window.addEventListener('load', () => {
    initAccordion();
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }
    setTimeout(syncMedia, 1500);
});
