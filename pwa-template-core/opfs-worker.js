// opfs-worker.js

// Lắng nghe yêu cầu từ Main Thread
self.onmessage = async (e) => {
    const { action, path } = e.data;

    if (action === 'readFile') {
        try {
            // 1. Mở kết nối với hệ thống lưu trữ OPFS 
            const root = await navigator.storage.getDirectory();
            
            // 2. Xử lý đường dẫn để truy cập vào các thư mục con (asia/vi/...)
            const parts = path.split('/');
            let currentDir = root;
            
            // Duy chuyển qua từng thư mục, nếu chưa có thì tạo mới
            for (let i = 0; i < parts.length - 1; i++) {
                currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
            }

            const fileName = parts[parts.length - 1];
            let fileHandle;
            let exists = false;

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
                console.log(`✅ Lấy từ OPFS: ${path}`);
            } else {
                // TRƯỜNG HỢP 2: File chưa có, tiến hành tải từ Network [cite: 127]
                console.warn(`⏳ OPFS chưa có, đang tải từ Network: ${path}`);
                const response = await fetch(path);
                
                if (!response.ok) throw new Error(`Không thể tải file: ${response.statusText}`);
                
                arrayBuffer = await response.arrayBuffer();

                // Lưu vào OPFS bằng SyncAccessHandle (Tối ưu cho Worker) [cite: 21]
                const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
                const accessHandle = await newFileHandle.createSyncAccessHandle();
                accessHandle.write(new Uint8Array(arrayBuffer));
                accessHandle.flush();
                accessHandle.close();
                
                console.log(`💾 Đã lưu thành công vào OPFS: ${path}`);
            }

            // Gửi dữ liệu về Main Thread để phát nhạc [cite: 24]
            self.postMessage({
                action: 'audioBuffer',
                buffer: arrayBuffer,
                path: path
            }, [arrayBuffer]); // Sử dụng Transferable Objects để tối ưu hiệu năng

        } catch (error) {
            console.error(`❌ Lỗi Worker khi xử lý ${path}:`, error);
            self.postMessage({ action: 'error', message: error.message });
        }
    }
};
