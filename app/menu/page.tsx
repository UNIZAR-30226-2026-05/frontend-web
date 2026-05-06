"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PixelButton from '@/components/UI/PixelButton';
import RulesModal from '@/components/UI/RulesModal';
import ChangePasswordForm from '@/components/Forms/ChangePasswordForm';
import UserSearchModal from '@/components/Modals/UserSearchModal';

import { CrearPartidaService, UnirsePartidaService } from '@/lib/backend';
import { replaceGameSocket, setLobbyPlayers } from '@/lib/gameSocket';

export default function MenuPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [idPartida, SetIdPartida] = useState(0);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
    const [playersConnected, setPlayersConnected] = useState<number | null>(null);
    const [jugadoresEnLobby, setJugadoresEnLobby] = useState<string[]>([]);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

    const [invitations, setInvitations] = useState<{inviter: string, code: number}[]>([]);
    const [friendRequests, setFriendRequests] = useState<string[]>([]);
    const [friends, setFriends] = useState<{username: string, status: string}[]>([]);

    const usernameRef = useRef<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const sessionSocketRef = useRef<WebSocket | null>(null);
    const detachSocketListenersRef = useRef<(() => void) | null>(null);
    const routerRef = useRef(router);
    useEffect(() => { routerRef.current = router; }, [router]);
    const hasInitialized = useRef(false);

    const extractUsernames = useCallback((players: unknown[]): string[] => {
        return players
            .map((player) => {
                if (typeof player === 'string') return player;
                if (typeof player === 'object' && player !== null) {
                    const p = player as Record<string, unknown>;
                    const name = p.username || p.user || p.name;
                    if (typeof name === 'string') return name;
                }
                return null;
            })
            .filter((name): name is string => !!name);
    }, []);

    const updateJugadoresEnLobby = useCallback(
        (players: unknown[]) => {
            const usernames = extractUsernames(players);
            const myName = usernameRef.current?.trim().toLowerCase();

            const otrosJugadores = usernames.filter((u) => {
                const normalized = u.trim().toLowerCase();
                return normalized !== myName;
            });

            setJugadoresEnLobby(otrosJugadores);
        },
        [extractUsernames]
    );

    const bindSocketListeners = useCallback((ws: WebSocket, roomId: number) => {
        const onOpen = () => {
            console.log('WebSocket conectado a sala:', roomId);
        };

        const onMessage = (event: MessageEvent) => {
            console.log("WS RAW MESSAGE:", event.data);
            if (typeof event.data !== 'string') {
                return;
            }

            try {
                const message = JSON.parse(event.data) as {
                    type?: string;
                    players_connected?: number | unknown[];
                    numJugadores?: number;
                    error?: string;
                };

                if (message.error) {
                    setJoinError(message.error);
                    console.error("WS Error recibido:", message.error);
                    return;
                }

                if (message.type === 'lobby_update') {
                    const playersList = (Array.isArray(message.players_connected) ? message.players_connected : null) || 
                                       (message as any).players || 
                                       (message as any).jugadores;

                    if (Array.isArray(playersList)) {
                        const usernames = extractUsernames(playersList);
                        setLobbyPlayers(usernames);
                        setPlayersConnected(usernames.length);
                        updateJugadoresEnLobby(usernames);
                    } else if (typeof message.players_connected === 'number') {
                        setPlayersConnected(message.players_connected);
                    }
                }

                if (message.type === 'game_start') {
                    const playersList = (Array.isArray(message.players_connected) ? message.players_connected : null) || 
                                       (message as any).players || 
                                       (message as any).jugadores;

                    if (Array.isArray(playersList)) {
                        const usernames = extractUsernames(playersList);
                        setLobbyPlayers(usernames);
                    }

                    console.log('La partida ha comenzado, redirigiendo a /game');
                    routerRef.current.push('/game');
                }
            } catch (error) {
                console.warn('No se pudo parsear el mensaje de WebSocket:', error);
            }
        };

        const onClose = (event: CloseEvent) => {
            console.log('WebSocket desconectado', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
            });
        };

        const onError = () => {
            console.warn('No se pudo establecer la conexión WebSocket');
        };

        ws.addEventListener('open', onOpen);
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
        ws.addEventListener('error', onError);

        return () => {
            ws.removeEventListener('open', onOpen);
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('close', onClose);
            ws.removeEventListener('error', onError);
        };
    }, [updateJugadoresEnLobby]);

    const connectToRoom = useCallback((roomId: number, token: string | null) => {
        // Solo evitar reconexión si ya hay socket abierto A LA MISMA SALA
        if (
            socketRef.current &&
            (socketRef.current.readyState === WebSocket.OPEN ||
                socketRef.current.readyState === WebSocket.CONNECTING) &&
            socketRef.current.url.includes(`/ws/partida/${roomId}`)
        ) {
            console.log('Socket ya activo para esta sala, omitiendo reconexión');
            return;
        }
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
        let wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

        if (backendUrl.startsWith('https://')) {
            wsProtocol = 'wss';
        } else if (backendUrl.startsWith('http://')) {
            wsProtocol = 'ws';
        }

        const normalizedHost = backendUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        const encodedToken = encodeURIComponent(token ?? '');
        const url = `${wsProtocol}://${normalizedHost}/ws/partida/${roomId}?token=${encodedToken}`;

        if (detachSocketListenersRef.current) {
            detachSocketListenersRef.current();
            detachSocketListenersRef.current = null;
        }

        const ws = new WebSocket(url);
        socketRef.current = replaceGameSocket(ws);
        detachSocketListenersRef.current = bindSocketListeners(socketRef.current, roomId);
    }, [bindSocketListeners]);

    const handleJoinPartida = async () => {
        setJoinError(null);
        setJoinSuccess(null);

        const parsedCode = Number(joinCode.trim());
        if (!Number.isInteger(parsedCode) || parsedCode <= 0) {
            setJoinError('Introduce un codigo de partida valido');
            return;
        }

        if (!authToken) {
            setJoinError('Sesion no valida. Vuelve a iniciar sesion.');
            return;
        }

        try {
            console.log('Intentando unir a partida:', parsedCode);
            const joinedRoomId = await UnirsePartidaService(parsedCode, authToken);
            console.log('Unido con éxito a ID:', joinedRoomId);
            SetIdPartida(joinedRoomId);
            
            // Limpiamos errores antes de conectar el socket
            setJoinError(null); 
            connectToRoom(joinedRoomId, authToken);
            setJoinSuccess(`Te has unido a la partida ${joinedRoomId}`);
        } catch (error) {
            console.error('Error al unirse:', error);
            const message = error instanceof Error ? error.message : 'No se pudo unir a la partida';
            setJoinError(message);
        }
    };

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            const currentUsername = window.sessionStorage.getItem('username');
            const resUser = await fetch('/api/me', { method: 'GET' });
            const dataUser = resUser.ok ? await resUser.json() : null;
            const token = dataUser?.token ?? null;
            usernameRef.current = currentUsername;
            setUsername(currentUsername);
            setAuthToken(token);

            if (currentUsername) {
                const backendHttpUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
                try {
                    const resFriends = await fetch(`${backendHttpUrl}/usuarios/${currentUsername}/amigos`, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    if (resFriends.ok) {
                        const data = await resFriends.json();
                        const friendsList = data.map((u: any) => u.nombre);
                        setFriends(friendsList.map((f: string) => ({ username: f, status: 'offline' })));
                    }
                } catch (e) {
                    console.error('Error fetching friends:', e);
                }
            }

            const id = await CrearPartidaService(token);
            if (!id) {
                console.error('Error al crear la partida: ID no recibido');
                return;
            }

            SetIdPartida(id);
            connectToRoom(id, token);

            // Connect to Session WebSocket
            if (currentUsername) {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
                let wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

                if (backendUrl.startsWith('https://')) {
                    wsProtocol = 'wss';
                } else if (backendUrl.startsWith('http://')) {
                    wsProtocol = 'ws';
                }

                const normalizedHost = backendUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
                const encodedToken = encodeURIComponent(token ?? '');
                const sessionUrl = `${wsProtocol}://${normalizedHost}/ws/usuario/${currentUsername}?token=${encodedToken}`;
                
                const sessionWs = new WebSocket(sessionUrl);
                sessionSocketRef.current = sessionWs;
                
                sessionWs.onopen = () => {
                    console.log('WebSocket de sesión conectado');
                    sessionWs.send(JSON.stringify({ action: 'get_online_friends' }));
                };
                
                sessionWs.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        switch (data.type) {
                            case 'friend_requests_list':
                                setFriendRequests(data.lista);
                                break;
                            case 'online_friends_list':
                                setFriends(prev => {
                                    const onlineSet = new Set(data.friends);
                                    const updated = prev.map(f => ({
                                        ...f,
                                        status: onlineSet.has(f.username) ? 'online' : f.status
                                    }));
                                    data.friends.forEach((f: string) => {
                                        if (!updated.find(u => u.username === f)) {
                                            updated.push({ username: f, status: 'online' });
                                        }
                                    });
                                    return updated;
                                });
                                break;
                            case 'friend_status_update':
                                setFriends(prev => {
                                    const exists = prev.find(f => f.username === data.friend_id);
                                    if (exists) {
                                        return prev.map(f => f.username === data.friend_id ? { ...f, status: data.status } : f);
                                    }
                                    return [...prev, { username: data.friend_id, status: data.status }];
                                });
                                break;
                            case 'receive_invite':
                                setInvitations(prev => [...prev, { inviter: data.from_user, code: data.game_id }]);
                                break;
                            case 'new_friend_request':
                                setFriendRequests(prev => [...prev, data.from_user]);
                                break;
                        }
                    } catch (e) {
                        console.error('Error parseando mensaje de sesión', e);
                    }
                };
                
                sessionWs.onclose = () => {
                    console.log('WebSocket de sesión desconectado');
                };
            }
        };

        init();

        return () => {
            if (detachSocketListenersRef.current) {
                detachSocketListenersRef.current();
                detachSocketListenersRef.current = null;
            }
        };
    }, [connectToRoom]);

    const handleInvite = (friendUsername: string) => {
        if (sessionSocketRef.current?.readyState === WebSocket.OPEN) {
            sessionSocketRef.current.send(JSON.stringify({ 
                action: 'invite_friend', 
                payload: { friend_id: friendUsername, game_id: idPartida } 
            }));
            if (!invitedFriends.includes(friendUsername)) {
                setInvitedFriends((prev) => [...prev, friendUsername]);
            }
        }
    };

    const getFriendStatus = (friendUsername: string) => {
        if (jugadoresEnLobby.includes(friendUsername)) return 'contigo';
        if (invitedFriends.includes(friendUsername)) return 'invitado';
        return 'invitar';
    };


    return (
        <div
            className="text-white min-h-screen grid grid-cols-3 gap-8 p-8 font-pixel font-normal text-2xl tracking-wide relative overflow-hidden"
            style={{
                backgroundImage: "url('/lobby.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >


            {/* Columna Izquierda: Usuario y Partidas */}
            <div className="flex flex-col gap-8 h-full z-10 relative">
                {/* Usuario Component */}
                <div className="flex items-center gap-4 p-4 mt-2">
                    {/* Zona interactiva del Logo (dibujado en el fondo) */}
                    <div
                        className="absolute top-4 left-4 w-[12rem] h-[10rem] cursor-pointer z-10"
                        onClick={() => window.location.href = '/'}
                        aria-label="Snow Party Logo"
                    />
                    <div className="flex items-center gap-6 ml-[14rem]">
                        <span
                            className="text-[3rem] tracking-widest font-bold text-white whitespace-nowrap"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            {username}
                        </span>
                    </div>
                </div>

                {/* Partidas de amigos (Invitaciones) */}
                <div className="flex-1 flex flex-col p-6 pl-4 relative mt-20 overflow-hidden">
                    <h2
                        className="text-[3.5rem] leading-snug mb-10 text-white font-bold whitespace-nowrap"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Partidas<br />de amigos
                    </h2>

                    <div className="flex flex-col gap-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
                        {invitations.map((inv) => (
                            <div key={inv.inviter} className="flex flex-col gap-3 w-fit">
                                <p
                                    className="text-[#a8a8a8] text-[1.3rem] font-bold mb-1"
                                    style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                >
                                    {inv.inviter} te ha invitado!
                                </p>
                                <div className="w-full h-[2px] bg-white mb-2 shadow-[0_2px_0_#000]"></div>
                                <div className="flex items-center gap-4">
                                    <p
                                        className="text-white text-[1.5rem] font-bold leading-tight"
                                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                    >
                                        Código: {inv.code}
                                    </p>
                                    <PixelButton
                                        variant="green"
                                        className="!px-4 !py-2 !text-[1rem]"
                                        onClick={() => setJoinCode(inv.code.toString())}
                                    >
                                        Unirse
                                    </PixelButton>
                                </div>
                            </div>
                        ))}

                        {friendRequests.length > 0 && (
                            <div className="mt-4">
                                <h3
                                    className="text-[2rem] leading-snug mb-4 text-white font-bold whitespace-nowrap"
                                    style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                >
                                    Solicitudes de amistad
                                </h3>
                                <div className="flex flex-col gap-6">
                                    {friendRequests.map((req) => (
                                        <div key={req} className="flex flex-col gap-3 w-fit">
                                            <p
                                                className="text-[#a8a8a8] text-[1.3rem] font-bold mb-1"
                                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                            >
                                                {req} quiere ser tu amigo
                                            </p>
                                            <div className="w-full h-[2px] bg-white mb-2 shadow-[0_2px_0_#000]"></div>
                                            <div className="flex items-center gap-4">
                                                <PixelButton
                                                    variant="green"
                                                    className="!px-4 !py-2 !text-[1rem]"
                                                    onClick={() => {
                                                        sessionSocketRef.current?.send(JSON.stringify({
                                                            action: 'accept_request',
                                                            payload: { player_id: req }
                                                        }));
                                                        setFriendRequests(prev => prev.filter(u => u !== req));
                                                        setFriends(prev => {
                                                            if (prev.find(f => f.username === req)) return prev;
                                                            return [...prev, { username: req, status: 'offline' }];
                                                        });
                                                    }}
                                                >
                                                    Aceptar
                                                </PixelButton>
                                                <PixelButton
                                                    variant="purple"
                                                    className="!px-4 !py-2 !text-[1rem]"
                                                    onClick={() => {
                                                        sessionSocketRef.current?.send(JSON.stringify({
                                                            action: 'reject_request',
                                                            payload: { player_id: req }
                                                        }));
                                                        setFriendRequests(prev => prev.filter(u => u !== req));
                                                    }}
                                                >
                                                    Rechazar
                                                </PixelButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Botón de Ajustes (abajo a la izquierda) */}
                <div className="mt-auto p-4 mb-2">
                    <button
                        onClick={() => setIsPasswordModalOpen((prev) => !prev)}
                        className="bg-[#3d2b5d] border-2 border-white p-2 hover:bg-[#4d3b6d] transition-all transform hover:scale-110 shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none"
                        title={isPasswordModalOpen ? "Volver al Menú" : "Ajustes"}
                        aria-label="Ajustes de usuario"
                    >
                        <span className="text-xl block">⚙️</span>
                    </button>
                </div>
            </div>

            {/* Columna Central: Crear y Unirse a Partida / Cambio de Contraseña */}
            <div className="flex flex-col items-center justify-center gap-[4rem] p-8 z-10 relative">

                {isPasswordModalOpen ? (
                    <ChangePasswordForm onClose={() => setIsPasswordModalOpen(false)} />
                ) : (
                    <>
                        {/* Partida temporal compacta */}
                        <div className="w-full max-w-[28rem] mt-2 mb-4">
                            <div className="flex justify-between items-center w-full mb-4 px-2">
                                <div className="flex flex-col">
                                    <span
                                        className="text-[1.3rem] leading-snug text-white font-bold"
                                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                    >
                                        Código de partida:
                                    </span>
                                    <span
                                        className="text-[2rem] text-white mt-1 inline-block font-bold"
                                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                    >
                                        {idPartida}
                                    </span>
                                </div>
                                <div className="flex justify-end">
                                    <PixelButton variant="purple" className="!px-6 !py-3 !text-[1.3rem] !tracking-wider">
                                        {username}
                                    </PixelButton>
                                </div>
                            </div>

                            <div className="flex justify-between w-full gap-5">
                                <PixelButton variant="purple" className={`flex-1 !px-2 !py-4 !text-[1.2rem] !tracking-wider${!jugadoresEnLobby[0] ? ' opacity-70' : ''}`}>{jugadoresEnLobby[0] ?? 'Vacío'}</PixelButton>
                                <PixelButton variant="purple" className={`flex-1 !px-2 !py-4 !text-[1.2rem] !tracking-wider${!jugadoresEnLobby[1] ? ' opacity-70' : ''}`}>{jugadoresEnLobby[1] ?? 'Vacío'}</PixelButton>
                                <PixelButton variant="purple" className={`flex-1 !px-2 !py-4 !text-[1.2rem] !tracking-wider${!jugadoresEnLobby[2] ? ' opacity-70' : ''}`}>{jugadoresEnLobby[2] ?? 'Vacío'}</PixelButton>
                            </div>
                        </div>

                        {/* Unirse a una partida */}
                        <div className="w-full flex flex-col items-center mt-2 gap-4">
                            <h2
                                className="text-[2.2rem] text-white font-bold text-center leading-snug mb-2"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Unirse a una<br />partida con código
                            </h2>
                            <div className="relative w-full max-w-[24rem]">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(event) => {
                                        setJoinCode(event.target.value);
                                        if (joinError) {
                                            setJoinError(null);
                                        }
                                    }}
                                    placeholder="123456"
                                    className="w-full text-center text-[2.5rem] font-bold font-pixel tracking-widest text-white py-4 outline-none transition-colors"
                                    style={{
                                        backgroundImage: "url('/rellenable.png')",
                                        backgroundSize: '100% 100%',
                                        backgroundRepeat: 'no-repeat',
                                        boxShadow: "inset 0 0 5px rgba(150, 100, 255, 0.5)",
                                        textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000"
                                    }}
                                />
                            </div>
                            <PixelButton
                                variant="green"
                                className="w-full max-w-[20rem] py-4 text-[1.5rem]"
                                onClick={handleJoinPartida}
                            >
                                Unirse
                            </PixelButton>
                            {joinError && (
                                <p className="text-[#ffb3b3] text-[1rem] text-center font-bold">{joinError}</p>
                            )}
                            {joinSuccess && (
                                <p className="text-[#b9ffb3] text-[1rem] text-center font-bold">{joinSuccess}</p>
                            )}
                            {playersConnected !== null && (
                                <p className="text-white text-[1rem] text-center font-bold">Jugadores conectados: {playersConnected}</p>
                            )}
                        </div>
                    </>
                )}

            </div>

            {/* Columna Derecha: Amigos y Reglas */}
            <div className="flex flex-col justify-start h-full z-10 relative pt-10">

                {/* Botón Buscar Jugadores */}
                <div className="flex justify-end mb-8">
                    <PixelButton
                        variant="purple"
                        className="!px-6 !py-4 !text-[1.2rem]"
                        onClick={() => setIsSearchModalOpen(true)}
                    >
                        <span className="mr-2">🔍</span> Buscar Jugadores
                    </PixelButton>
                </div>
            
                {/* Lista de amigos */}
                <div className="flex flex-col gap-6 w-full max-w-[22rem] ml-auto mt-6 flex-1 overflow-hidden">
                    <div className="flex flex-col items-center mb-2">
                        <h2
                            className="text-[2.2rem] tracking-[0.1em] pb-2 text-white font-bold"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Amigos
                        </h2>
                        <div className="w-[85%] mx-auto h-[2px] bg-[#dcbaff] shadow-[0_2px_0px_rgba(0,0,0,1)]"></div>
                    </div>

                    <div className="flex flex-col gap-[1.8rem] px-2 mt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent pr-2">
                        {friends.map((friend) => {
                            const status = getFriendStatus(friend.username);
                            return (
                                <div key={friend.username} className="flex justify-between items-center w-full gap-4 flex-nowrap">
                                    <span
                                        className="text-[1.6rem] text-white font-bold whitespace-nowrap mt-1"
                                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                                    >
                                        {friend.username}
                                    </span>
                                    <PixelButton
                                        variant={status === 'contigo' ? "green" : "purple"}
                                        className={`!px-3 !py-2 !text-[1.1rem] min-w-[8rem] whitespace-nowrap ${status !== 'invitar' ? 'opacity-80' : ''}`}
                                        onClick={() => status === 'invitar' && handleInvite(friend.username)}
                                    >
                                        {status === 'contigo' ? 'Contigo' : status === 'invitado' ? 'Invitado' : 'Invitar'}
                                    </PixelButton>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Zona interactiva de Reglas (Mago dibujado en el fondo) */}
                <div
                    className="absolute bottom-0 right-0 w-[14rem] h-[18rem] cursor-pointer z-10"
                    onClick={() => setIsRulesOpen(true)}
                    aria-label="Reglas del juego"
                    role="button"
                />

                {isRulesOpen && <RulesModal onClose={() => setIsRulesOpen(false)} />}
                {isSearchModalOpen && <UserSearchModal 
                    existingFriends={friends.map(f => f.username)}
                    onClose={() => setIsSearchModalOpen(false)} 
                    onSendRequest={(username) => {
                        if (sessionSocketRef.current?.readyState === WebSocket.OPEN) {
                            sessionSocketRef.current.send(JSON.stringify({ 
                                action: "send_request", 
                                payload: { player_id: username } 
                            }));
                        }
                    }}
                    onRemoveFriend={(username) => {
                        // TODO: Implement unfollow/remove friend logic when backend supports it
                        console.log(`Acción de eliminar amigo no implementada en backend todavía: ${username}`);
                    }}
                />}

            </div>

        </div>
    );
}
