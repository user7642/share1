// main.js - Hệ thống quản lý PWA Flag Core v2.0
import { countryData } from './data.js';

let currentLang = 'vi';
const opfsWorker = new Worker('opfs-worker.js');

/**
 * 1. KHỞI TẠO HỆ THỐNG & ĐỒNG BỘ (SYNC)
 */

// Hàm thực hiện đồng bộ hóa toàn bộ tài nguyên dựa trên manifest.json
async function syncMedia() {
    console.log("🔄 Đang kiểm tra đồng bộ hóa tài nguyên...");

    // Web Lock API: Đảm bảo chỉ có duy nhất 1 tab thực hiện quá trình sync
    if (!navigator.locks) return; 

    await navigator.locks.request('sync_assets_lock', async (lock) => {
        try {
            const response = await fetch('manifest.json');
            if (!response.ok) throw new Error("Không tìm thấy manifest.json");
            
            const manifest = await response.json();
            
            // Kiểm tra dung lượng bộ nhớ (Quota Guard)
            if (navigator.storage && navigator.storage.estimate) {
                const { quota, usage } = await navigator.storage.estimate();
                const totalNeeded = manifest.files.reduce((acc, f) => acc + f.size, 0);
                
                if (totalNeeded > (quota - usage)) {
                    console.warn("⚠️ Bộ nhớ thiết bị sắp đầy, quá trình tải ngầm có thể bị gián đoạn.");
                }
            }

            // Sắp xếp tệp theo độ ưu tiên (Audio tải trước, Image tải sau)
            const sortedFiles = manifest.files.sort((a, b) => a.priority - b.priority);
            console.log(`📦 Tìm thấy ${sortedFiles.length} tài nguyên. Bắt đầu tải ngầm...`);

            // Gửi yêu cầu tải cho Worker xử lý ngầm
            for (const file of sortedFiles) {
                opfsWorker.postMessage({
                    action: 'readFile',
                    path: file.path
                });
            }
            
        } catch (err) {
            console.error("❌ Lỗi đồng bộ hóa:", err);
        }
    });
}

// Chạy tiến trình đồng bộ khi trang web đã tải xong
window.addEventListener('load', () => {
    // Trì hoãn 2 giây để ưu tiên hiển thị giao diện trước
    setTimeout(syncMedia, 2000);
});

/**
 * 2. LOGIC GIAO DIỆN (UI & ACCORDION)
 */

// Hàm chuẩn hóa tên ID thành tên file hiển thị (ví dụ: "south-korea" -> "South Korea")
function formatDisplayName(id) {
    return id.split('-')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}

// Cấu hình sự kiện cho các nút Accordion
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

// Hàm tạo danh sách lá cờ bên trong mỗi châu lục
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

// Hàm chuyển đổi ngôn ngữ (Gán vào window để HTML onclick có thể gọi)
window.setLang = function(lang) {
    currentLang = lang;
    document.getElementById('btn-vi').classList.toggle('active', lang === 'vi');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
};

// Gửi yêu cầu phát âm thanh tới Worker
function playSound(continent, countryId) {
    const filePath = `assets/media/audio/${continent}/${currentLang}/${countryId}.mp3`;
    
    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath
    });
}

// Nhận dữ liệu âm thanh từ Worker và phát ra loa
opfsWorker.onmessage = (e) => {
    if (e.data.action === 'audioBuffer') {
        try {
            const blob = new Blob([e.data.buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play().catch(err => console.warn("Trình duyệt chặn tự động phát âm thanh. Hãy tương tác với trang web trước."));
            
            // Giải phóng bộ nhớ sau khi phát xong
            audio.onended = () => URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Lỗi xử lý luồng âm thanh:", err);
        }
    }
};
