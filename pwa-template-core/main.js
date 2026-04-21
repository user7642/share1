// Nạp dữ liệu từ file data.js
import { countryData } from './data.js';

let currentLang = 'vi';
const opfsWorker = new Worker('opfs-worker.js');

// Hàm chuẩn hóa tên ID thành tên file hiển thị (ví dụ: "north-korea" -> "North Korea")
function formatDisplayName(id) {
    return id.split('-')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}

// Khởi tạo Accordion (Mở/Đóng menu châu lục)
document.querySelectorAll('.acc-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        
        // Hiệu ứng đóng mở
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
            // Khi mở ra thì render danh sách cờ bên trong
            const gridId = content.querySelector('.grid').id;
            renderGrid(gridId);
        }
    });
});

// Hàm tạo danh sách các lá cờ
function renderGrid(continent) {
    const grid = document.getElementById(continent);
    if (!grid || grid.children.length > 0) return; // Nếu đã có dữ liệu rồi thì không render lại

    const countries = countryData[continent] || [];
    
    countries.forEach(countryId => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Tên hiển thị và tên file ảnh (ví dụ: Vietnam.svg, North Korea.svg)
        const fileName = formatDisplayName(countryId);
        
        card.innerHTML = `
            <img src="assets/media/flags/${continent}/${fileName}.svg" 
                 alt="${fileName}" loading="lazy">
            <p>${fileName}</p>
        `;
        
        // Gán sự kiện click để phát âm thanh
        card.onclick = () => playSound(continent, countryId);
        grid.appendChild(card);
    });
}

// Hàm chuyển đổi ngôn ngữ
window.setLang = function(lang) {
    currentLang = lang;
    document.getElementById('btn-vi').classList.toggle('active', lang === 'vi');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
};

// Hàm gửi yêu cầu phát âm thanh tới Worker
function playSound(continent, countryId) {
    // Đường dẫn ví dụ: assets/media/audio/asia/vi/vietnam.mp3
    const filePath = `assets/media/audio/${continent}/${currentLang}/${countryId}.mp3`;
    
    opfsWorker.postMessage({
        action: 'readFile',
        path: filePath
    });
}

// Nhận dữ liệu âm thanh từ Worker và phát
opfsWorker.onmessage = (e) => {
    if (e.data.action === 'audioBuffer') {
        try {
            const blob = new Blob([e.data.buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play().catch(err => console.warn("Lỗi phát âm thanh (có thể do trình duyệt chặn):", err));
            audio.onended = () => URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Lỗi xử lý audio buffer:", err);
        }
    }
};
