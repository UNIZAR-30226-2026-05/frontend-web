let gameSocket: WebSocket | null = null;

export function getGameSocket(): WebSocket | null {
    return gameSocket;
}

export function setGameSocket(socket: WebSocket | null): void {
    gameSocket = socket;
}

export function replaceGameSocket(socket: WebSocket): WebSocket {
    if (gameSocket && gameSocket !== socket) {
        gameSocket.close();
    }

    gameSocket = socket;
    return gameSocket;
}

export function closeGameSocket(): void {
    if (gameSocket) {
        gameSocket.close();
        gameSocket = null;
    }
}
