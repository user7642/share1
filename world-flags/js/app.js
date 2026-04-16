let currentLang = "vi";

const audio = document.getElementById("audio");

// =======================
// 🌍 ĐỔI NGÔN NGỮ
// =======================
function setLang(lang) {
  currentLang = lang;

  // lưu lại lựa chọn
  localStorage.setItem("lang", lang);

  // reset active
  document.getElementById("btn-vi").classList.remove("active");
  document.getElementById("btn-en").classList.remove("active");

  // set active
  document.getElementById("btn-" + lang).classList.add("active");
}

// =======================
// 🔊 PHÁT ÂM (đa châu lục)
// =======================
function play(region, key) {
  audio.pause(); // tránh chồng âm
  audio.currentTime = 0;

  audio.src = `audio/${region}/${currentLang}/${key}.mp3`;
  audio.play();
}

// =======================
// 🎯 RENDER CHUNG
// =======================
function renderRegion(data, containerId, region) {
  const container = document.getElementById(containerId);

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="flags/${region}/${toFileName(item.key)}.svg">
      <p>${item.label}</p>
    `;

    card.onclick = () => play(region, item.key);

    container.appendChild(card);
  });
}

// =======================
// 🔠 KEY → FILE NAME
// =======================
function toFileName(key) {
  return key
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// =======================
// 📂 ACCORDION (MULTI)
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

// load ngôn ngữ đã lưu
const savedLang = localStorage.getItem("lang") || "vi";
setLang(savedLang);

// render
renderRegion(regions.asia, "asia", "asia");
renderRegion(regions.europe, "europe", "europe");
renderRegion(regions.africa, "africa", "africa");
renderRegion(regions.oceania, "oceania", "oceania");
renderRegion(regions["north-america"], "north-america", "north-america");
renderRegion(regions["south-america"], "south-america", "south-america");
