// opfs-worker.js - Trình quản lý kho dữ liệu OPFS

// Lắng nghe yêu cầu từ Main Thread
self.onmessage = async (e) => {
    // Trích xuất action, path và cờ isSync từ dữ liệu gửi đến
    const { action, path, isSync } = e.data;

    if (action === 'readFile') {
        try {
            // Kiểm tra hỗ trợ Storage
            if (!navigator.storage || !navigator.storage.getDirectory) {
                throw new Error("OPFS không được hỗ trợ trong môi trường này.");
            }

            // 1. Mở kết nối với hệ thống lưu trữ OPFS 
            const root = await navigator.storage.getDirectory();
            
            // 2. Xử lý đường dẫn để truy cập vào các thư mục con (ví dụ: assets/media/flags/...)
            const parts = path.split('/');
            let currentDir = root;
            
            // Di chuyển qua từng thư mục, nếu chưa có thì tạo mới
            for (let i = 0; i < parts.length - 1; i++) {
                if (parts[i] === '.' || parts[i] === '') continue;
                currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
            }

            const fileName = parts[parts.length - 1];
            let fileHandle;
            let exists = false;

            // Kiểm tra file đã tồn tại trong kho chưa
            try {
                fileHandle = await currentDir.getFileHandle(fileName);
                exists = true;
            } catch (err) {
                exists = false;
            }

            let arrayBuffer;

            if (exists) {
                // TRƯỜNG HỢP 1: File đã có trong OPFS
                const file = await fileHandle.getFile();
                arrayBuffer = await file.arrayBuffer();
                // Chỉ log khi không phải là đang sync hàng loạt để tránh rác console
                if (!isSync) console.log(`✅ Lấy từ OPFS: ${path}`);
            } else {
                // TRƯỜNG HỢP 2: File chưa có, tiến hành tải từ Network
                if (!isSync) console.warn(`⏳ OPFS chưa có, đang tải từ Network: ${path}`);
                
                const response = await fetch(path);
                if (!response.ok) throw new Error(`Không thể tải file: ${response.statusText}`);
                
                arrayBuffer = await response.arrayBuffer();

                // Lưu vào OPFS bằng SyncAccessHandle (Tối ưu nhất cho Worker)
                const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
                const accessHandle = await newFileHandle.createSyncAccessHandle();
                
                // Ghi dữ liệu vào ổ cứng ảo
                accessHandle.write(new Uint8Array(arrayBuffer));
                accessHandle.flush();
                accessHandle.close();
                
                if (!isSync) console.log(`💾 Đã lưu thành công vào OPFS: ${path}`);
            }

            // 3. Gửi dữ liệu về Main Thread
            self.postMessage({
                action: 'audioBuffer',
                buffer: arrayBuffer,
                path: path,
                isSync: isSync // QUAN TRỌNG: Gửi lại cờ này để main.js cập nhật thanh tiến trình
            }, [arrayBuffer]); // Sử dụng Transferable Objects để giải phóng bộ nhớ Worker ngay lập tức

        } catch (error) {
            console.error(`❌ Lỗi Worker khi xử lý ${path}:`, error);
            self.postMessage({ 
                action: 'error', 
                message: error.message,
                path: path,
                isSync: isSync 
            });
        }
    }
};
