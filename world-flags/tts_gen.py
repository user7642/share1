#!/usr/bin/env python3
from gtts import gTTS
import os

# ==============================
# CONFIG
# ==============================
INPUT_FILE = "data.txt"
OUTPUT_DIR = "audio/asia"

LANGS = {
    "en": 1,  # cột English
    "vi": 2   # cột Vietnamese
}

# ==============================
# LOAD DATA
# ==============================
def load_data():
    data = []
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or "|" not in line:
                continue

            parts = line.split("|")
            if len(parts) < 3:
                continue

            key = parts[0].strip()
            en = parts[1].strip()
            vi = parts[2].strip()

            data.append({
                "key": key,
                "en": en,
                "vi": vi
            })
    return data

# ==============================
# GENERATE TTS
# ==============================
def generate():
    data = load_data()

    for lang, idx in LANGS.items():
        out_dir = os.path.join(OUTPUT_DIR, lang)
        os.makedirs(out_dir, exist_ok=True)

        print(f"\n🌍 Generating {lang}...")

        for item in data:
            key = item["key"]
            text = item[lang]

            out_path = os.path.join(out_dir, f"{key}.mp3")

            if os.path.exists(out_path):
                print(f"⏭️  Skip {key}")
                continue

            try:
                tts = gTTS(text=text, lang=lang)
                tts.save(out_path)
                print(f"✅ {key}.mp3")
            except Exception as e:
                print(f"❌ {key}: {e}")

# ==============================
# RUN
# ==============================
if __name__ == "__main__":
    generate()
