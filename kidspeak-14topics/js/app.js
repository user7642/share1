let currentLang = "vi";
const audio = document.getElementById("audio");

// =======================
// 🌍 ĐỔI NGÔN NGỮ
// =======================
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.getElementById("btn-vi").classList.remove("active");
  document.getElementById("btn-en").classList.remove("active");
  document.getElementById("btn-" + lang).classList.add("active");
}

// =======================
// 🔊 PHÁT ÂM
// =======================
function play(region, key) {
  audio.pause();
  audio.currentTime = 0;
  audio.src = `audio/${region}/${currentLang}/${key}.mp3`;
  audio.play();
}

// =======================
// 🎯 RENDER
// =======================
function renderRegion(data, containerId, region) {
  const container = document.getElementById(containerId);
  if (!data || data.length === 0) return;

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="img/${region}/${item.key}.png">
      <p>${item.label}</p>
    `;
    card.onclick = () => play(region, item.key);
    container.appendChild(card);
  });
}

// =======================
// 📂 ACCORDION
// =======================
document.querySelectorAll(".acc-btn").forEach(btn => {
  btn.onclick = function () {
    const content = this.nextElementSibling;
    content.style.display = content.style.display === "block" ? "none" : "block";
  };
});

// =======================
// 🚀 INIT & RENDER 14 CHỦ ĐỀ
// =======================
const savedLang = localStorage.getItem("lang") || "vi";
setLang(savedLang);

// Render dữ liệu từ data.js
for (const topic in regions) {
  if (document.getElementById(topic)) {
    renderRegion(regions[topic], topic, topic);
  }
}

// =======================
// 🔥 PWA & CACHING LOGIC
// =======================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    // Kiểm tra nếu SW đã cài đặt xong và đang chờ hoặc đang chạy
    if (reg.active) {
      startFullCaching();
    }
    
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          startFullCaching();
        }
      });
    });
  });

  // Lắng nghe tiến độ từ Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_PROGRESS') {
      const progressBar = document.getElementById('download-progress');
      if (progressBar) {
        progressBar.style.width = event.data.progress + '%';
        // Khi đạt 100%, ẩn thanh tiến trình sau 1 giây
        if (event.data.progress >= 100) {
          setTimeout(() => {
            progressBar.style.opacity = '0';
            setTimeout(() => progressBar.style.display = 'none', 500);
          }, 1000);
        }
      }
    }
  });
}

function startFullCaching() {
  const files = [];
  // Quét toàn bộ 14 chủ đề để lấy danh sách file
  for (const topic in regions) {
    regions[topic].forEach(item => {
      files.push(`img/${topic}/${item.key}.png`);
      files.push(`audio/${topic}/vi/${item.key}.mp3`);
      files.push(`audio/${topic}/en/${item.key}.mp3`);
    });
  }

  // Đảm bảo SW đã điều khiển trang trước khi gửi tin nhắn
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'START_CACHING',
      files: files
    });
  } else {
    // Nếu chưa có controller (lần đầu load), đợi một chút rồi gửi lại
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'START_CACHING',
          files: files
        });
      }
    });
  }
}
