// ==========================================
// ⚙️ CẤU HÌNH & BIẾN KHỞI TẠO
// ==========================================
let currentLang = localStorage.getItem("lang") || "vi";
const audio = document.getElementById("audio");
const CACHE_NAME = 'hoc-co-v1'; // Khớp với tên trong sw.js

// ==========================================
// 🌍 QUẢN LÝ NGÔN NGỮ
// ==========================================
function setLang(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);

    // Cập nhật giao diện nút bấm
    document.querySelectorAll(".lang-switch button").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`btn-${lang}`).classList.add("active");
}

// ==========================================
// 🔊 LOGIC PHÁT ÂM
// ==========================================
function play(region, key) {
    audio.pause(); 
    audio.currentTime = 0;
    // Đường dẫn khớp với cấu trúc thư mục thực tế của bạn
    audio.src = `audio/${region}/${currentLang}/${key}.mp3`;
    audio.play().catch(err => console.warn("Không tìm thấy file âm thanh:", audio.src));
}

// ==========================================
// 🔠 CHUYỂN ĐỔI KEY → FILE NAME (Cho ảnh SVG)
// ==========================================
function toFileName(key) {
    return key
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

// ==========================================
// 🎯 RENDER GIAO DIỆN
// ==========================================
function renderRegion(data, containerId, region) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        // Sử dụng hàm toFileName để khớp với tên file ảnh SVG thực tế
        card.innerHTML = `
            <img src="flags/${region}/${toFileName(item.key)}.svg" alt="${item.label}" loading="lazy">
            <p>${item.label}</p>
        `;

        card.onclick = () => play(region, item.key);
        container.appendChild(card);
    });
}

// ==========================================
// 📂 ĐIỀU KHIỂN ACCORDION (Đóng/Mở vùng)
// ==========================================
document.querySelectorAll(".acc-btn").forEach(btn => {
    btn.onclick = function () {
        this.classList.toggle("active");
        const content = this.nextElementSibling;
        content.style.display = (content.style.display === "block") ? "none" : "block";
    };
});

// ==========================================
// 🚀 KHỞI CHẠY & OFFLINE PRE-CACHE
// ==========================================
function init() {
    // 1. Thiết lập ngôn ngữ mặc định
    setLang(currentLang);

    // 2. Render tất cả các vùng dữ liệu từ data.js
    // Sử dụng Object.entries để duyệt qua mọi vùng có trong regions
    Object.entries(regions).forEach(([key, data]) => {
        renderRegion(data, key, key);
    });

    // 3. Tải trước toàn bộ tài nguyên để dùng Offline
    if ('serviceWorker' in navigator && 'caches' in window) {
        window.addEventListener('load', () => {
            caches.open(CACHE_NAME).then(cache => {
                console.log("PWA: Đang tải dữ liệu offline...");

                Object.entries(regions).forEach(([region, countryList]) => {
                    countryList.forEach(item => {
                        const fileName = toFileName(item.key);
                        
                        // Danh sách file cần lưu trữ
                        const assets = [
                            `flags/${region}/${fileName}.svg`,
                            `audio/${region}/vi/${item.key}.mp3`,
                            `audio/${region}/en/${item.key}.mp3`
                        ];

                        // Tải ngầm từng file vào bộ nhớ đệm
                        assets.forEach(url => {
                            cache.add(url).catch(() => {
                                // Bỏ qua nếu file thiếu trên server, không làm gián đoạn app
                                // console.log("Thiếu file:", url); 
                            });
                        });
                    });
                });
            });
        });
    }
}

// Chạy ứng dụng
init();
