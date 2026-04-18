let currentLang = "vi";

const audio = document.getElementById("audio");

// =======================
// 🌍 ĐỔI NGÔN NGỮ
// =======================
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
// 🎯 RENDER (LAZY)
// =======================
function renderRegion(data, containerId, region) {
  const container = document.getElementById(containerId);

  if (!data || data.length === 0) return;
  if (container.dataset.rendered === "true") return; // tránh render lại

  const fragment = document.createDocumentFragment();

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img loading="lazy" src="img/${region}/${item.key}.png">
      <p>${item.label}</p>
    `;

    card.onclick = () => play(region, item.key);

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  container.dataset.rendered = "true";
}

// =======================
// 📂 ACCORDION + LAZY LOAD
// =======================
document.querySelectorAll(".acc-btn").forEach(btn => {
  btn.onclick = function () {
    const content = this.nextElementSibling;
    const grid = content.querySelector(".grid");
    const id = grid.id;

    const isOpen = content.style.display === "block";

    // toggle
    content.style.display = isOpen ? "none" : "block";

    // 👉 chỉ render khi mở lần đầu
    if (!isOpen) {
      renderRegion(regions[id], id, id);
    }
  };
});

// =======================
// 🚀 INIT
// =======================

// load ngôn ngữ
const savedLang = localStorage.getItem("lang") || "vi";
setLang(savedLang);

// ❌ KHÔNG render trước nữa (lazy hoàn toàn)

// =======================
// 🔧 SERVICE WORKER
// =======================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        console.log('✅ SW registered:', reg);

        reg.onupdatefound = () => {
          const newWorker = reg.installing;
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 New version available');
              } else {
                console.log('✅ App cached for offline');
              }
            }
          };
        };
      })
      .catch(err => {
        console.error('❌ SW error:', err);
      });
  });
}
