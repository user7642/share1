// main.js - Hệ thống quản lý PWA Flag Core v2.0
import { countryData } from './data.js';

let currentLang = 'vi';
const opfsWorker = new Worker('opfs-worker.js');

// Biến quản lý tiến trình đồng bộ
let totalFiles = 0;
let loadedFiles = 0;

/**
 * 1. KHỞI TẠO HỆ THỐNG & ĐỒNG BỘ (SYNC)
 */

async function syncMedia() {
    const syncContainer = document.getElementById('sync-container');
    const syncStatus = document.getElementById('sync-status');

    console.log("🔄 Đang kiểm tra đồng bộ hóa tài nguyên...");

    if (!navigator.locks) return; 

    await navigator.locks.request('sync_assets_lock', async (lock) => {
        try {
            const response = await fetch('manifest.json');
            if (!response.ok) throw new Error("Không tìm thấy manifest.json");
            
            const manifest = await response.json();
            totalFiles = manifest.files.length;
            loadedFiles = 0;

            if (totalFiles > 0 && syncContainer) {
                syncContainer.style.display = 'block';
                syncContainer.style.opacity = '1'; // Đảm bảo hiển thị rõ ràng khi bắt đầu
            }
            
            if (navigator.storage && navigator.storage.estimate) {
                const { quota, usage } = await navigator.storage.estimate();
                const totalNeeded = manifest.files.reduce((acc, f) => acc + f.size, 0);
                
                if (totalNeeded > (quota - usage)) {
                    console.warn("⚠️ Bộ nhớ thiết bị sắp đầy, quá trình tải ngầm có thể bị gián đoạn.");
                }
            }

            const sortedFiles = manifest.files.sort((a, b) => a.priority - b.priority);
            console.log(`📦 Tìm thấy ${totalFiles} tài nguyên. Bắt đầu tải ngầm...`);

            for (const file of sortedFiles) {
                opfsWorker.postMessage({
                    action: 'readFile',
                    path: file.path,
                    isSync: true 
                });
            }
            
        } catch (err) {
            console.error("❌ Lỗi đồng bộ hóa:", err);
            if (syncStatus) syncStatus.innerText = "❌ Lỗi đồng bộ dữ liệu";
        }
    });
}

window.addEventListener('load', () => {
    setTimeout(syncMedia, 2000);
});

/**
 * 2. LOGIC GIAO DIỆN (UI & ACCORDION)
 */

function formatDisplayName(id) {
    return id.split('-')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}

document.querySelectorAll('.acc-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
            const gridId = content.querySelector('.grid').id;
            renderGrid(gridId);
        }
    });
});

function renderGrid(continent) {
    const grid = document.getElementById(continent);
    if (!grid || grid.children.length > 0) return;

    const countries = countryData[continent] || [];
    
    countries.forEach(countryId => {
        const card = document.createElement('div');
        card.className = 'card';
        const fileName = formatDisplayName(countryId);
        
        card.innerHTML = `
            <img src="assets/media/flags/${continent}/${fileName}.svg" 
                 alt="${fileName}" loading="lazy">
            <p>${fileName}</p>
        `;
        
        card.onclick = () => playSound(continent, countryId);
        grid.appendChild(card);
    });
}

/**
 * 3. XỬ LÝ ÂM THANH & NGÔN NGỮ
 */

window.setLang = function(lang) {
    currentLang = lang;
    document.getElementById('btn-vi').classList.toggle('active', lang === 'vi');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
};

function playSound(continent, countryId) {
    const filePath = `assets/media/audio/${continent}/${currentLang}/${countryId}.mp3`;
    
    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath,
        isSync: false 
    });
}

// Nhận phản hồi từ Worker
opfsWorker.onmessage = (e) => {
    const { action, buffer, isSync } = e.data;

    if (action === 'audioBuffer') {
        // 1. Xử lý cập nhật tiến trình Sync
        if (isSync) {
            loadedFiles++;
            const percent = Math.round((loadedFiles / totalFiles) * 100);
            
            const progressFill = document.getElementById('progress-fill');
            const syncPercentage = document.getElementById('sync-percentage');
            const syncStatus = document.getElementById('sync-status');
            const syncContainer = document.getElementById('sync-container');

            if (progressFill) progressFill.style.width = `${percent}%`;
            if (syncPercentage) syncPercentage.innerText = `${percent}%`;
            if (syncStatus) syncStatus.innerText = `Đã tải ${loadedFiles}/${totalFiles} tệp`;

            // Khi hoàn thành 100%
            if (loadedFiles === totalFiles) {
                setTimeout(() => {
                    if (syncStatus) syncStatus.innerText = "✅ Đã sẵn sàng Offline!";
                    
                    // Đợi 3 giây để người dùng xác nhận thông báo, sau đó ẩn mượt mà
                    setTimeout(() => {
                        if (syncContainer) {
                            syncContainer.style.transition = 'opacity 1s ease';
                            syncContainer.style.opacity = '0';
                            
                            // Sau khi mờ hẳn (1s) thì set display none
                            setTimeout(() => {
                                syncContainer.style.display = 'none';
                            }, 1000);
                        }
                    }, 3000);
                }, 500);
            }
        } 
        
        // 2. Phát âm thanh khi người dùng nhấn (isSync === false)
        if (!isSync) {
            try {
                const blob = new Blob([buffer], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play().catch(err => console.warn("Trình duyệt chặn audio:", err));
                audio.onended = () => URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Lỗi âm thanh:", err);
            }
        }
    }
};
