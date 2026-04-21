import os
import json
import hashlib
import tempfile
from pathlib import Path
from datetime import datetime, timezone

# Cấu hình các định dạng file cần đưa vào manifest
MEDIA_EXTENSIONS = {'.mp3', '.ogg', '.wav', '.jpg', '.jpeg', '.png', '.webp', '.svg'}

def get_sha256(file_path):
    """Tính mã băm SHA-256 để kiểm tra tính toàn vẹn của file[cite: 55, 193]."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Đọc theo từng block 64KB để không tốn RAM
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_priority(path):
    """Gán độ ưu tiên: audio (1) ưu tiên tải trước ảnh (2)[cite: 67, 201]."""
    if path.suffix.lower() == '.mp3':
        return 1
    return 2

def generate_manifest():
    # Thư mục gốc chứa các assets (phải khớp với đường dẫn trong HTML)
    base_dir = Path('assets/media')
    output_file = 'manifest.json'
    
    if not base_dir.exists():
        print(f"❌ Lỗi: Không tìm thấy thư mục {base_dir}")
        return

    files_list = []
    
    print(f"🔍 Đang quét tài nguyên trong {base_dir}...")

    # Quét toàn bộ thư mục con (asia, europe, ...)
    for p in base_dir.rglob('*'):
        if p.is_file() and p.suffix.lower() in MEDIA_EXTENSIONS:
            # Chuyển đường dẫn thành định dạng web (dùng dấu /)
            web_path = str(p).replace(os.sep, '/')
            
            files_list.append({
                "path": web_path,
                "sha256": get_sha256(p),
                "size": p.stat().st_size, # Kích thước tính bằng bytes [cite: 65, 211]
                "category": "audio" if p.suffix.lower() == '.mp3' else "image",
                "priority": get_priority(p)
            })

    manifest = {
        "version": datetime.now(timezone.utc).strftime('%Y.%m.%d-%H%M'),
        "generated": datetime.now(timezone.utc).isoformat(),
        "count": len(files_list),
        "files": files_list
    }

    # Cơ chế ATOMIC WRITE: Ghi vào file tạm rồi mới đổi tên để tránh hỏng file [cite: 183, 221]
    out_path = Path(output_file)
    with tempfile.NamedTemporaryFile('w', dir=out_path.parent, suffix='.tmp', delete=False, encoding='utf-8') as tmp:
        json.dump(manifest, tmp, ensure_ascii=False, indent=2)
        tmp_path = tmp.name

    Path(tmp_path).replace(out_path)
    print(f"✅ Đã tạo thành công manifest.json với {len(files_list)} tệp tin.")

if __name__ == "__main__":
    generate_manifest()
