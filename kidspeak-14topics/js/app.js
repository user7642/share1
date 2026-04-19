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

  if (!data || data.length === 0) return; // tránh lỗi topic chưa làm

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
    content.style.display =
      content.style.display === "block" ? "none" : "block";
  };
});

// =======================
// 🚀 INIT
// =======================

// load ngôn ngữ
const savedLang = localStorage.getItem("lang") || "vi";
setLang(savedLang);

// =======================
// 🔥 RENDER 14 CHỦ ĐỀ
// =======================

renderRegion(regions.pets, "pets", "pets");
renderRegion(regions.wild, "wild", "wild");
renderRegion(regions.sea, "sea", "sea");
renderRegion(regions.flowers, "flowers", "flowers");
renderRegion(regions.vegetables, "vegetables", "vegetables");
renderRegion(regions.fruits, "fruits", "fruits");
renderRegion(regions.body, "body", "body");
renderRegion(regions.numbers, "numbers", "numbers");
renderRegion(regions.alphabet, "alphabet", "alphabet");
renderRegion(regions.colors, "colors", "colors");
renderRegion(regions.shapes, "shapes", "shapes");
renderRegion(regions.jobs, "jobs", "jobs");
renderRegion(regions.insects, "insects", "insects");
renderRegion(regions.vehicles, "vehicles", "vehicles");


// Đăng ký Service Worker và xử lý Cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          startFullCaching();
        }
      });
    });
    
    // Nếu đã active rồi thì cứ chạy tải dữ liệu
    if (navigator.serviceWorker.controller) {
      startFullCaching();
    }
  });
}

function startFullCaching() {
  const files = [];
  // Tự động quét 14 chủ đề từ data.js
  for (const topic in regions) {
    regions[topic].forEach(item => {
      files.push(`img/${topic}/${item.key}.png`);
      files.push(`audio/${topic}/vi/${item.key}.mp3`);
      files.push(`audio/${topic}/en/${item.key}.mp3`);
    });
  }

  // Gửi danh sách cho SW để "hút" dữ liệu
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'START_CACHING',
      files: files
    });
  }
}

// Lắng nghe tiến độ từ SW
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_PROGRESS') {
    const progressBar = document.getElementById('download-progress');
    progressBar.style.width = event.data.progress + '%';
    if (event.data.progress >= 100) {
      setTimeout(() => progressBar.style.display = 'none', 1000);
    }
  }
});
