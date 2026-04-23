import os
import json
import hashlib
import tempfile
from pathlib import Path
from datetime import datetime, timezone

# 1. Cấu hình mở rộng cần quét
EXTENSIONS = {
    '.mp3', '.ogg', '.wav', 
    '.jpg', '.jpeg', '.png', '.webp', '.svg',
    '.css', '.js', '.ico', '.webmanifest'
}

def get_sha256(file_path):
    """Tính mã băm SHA-256 để kiểm tra tính toàn vẹn."""
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception:
        return ""

def get_priority(path):
    """Gán độ ưu tiên: Code (1) > Audio (2) > Image (3)"""
    ext = path.suffix.lower()
    if ext in {'.js', '.css', '.webmanifest'}:
        return 1
    if ext in {'.mp3', '.ogg', '.wav'}:
        return 2
    return 3

def generate_manifest():
    # Vì script nằm trong assets/tools, ta cần quay lại thư mục gốc để quét
    # Sử dụng Path(__file__).parent.parent.parent để trỏ về gốc dự án
    root_dir = Path(__file__).parent.parent.parent
    output_file = root_dir / 'manifest.json'
    
    files_list = []
    
    print(f"🔍 Đang quét tài nguyên từ gốc: {root_dir.resolve()}")

    # Quét toàn bộ project
    for p in root_dir.rglob('*'):
        # CHỈ quét các file trong 'assets', 'index.html', 'install.html', 'service-worker.js', 'opfs-worker.js'
        # LOẠI TRỪ các file script python và các file ẩn
        if p.is_file() and p.suffix.lower() in EXTENSIONS:
            
            # Tên file để kiểm tra loại trừ
            filename = p.name
            
            # Không đưa chính file manifest.json hoặc các script python vào manifest
            if filename in {'manifest.json', 'gen_data.py', 'generate_manifest.py'}:
                continue
            
            # Chuyển đường dẫn thành định dạng web tương đối từ gốc (dùng dấu /)
            rel_path = p.relative_to(root_dir)
            web_path = str(rel_path).replace(os.sep, '/')
            
            ext = p.suffix.lower()
            if ext in {'.js', '.css'}:
                category = "code"
            elif ext in {'.mp3', '.ogg', '.wav'}:
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

    # Thêm các file ở root (không nằm trong assets)
    for root_file in ['index.html', 'install.html', 'service-worker.js', 'opfs-worker.js', 'manifest.webmanifest']:
        p_root = root_dir / root_file
        if p_root.exists():
            web_path = root_file
            # Tránh trùng lặp nếu rglob đã quét qua
            if not any(f['path'] == web_path for f in files_list):
                files_list.append({
                    "path": web_path,
                    "sha256": get_sha256(p_root),
                    "size": p_root.stat().st_size,
                    "category": "code" if web_path.endswith('.js') else "html",
                    "priority": 1
                })

    manifest = {
        "version": datetime.now(timezone.utc).strftime('%Y.%m.%d-%H%M'),
        "generated": datetime.now(timezone.utc).isoformat(),
        "count": len(files_list),
        "files": sorted(files_list, key=lambda x: (x['priority'], x['path']))
    }

    # Atomic Write
    try:
        with tempfile.NamedTemporaryFile('w', dir=root_dir, suffix='.tmp', delete=False, encoding='utf-8') as tmp:
            json.dump(manifest, tmp, ensure_ascii=False, indent=2)
            tmp_path = tmp.name

        Path(tmp_path).replace(output_file)
        print(f"✅ Đã tạo thành công manifest.json tại {output_file.name}")
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    generate_manifest()
