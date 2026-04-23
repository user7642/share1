// main.js - Hệ thống quản lý PWA Generic Core v3.2 (Updated)
import { appData } from './data.js';

let currentLang = 'vi';
let totalFiles = 0;
let loadedFiles = 0;

// Sử dụng đường dẫn tuyệt đối từ Root để đảm bảo chính xác trên mọi môi trường
const opfsWorker = new Worker('/assets/js/opfs-worker.js');

/**
 * 1. XỬ LÝ PHẢN HỒI TỪ WORKER
 */
opfsWorker.onmessage = (e) => {
    const { action, buffer, isSync, path, message } = e.data;

    if (action === 'audioBuffer') {
        if (isSync) {
            updateProgress();
        } else if (buffer) {
            // Phát âm thanh từ ArrayBuffer nhận được từ OPFS
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
 * 2. ĐỒNG BỘ DỮ LIỆU (OPFS)
 */
async function syncMedia() {
    if (!navigator.locks) return;

    await navigator.locks.request('sync_assets_lock', async () => {
        try {
            // Fetch manifest chứa danh sách media đã được lọc bởi generate_manifest.py
            const response = await fetch('/manifest.json'); 
            if (!response.ok) throw new Error("Không tìm thấy manifest.json");
            
            const manifest = await response.json();
            const fileList = manifest.files || [];
            
            totalFiles = fileList.length;
            loadedFiles = 0;

            const syncContainer = document.getElementById('sync-container');
            if (totalFiles > 0 && syncContainer) {
                syncContainer.style.display = 'block';
                syncContainer.style.opacity = '1';
                
                // Gửi lệnh tải từng file media
                fileList.forEach(file => {
                    opfsWorker.postMessage({ 
                        action: 'readFile', 
                        path: file.path, 
                        isSync: true 
                    });
                });

                // Gửi lệnh Cleanup để xóa file thừa (cũ) trong kho OPFS
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
 * 3. LOGIC GIAO DIỆN & RENDER
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
    // Tránh render lại nếu đã có nội dung
    if (!grid || grid.children.length > 0 || !appData[categoryId]) return;

    const fragment = document.createDocumentFragment();
    appData[categoryId].forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const ext = item.ext || 'svg';
        const imgPath = `/assets/media/image/${categoryId}/${item.id}.${ext}`;
        
        card.innerHTML = `
            <img src="${imgPath}" alt="${item.display}" loading="lazy">
            <p>${item.display}</p>
        `;
        
        // Gán sự kiện click để phát âm thanh
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
    // Luôn đảm bảo đường dẫn bắt đầu bằng / để Worker fetch chính xác từ Root
    const filePath = `/assets/media/audio/${categoryId}/${currentLang}/${itemId}.mp3`;
    
    // Kiểm tra nhanh: Nếu là file hệ thống (vô tình lọt vào) thì không gửi
    if (/\.(html|js|css)$/i.test(filePath)) return;

    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath,
        isSync: false 
    });
}

// Khởi chạy hệ thống
window.addEventListener('load', () => {
    initAccordion();
    // Chạy đồng bộ sau khi trang load 1.5s để ưu tiên hiển thị UI
    setTimeout(syncMedia, 1500);
});
