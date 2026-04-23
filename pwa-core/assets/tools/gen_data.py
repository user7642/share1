import os
import json
from pathlib import Path

def generate_data_js():
    # Đường dẫn tính từ gốc dự án (vì script nằm trong assets/tools)
    root_dir = Path(__file__).parent.parent.parent
    base_path = root_dir / 'assets/media/image'
    output_file = root_dir / 'assets/js/data.js'
    
    if not base_path.exists():
        print(f"❌ Thư mục không tồn tại: {base_path}")
        return

    app_data = {}

    # Lấy danh sách các thư mục châu lục (asia, europe...)
    categories = [d for d in base_path.iterdir() if d.is_dir()]
    
    for cat_dir in categories:
        cat_key = cat_dir.name  # Ví dụ: "asia"
        items = []
        
        # Quét các file ảnh trong thư mục châu lục
        # Sắp xếp theo tên file để giữ thứ tự cố định
        for file_path in sorted(cat_dir.glob('*')):
            if file_path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.svg', '.webp'}:
                file_id = file_path.stem  # Tên file không đuôi (vietnam)
                extension = file_path.suffix.lower().replace('.', '')
                
                # Tạo Object cho từng quốc gia
                item = {
                    "id": file_id,
                    "display": file_id.replace('-', ' ').title() # Tự động tạo tên hiển thị đẹp
                }
                
                # Nếu không phải svg thì mới thêm trường ext (như logic main.js đã viết)
                if extension != 'svg':
                    item["ext"] = extension
                
                items.append(item)
        
        app_data[cat_key] = items
        print(f"📦 Đã xử lý {cat_key}: {len(items)} file.")

    # Ghi dữ liệu ra file data.js
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("// Dữ liệu được tạo tự động bởi gen_data.py\n")
            f.write("export const appData = ")
            # indent=2 để AI dễ đọc và bạn dễ kiểm tra
            json.dump(app_data, f, indent=2, ensure_ascii=False)
            f.write(";")
        
        print(f"\n✅ THÀNH CÔNG: Đã cập nhật {output_file}")
    except Exception as e:
        print(f"❌ Lỗi khi ghi file: {e}")

if __name__ == "__main__":
    generate_data_js()
