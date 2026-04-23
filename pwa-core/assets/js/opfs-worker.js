// opfs-worker.js - Trình quản lý kho dữ liệu OPFS chuyên nghiệp (Updated)

self.onmessage = async (e) => {
    const { action, path, isSync, forceUpdate, manifestList } = e.data;

    if (!navigator.storage || !navigator.storage.getDirectory) {
        self.postMessage({ action: 'error', message: "OPFS không hỗ trợ trình duyệt này." });
        return;
    }
    const root = await navigator.storage.getDirectory();

    if (action === 'readFile') {
        try {
            // 1. BỘ LỌC CHẶN APP SHELL: Chỉ cho phép Media (âm thanh, hình ảnh)
            // Không đưa các file hệ thống vào OPFS để tránh xung đột và lỗi 404
            const isAppShell = /\.(html|css|js|json|webmanifest)$/i.test(path);
            if (isAppShell) return; 

            // 2. CHUẨN HÓA ĐƯỜNG DẪN FETCH (Sửa lỗi 404)
            // Ép đường dẫn về tuyệt đối dựa trên vị trí gốc của website
            const fetchUrl = new URL(path, self.location.origin).href;

            // Chuẩn hóa đường dẫn lưu trữ trong OPFS: xóa dấu / ở đầu nếu có
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const parts = cleanPath.split('/');
            let currentDir = root;
            
            // Duyệt tạo thư mục
            for (let i = 0; i < parts.length - 1; i++) {
                if (parts[i] === '.' || parts[i] === '') continue;
                currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
            }

            const fileName = parts[parts.length - 1];
            let fileHandle;
            let exists = false;

            try {
                fileHandle = await currentDir.getFileHandle(fileName);
                exists = true;
            } catch (err) { exists = false; }

            if (!exists || forceUpdate) {
                if (!isSync) console.warn(`🔄 ${forceUpdate ? 'Ghi đè' : 'Tải mới'}: ${cleanPath}`);
                
                // Fetch bằng URL đã được chuẩn hóa tuyệt đối
                const response = await fetch(fetchUrl); 
                if (!response.ok) throw new Error(`Lỗi tải: ${response.statusText} (${fetchUrl})`);
                
                const arrayBuffer = await response.arrayBuffer();

                const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
                const accessHandle = await newFileHandle.createSyncAccessHandle();
                
                try {
                    accessHandle.truncate(0); 
                    accessHandle.write(new Uint8Array(arrayBuffer));
                    accessHandle.flush();
                } finally {
                    accessHandle.close(); 
                }

                self.postMessage({ action: 'audioBuffer', buffer: arrayBuffer, path, isSync }, [arrayBuffer]);
            } else {
                const file = await fileHandle.getFile();
                const arrayBuffer = await file.arrayBuffer();
                self.postMessage({ action: 'audioBuffer', buffer: arrayBuffer, path, isSync }, [arrayBuffer]);
            }
        } catch (error) {
            self.postMessage({ action: 'error', message: error.message, path, isSync });
        }
    }

    if (action === 'cleanup') {
        try {
            const manifestSet = new Set(manifestList);
            const filesDeleted = await cleanupFolder(root, "", manifestSet);
            if (filesDeleted > 0) console.log(`✨ OPFS Cleanup: Đã xóa ${filesDeleted} tệp thừa.`);
        } catch (error) {
            console.error("❌ Lỗi dọn dẹp OPFS:", error);
        }
    }
};

async function cleanupFolder(dirHandle, relativePath, manifestSet) {
    let count = 0;
    for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = relativePath ? `${relativePath}/${name}` : name;
        const webPath = "/" + fullPath;

        if (handle.kind === 'directory') {
            count += await cleanupFolder(handle, fullPath, manifestSet);
            const iter = await handle.keys();
            const { done } = await iter.next();
            if (done) await dirHandle.removeEntry(name, { recursive: true });
        } else {
            // Kiểm tra file có trong manifest không (kiểm tra cả path có / và không /)
            if (!manifestSet.has(fullPath) && !manifestSet.has(webPath)) {
                await dirHandle.removeEntry(name);
                count++;
            }
        }
    }
    return count;
}
