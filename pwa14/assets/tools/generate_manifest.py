import os
import json
import hashlib
import tempfile
from pathlib import Path
from datetime import datetime, timezone

EXTENSIONS = {
    '.mp3', '.ogg', '.wav',
    '.jpg', '.jpeg', '.png', '.webp', '.svg'
}

def get_sha256(file_path):
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    except Exception:
        return ""

def get_priority(path):
    if path.suffix.lower() in {'.mp3', '.ogg', '.wav'}:
        return 1
    return 2

def normalize_path(p: Path, root: Path):
    rel = p.relative_to(root)
    web_path = str(rel).replace(os.sep, '/')

    # chuẩn hoá tuyệt đối
    web_path = web_path.lstrip('./')
    web_path = web_path.lstrip('/')

    return web_path

def generate_manifest():
    root_dir = Path(__file__).parent.parent.parent

    # 🔥 FIX: chỉ scan media
    media_dir = root_dir / 'assets' / 'media'

    output_file = root_dir / 'media-list.json'

    files_list = []

    print(f"🔍 Scan media tại: {media_dir.resolve()}")

    if not media_dir.exists():
        print("❌ Không tìm thấy thư mục assets/media")
        return

    for p in media_dir.rglob('*'):
        if p.is_file() and p.suffix.lower() in EXTENSIONS:

            web_path = normalize_path(p, root_dir)

            ext = p.suffix.lower()
            category = "audio" if ext in {'.mp3', '.ogg', '.wav'} else "image"

            files_list.append({
                "path": web_path,
                "sha256": get_sha256(p),
                "size": p.stat().st_size,
                "category": category,
                "priority": get_priority(p)
            })

    manifest = {
        "header": {
            "version": datetime.now(timezone.utc).strftime('%Y.%m.%d-%H%M'),
            "generated": datetime.now(timezone.utc).isoformat(),
            "author": "PWA Flag Core System",
            "description": "Media asset list for OPFS synchronization"
        },
        "count": len(files_list),
        "files": sorted(files_list, key=lambda x: (x['priority'], x['path']))
    }

    try:
        with tempfile.NamedTemporaryFile(
            'w', dir=root_dir, suffix='.tmp', delete=False, encoding='utf-8'
        ) as tmp:
            json.dump(manifest, tmp, ensure_ascii=False, indent=2)
            tmp_path = tmp.name

        Path(tmp_path).replace(output_file)

        print(f"✅ OK: {output_file.name}")
        print(f"📦 Tổng file: {len(files_list)}")
        print(f"📁 Path chuẩn: assets/media/...")

    except Exception as e:
        print(f"❌ Lỗi ghi file: {e}")

if __name__ == "__main__":
    generate_manifest()
