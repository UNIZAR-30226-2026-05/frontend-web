let gameSocket: WebSocket | null = null;
let lobbyPlayers: unknown[] | null = null;

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

export function setLobbyPlayers(players: unknown[]): void {
    lobbyPlayers = players;

    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('lobbyPlayers', JSON.stringify(players));
    }
}

export function getLobbyPlayers(): unknown[] {
    if (lobbyPlayers) {
        return lobbyPlayers;
    }

    if (typeof window === 'undefined') {
        return [];
    }

    const storedPlayers = window.sessionStorage.getItem('lobbyPlayers');

    if (!storedPlayers) {
        return [];
    }

    try {
        const parsedPlayers = JSON.parse(storedPlayers) as unknown;
        if (Array.isArray(parsedPlayers)) {
            lobbyPlayers = parsedPlayers;
            return parsedPlayers;
        }
    } catch {
        window.sessionStorage.removeItem('lobbyPlayers');
    }

    return [];
}

export function clearLobbyPlayers(): void {
    lobbyPlayers = null;

    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('lobbyPlayers');
    }
}
