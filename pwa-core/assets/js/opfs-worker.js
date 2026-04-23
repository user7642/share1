
// opfs-worker.js — FIXED PATH VERSION

self.onmessage = async (e) => {
    const { action, path, isSync, forceUpdate, manifestList } = e.data;

    if (!navigator.storage || !navigator.storage.getDirectory) {
        self.postMessage({ action: 'error', message: "OPFS không hỗ trợ trình duyệt này." });
        return;
    }

    const root = await navigator.storage.getDirectory();

    if (action === 'readFile') {
        try {
            // 1. CHẶN CÁC FILE HỆ THỐNG (APP SHELL)
            const isAppShell = /\.(html|css|js|json|webmanifest)$/i.test(path);
            if (isAppShell) return;

            // 2. CHUẨN HÓA ĐƯỜNG DẪN (Nên dùng path tương đối từ root app)
            let cleanPath = path.replace(/^\.\//, '');   // bỏ "./" ở đầu
            cleanPath = cleanPath.replace(/^\/+/, '');   // bỏ "/" ở đầu

            // 3. XÁC ĐỊNH APP ROOT TỰ ĐỘNG (FIX LỖI 404)
            // Lấy URL của worker và cắt bỏ phần folder để tìm ra thư mục gốc dự án
            const appRoot = self.location.href.split('/assets/')[0] + '/';
            const fetchUrl = new URL(cleanPath, appRoot).href;

            // 4. XỬ LÝ CẤU TRÚC THƯ MỤC TRONG OPFS
            const parts = cleanPath.split('/');
            let currentDir = root;

            // Tạo các thư mục con nếu chưa có
            for (let i = 0; i < parts.length - 1; i++) {
                if (!parts[i]) continue;
                currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
            }

            const fileName = parts[parts.length - 1];
            let fileHandle;
            let exists = false;

            try {
                fileHandle = await currentDir.getFileHandle(fileName);
                exists = true;
            } catch {
                exists = false;
            }

            // 5. FETCH VÀ LƯU VÀO OPFS
            if (!exists || forceUpdate) {
                if (!isSync) console.warn(`🔄 Fetching: ${fetchUrl}`);

                const response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`Fetch fail ${response.status}: ${fetchUrl}`);
                }

                const arrayBuffer = await response.arrayBuffer();

                // Ghi dữ liệu vào OPFS sử dụng SyncAccessHandle để có hiệu năng tốt nhất
                const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
                const accessHandle = await newFileHandle.createSyncAccessHandle();

                try {
                    accessHandle.truncate(0); // Xóa dữ liệu cũ nếu có
                    accessHandle.write(new Uint8Array(arrayBuffer));
                    accessHandle.flush();
                } finally {
                    accessHandle.close();
                }

                self.postMessage({ action: 'audioBuffer', buffer: arrayBuffer, path, isSync }, [arrayBuffer]);

            } else {
                // Nếu file đã tồn tại, đọc từ OPFS thay vì fetch lại
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
            // Chuẩn hóa danh sách manifest để so sánh chính xác
            const normalized = manifestList.map(p => p.replace(/^\.\//, '').replace(/^\/+/, ''));
            const manifestSet = new Set(normalized);

            const filesDeleted = await cleanupFolder(root, "", manifestSet);

            if (filesDeleted > 0) {
                console.log(`✨ OPFS Cleanup: Đã dọn dẹp ${filesDeleted} file cũ.`);
            }

        } catch (error) {
            console.error("❌ Cleanup error:", error);
        }
    }
};

/**
 * Hàm đệ quy dọn dẹp các file không có trong manifest
 */
async function cleanupFolder(dirHandle, relativePath, manifestSet) {
    let count = 0;

    for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = relativePath ? `${relativePath}/${name}` : name;

        if (handle.kind === 'directory') {
            // Đệ quy vào thư mục con
            count += await cleanupFolder(handle, fullPath, manifestSet);

            // Nếu thư mục trống sau khi dọn dẹp, xóa luôn thư mục đó
            const iter = await handle.keys();
            const { done } = await iter.next();
            if (done) {
                await dirHandle.removeEntry(name, { recursive: true });
            }

        } else {
            // Nếu file không có trong danh sách cần giữ, thực hiện xóa
            if (!manifestSet.has(fullPath)) {
                await dirHandle.removeEntry(name);
                count++;
            }
        }
    }

    return count;
}
