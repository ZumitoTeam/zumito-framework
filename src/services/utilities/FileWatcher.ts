import * as chokidar from 'chokidar';
import path from 'path';
import boxen from 'boxen';

export type FileWatcherCallbacks = {
    onAdd?: (filePath: string) => void | Promise<void>;
    onChange?: (filePath: string) => void | Promise<void>;
    onUnlink?: (filePath: string) => void | Promise<void>;
    onError?: (error: Error) => void;
};

export class FileWatcher {
    watch(folderPath: string, callbacks: FileWatcherCallbacks, label = 'file') {
        const watcher = chokidar
            .watch(path.resolve(folderPath), {
                ignored: /^\./,
                persistent: true,
                ignoreInitial: true,
            })
            .on('add', (filePath: string) => {
                callbacks.onAdd?.(filePath);
            })
            .on('change', (filePath: string) => {
                callbacks.onChange?.(filePath);
            })
            .on('unlink', (filePath: string) => {
                callbacks.onUnlink?.(filePath);
            })
            .on('error', (error: Error) => {
                if (callbacks.onError) {
                    callbacks.onError(error);
                } else {
                    console.error(`[🔄🔴 ] Error watching ${label}`);
                    console.log(boxen(error + '\n' + error.stack, { padding: 1 }));
                }
            });

        return watcher;
    }
}
