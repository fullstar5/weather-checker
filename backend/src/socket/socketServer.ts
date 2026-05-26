import type { Server } from 'socket.io';


let ioInstance: Server | null = null;

export const setSocketServer = (io: Server): void => {
    ioInstance = io;
};

export const getSocketServer = (): Server => {
    if (!ioInstance) {
        throw new Error('Socket server not initialized');
    }

    return ioInstance;
};