let currentLang = "vi";

const audio = document.getElementById("audio");

// =======================
// 🌍 ĐỔI NGÔN NGỮ
// =======================
function setLang(lang) {
  currentLang = lang;
}

// =======================
// 🔊 PHÁT ÂM (đa châu lục)
// =======================
function play(region, key) {
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
renderRegion(regions.asia, "asia", "asia");
renderRegion(regions.europe, "europe", "europe");
