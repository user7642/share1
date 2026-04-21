self.onmessage = async (e) => {
    if (e.data.action === 'readFile') {
        try {
            // Sử dụng Web Lock để tránh xung đột khi đọc/ghi đồng thời
            await navigator.locks.request('opfs_lock', async () => {
                const root = await navigator.storage.getDirectory();
                
                // Tách path để truy cập sâu vào folder (audio/asia/vi/...)
                const parts = e.data.path.split('/');
                let currentDir = root;
                
                // Di chuyển qua các folder
                for (let i = 0; i < parts.length - 1; i++) {
                    currentDir = await currentDir.getDirectoryHandle(parts[i]);
                }
                
                // Lấy file handle cuối cùng
                const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
                
                // Dùng SyncAccessHandle (chỉ có trong Worker) để đạt tốc độ tối đa
                const accessHandle = await fileHandle.createSyncAccessHandle();
                const fileSize = accessHandle.getSize();
                const buffer = new ArrayBuffer(fileSize);
                accessHandle.read(buffer, { at: 0 });
                accessHandle.close();

                self.postMessage({
                    action: 'audioBuffer',
                    buffer: buffer
                }, [buffer]); 
            });
        } catch (err) {
            console.warn("OPFS chưa có file, thử tải từ Network:", e.data.path);
            // Fallback: Nếu OPFS chưa có, fetch từ mạng
            fetch(e.data.path)
                .then(r => r.arrayBuffer())
                .then(buf => self.postMessage({ action: 'audioBuffer', buffer: buf }, [buf]))
                .catch(err => console.error("Lỗi tải âm thanh:", err));
        }
    }
};
