import os
import json

def generate_data_js():
    base_path = 'assets/media/image'
    app_data = {}
    
    if not os.path.exists(base_path):
        return

    categories = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
    
    for cat in categories:
        items = []
        cat_path = os.path.join(base_path, cat)
        
        for file in os.listdir(cat_path):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp')):
                full_name, ext = os.path.splitext(file)
                
                # Xử lý tách số thứ tự (ví dụ: "01.Việt Nam" -> prefix="01", display="Việt Nam")
                if '.' in full_name:
                    parts = full_name.split('.', 1)
                    prefix = parts[0]
                    display_name = parts[1]
                else:
                    prefix = "999" # Nếu không có số thì cho xuống cuối
                    display_name = full_name
                
                items.append({
                    "id": display_name.lower().replace(" ", "-"), # Dùng làm ID âm thanh
                    "file_full": full_name,       # Tên file gốc để load ảnh
                    "display_name": display_name, # Tên sạch để hiện lên web
                    "order": prefix,              # Dùng để sắp xếp
                    "ext": ext.replace(".", "")
                })
        
        # Sắp xếp theo số thứ tự NN
        app_data[cat] = sorted(items, key=lambda x: x['order'])

    with open('data.js', 'w', encoding='utf-8') as f:
        f.write("export const appData = ")
        json.dump(app_data, f, indent=4, ensure_ascii=False)
        f.write(";")
    
    print("✅ Đã cập nhật data.js (Đã xử lý số thứ tự và tên hiển thị)")

if __name__ == "__main__":
    generate_data_js()
