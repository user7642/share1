#!/usr/bin/env python3
from gtts import gTTS
import os

# =============================
# ⚙️ CONFIG (CHỈ SỬA DÒNG NÀY)
# =============================
REGION = "north-america"   # 👈 đổi thành asia europe africa north-america south-america oceania
INPUT_FILE = "data.txt"

OUTPUT_ROOT = "audio"

# =============================
# 🚀 MAIN
# =============================
if not os.path.exists(INPUT_FILE):
    print("❌ Không tìm thấy data.txt")
    exit()

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]

print(f"🌍 Tạo TTS cho: {REGION}")

for line in lines:
    try:
        key, en_text, vi_text = line.split("|")
    except:
        print(f"❌ Sai format: {line}")
        continue

    for lang, text in [("en", en_text), ("vi", vi_text)]:

        out_dir = os.path.join(OUTPUT_ROOT, REGION, lang)
        os.makedirs(out_dir, exist_ok=True)

        out_path = os.path.join(out_dir, f"{key}.mp3")

        if os.path.exists(out_path):
            continue

        try:
            tts = gTTS(text=text, lang=lang)
            tts.save(out_path)
            print(f"  ✅ {REGION}/{lang}/{key}.mp3")
        except Exception as e:
            print(f"  ❌ {key}: {e}")

print("🎉 DONE")
