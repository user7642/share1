let currentLang = "vi"; // mặc định

const audio = document.getElementById("audio");

// đổi ngôn ngữ
function setLang(lang) {
  currentLang = lang;
}

// phát âm
function play(key) {
  audio.src = `audio/asia/${currentLang}/${key}.mp3`;
  audio.play();
}

// render
function renderAsia() {
  const container = document.getElementById("asia");

  asia.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="flags/asia/${capitalize(item.key)}.svg">
      <p>${item.label}</p>
    `;

    card.onclick = () => play(item.key);

    container.appendChild(card);
  });
}

// viết hoa chữ cái đầu (để khớp file SVG)
function capitalize(key) {
  return key
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// accordion
document.querySelector(".acc-btn").onclick = function () {
  const content = this.nextElementSibling;
  content.style.display =
    content.style.display === "block" ? "none" : "block";
};

renderAsia();
