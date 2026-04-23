import os
import json
import hashlib
import tempfile
from pathlib import Path
from datetime import datetime, timezone

# CHỈ QUÉT CÁC ĐỊNH DẠNG MEDIA (Đã loại bỏ .html, .js, .css để không đưa vào OPFS)
EXTENSIONS = {
    '.mp3', '.ogg', '.wav', 
    '.jpg', '.jpeg', '.png', '.webp', '.svg'
}

def get_sha256(file_path):
    """Tính mã băm để kiểm tra tính toàn vẹn file."""
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception:
        return ""

def get_priority(path):
    """Gán độ ưu tiên tải cho Media: Audio (1) > Image (2)"""
    ext = path.suffix.lower()
    if ext in {'.mp3', '.ogg', '.wav'}:
        return 1
    return 2

def generate_manifest():
    # Xác định gốc dự án (Script nằm trong assets/tools -> quay lại 3 cấp)
    root_dir = Path(__file__).parent.parent.parent
    output_file = root_dir / 'manifest.json'
    
    files_list = []
    print(f"🔍 Đang quét tài nguyên Media tại: {root_dir.resolve()}")

    # Quét tài nguyên
    for p in root_dir.rglob('*'):
        # Loại bỏ các thư mục ẩn và các file script python
        if p.is_file() and not any(part.startswith('.') for part in p.parts):
            if p.suffix.lower() in EXTENSIONS:
                
                filename = p.name
                # Loại trừ các file cấu hình và công cụ
                if filename in {'manifest.json', 'gen_data.py', 'generate_manifest.py'}:
                    continue
                
                # Tạo đường dẫn web tuyệt đối (bắt đầu bằng /)
                rel_path = p.relative_to(root_dir)
                web_path = '/' + str(rel_path).replace(os.sep, '/')
                
                # Phân loại category (Chỉ còn Audio và Image)
                ext = p.suffix.lower()
                if ext in {'.mp3', '.ogg', '.wav'}:
                    category = "audio"
                else:
                    category = "image"
                
                files_list.append({
                    "path": web_path,
                    "sha256": get_sha256(p),
                    "size": p.stat().st_size,
                    "category": category,
                    "priority": get_priority(p)
                })

    # Cấu trúc Manifest hoàn chỉnh
    manifest = {
        "header": {
            "version": datetime.now(timezone.utc).strftime('%Y.%m.%d-%H%M'),
            "generated": datetime.now(timezone.utc).isoformat(),
            "author": "PWA Flag Core System",
            "description": "Media asset manifest for OPFS synchronization"
        },
        "count": len(files_list),
        # Sắp xếp theo ưu tiên và đường dẫn
        "files": sorted(files_list, key=lambda x: (x['priority'], x['path']))
    }

    # Ghi file an toàn (Atomic Write)
    try:
        with tempfile.NamedTemporaryFile('w', dir=root_dir, suffix='.tmp', delete=False, encoding='utf-8') as tmp:
            json.dump(manifest, tmp, ensure_ascii=False, indent=2)
            tmp_path = tmp.name

        Path(tmp_path).replace(output_file)
        print(f"✅ THÀNH CÔNG: Đã tạo {output_file.name} với {len(files_list)} tài nguyên Media.")
        print(f"💡 Lưu ý: Các file App Shell (.html, .js, .css) đã được loại bỏ để Service Worker quản lý riêng.")
    except Exception as e:
        print(f"❌ LỖI khi tạo manifest: {e}")

if __name__ == "__main__":
    generate_manifest()
