// opfs-worker.js — CLEAN + FIX PATH (giữ nguyên logic)

self.onmessage = async (e) => {
    const { action, path, isSync, forceUpdate, manifestList } = e.data;

    if (!navigator.storage || !navigator.storage.getDirectory) {
        self.postMessage({ action: 'error', message: "OPFS không hỗ trợ trình duyệt này." });
        return;
    }

    const root = await navigator.storage.getDirectory();

    if (action === 'readFile') {
        try {
            // 1. CHẶN APP SHELL
            const isAppShell = /\.(html|css|js|json|webmanifest)$/i.test(path);
            if (isAppShell) return;

            // 2. NORMALIZE PATH (QUAN TRỌNG)
            let cleanPath = path.replace(/^\.\//, '');   // bỏ "./"
            cleanPath = cleanPath.replace(/^\/+/, '');   // bỏ "/"

            // 3. BUILD URL FETCH (ổn định hơn)
            const fetchUrl = new URL(cleanPath, self.location.origin).href;

            // 4. TẠO PATH TRONG OPFS
            const parts = cleanPath.split('/');
            let currentDir = root;

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

            // 5. FETCH + SAVE
            if (!exists || forceUpdate) {
                if (!isSync) console.warn(`🔄 Fetch: ${fetchUrl}`);

                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`Fetch fail ${response.status}: ${fetchUrl}`);

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
            const normalized = manifestList.map(p => p.replace(/^\.\//, '').replace(/^\/+/, ''));
            const manifestSet = new Set(normalized);

            const filesDeleted = await cleanupFolder(root, "", manifestSet);

            if (filesDeleted > 0) {
                console.log(`✨ OPFS Cleanup: Đã xóa ${filesDeleted} file.`);
            }

        } catch (error) {
            console.error("❌ Cleanup error:", error);
        }
    }
};

// CLEANUP
async function cleanupFolder(dirHandle, relativePath, manifestSet) {
    let count = 0;

    for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = relativePath ? `${relativePath}/${name}` : name;

        if (handle.kind === 'directory') {
            count += await cleanupFolder(handle, fullPath, manifestSet);

            const iter = await handle.keys();
            const { done } = await iter.next();

            if (done) {
                await dirHandle.removeEntry(name, { recursive: true });
            }

        } else {
            if (!manifestSet.has(fullPath)) {
                await dirHandle.removeEntry(name);
                count++;
            }
        }
    }

    return count;
}
