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
