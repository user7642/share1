// opfs-worker.js - Trình quản lý kho dữ liệu OPFS chuyên nghiệp

self.onmessage = async (e) => {
    const { action, path, isSync, forceUpdate, manifestList } = e.data;

    // KẾT NỐI HỆ THỐNG LƯU TRỮ
    if (!navigator.storage || !navigator.storage.getDirectory) {
        self.postMessage({ action: 'error', message: "OPFS không hỗ trợ trình duyệt này." });
        return;
    }
    const root = await navigator.storage.getDirectory();

    // HÀNH ĐỘNG 1: ĐỌC VÀ CẬP NHẬT FILE (Ghi đè nếu forceUpdate = true)
    if (action === 'readFile') {
        try {
            const parts = path.split('/');
            let currentDir = root;
            
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

            // QUYẾT ĐỊNH: Tải mới nếu chưa có HOẶC bị ép buộc cập nhật (forceUpdate)
            if (!exists || forceUpdate) {
                if (!isSync) console.warn(`🔄 ${forceUpdate ? 'Ghi đè' : 'Tải mới'}: ${path}`);
                
                const response = await fetch(path);
                if (!response.ok) throw new Error(`Lỗi tải: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();

                const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
                const accessHandle = await newFileHandle.createSyncAccessHandle();
                
                accessHandle.truncate(0); // Xóa sạch nội dung cũ trước khi ghi đè
                accessHandle.write(new Uint8Array(arrayBuffer));
                accessHandle.flush();
                accessHandle.close();

                self.postMessage({ action: 'audioBuffer', buffer: arrayBuffer, path, isSync }, [arrayBuffer]);
            } else {
                // Nếu file đã có và không yêu cầu update, lấy từ kho
                const file = await fileHandle.getFile();
                const arrayBuffer = await file.arrayBuffer();
                self.postMessage({ action: 'audioBuffer', buffer: arrayBuffer, path, isSync }, [arrayBuffer]);
            }
        } catch (error) {
            self.postMessage({ action: 'error', message: error.message, path, isSync });
        }
    }

    // HÀNH ĐỘNG 2: DỌN RÁC (CLEANUP) - Xóa file thừa không có trong Manifest
    if (action === 'cleanup') {
        console.log("🧹 SW: Bắt đầu quy trình dọn dẹp hệ thống...");
        try {
            const filesDeleted = await cleanupFolder(root, "", manifestList);
            console.log(`✨ SW: Đã dọn dẹp xong. Xóa ${filesDeleted} tệp thừa.`);
        } catch (error) {
            console.error("❌ Lỗi dọn dẹp:", error);
        }
    }
};

/**
 * Hàm quét và dọn dẹp đệ quy (Recursive Cleanup)
 * @param {FileSystemDirectoryHandle} dirHandle - Thư mục hiện tại
 * @param {string} relativePath - Đường dẫn tương đối
 * @param {Array} manifestList - Danh sách file chuẩn từ manifest.json
 */
async function cleanupFolder(dirHandle, relativePath, manifestList) {
    let count = 0;
    for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = relativePath ? `${relativePath}/${name}` : name;

        if (handle.kind === 'directory') {
            // Nếu là thư mục, tiếp tục quét sâu vào trong
            count += await cleanupFolder(handle, fullPath, manifestList);
            
            // Nếu thư mục rỗng sau khi dọn file, có thể xóa luôn thư mục (tùy chọn)
            // if ((await handle.keys().next()).done) await dirHandle.removeEntry(name);
        } else {
            // Nếu là file, kiểm tra xem nó có trong manifest không
            // Lưu ý: So sánh fullPath với danh sách đường dẫn trong manifest của bạn
            const isInManifest = manifestList.some(p => p.endsWith(fullPath));
            
            if (!isInManifest) {
                console.log(`🗑️ Xóa rác: ${fullPath}`);
                await dirHandle.removeEntry(name);
                count++;
            }
        }
    }
    return count;
}
