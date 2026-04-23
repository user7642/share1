import os
import json
from pathlib import Path

def generate_data_js():
    # 1. Xác định đường dẫn dựa trên cấu trúc cây thư mục đã thống nhất
    root_dir = Path(__file__).parent.parent.parent
    base_path = root_dir / 'assets/media/image'
    output_file = root_dir / 'assets/js/data.js'
    
    if not base_path.exists():
        print(f"❌ Thư mục không tồn tại: {base_path}")
        return

    app_data = {}

    # 2. Lấy danh sách các châu lục và sắp xếp A-Z để file luôn nhất quán
    categories = sorted([d for d in base_path.iterdir() if d.is_dir()])
    
    for cat_dir in categories:
        cat_key = cat_dir.name  # Ví dụ: "asia"
        items = []
        
        # 3. Quét các file ảnh, sắp xếp theo tên file (A-Z)
        # Sử dụng glob('*') để lấy mọi định dạng ảnh
        valid_extensions = {'.png', '.jpg', '.jpeg', '.svg', '.webp'}
        files = sorted([f for f in cat_dir.glob('*') if f.suffix.lower() in valid_extensions])
        
        for file_path in files:
            file_id = file_path.stem  # vietnam
            extension = file_path.suffix.lower().replace('.', '')
            
            # Tạo Object cho từng quốc gia
            # .title() sẽ biến "south-korea" thành "South Korea"
            display_name = file_id.replace('-', ' ').title()
            
            item = {
                "id": file_id,
                "display": display_name
            }
            
            # Theo logic main.js: Nếu không phải svg thì mới thêm trường ext
            if extension != 'svg':
                item["ext"] = extension
            
            items.append(item)
        
        app_data[cat_key] = items
        print(f"📦 Category [{cat_key}]: {len(items)} files processed.")

    # 4. Ghi dữ liệu ra file data.js theo chuẩn ES Module
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("// --------------------------------------------------\n")
            f.write("// DỮ LIỆU ĐƯỢC TẠO TỰ ĐỘNG BỞI GEN_DATA.PY\n")
            f.write("// KHÔNG CHỈNH SỬA FILE NÀY THỦ CÔNG\n")
            f.write("// --------------------------------------------------\n\n")
            f.write("export const appData = ")
            
            # ensure_ascii=False để giữ nguyên tiếng Việt nếu sau này bạn đổi tên file có dấu
            json.dump(app_data, f, indent=2, ensure_ascii=False)
            f.write(";\n")
        
        print(f"\n✨ THÀNH CÔNG: Đã cập nhật {output_file}")
    except Exception as e:
        print(f"❌ Lỗi nghiêm trọng khi ghi file: {e}")

if __name__ == "__main__":
    generate_data_js()
