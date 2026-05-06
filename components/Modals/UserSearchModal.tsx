"use client";

import React, { useState, useEffect } from 'react';
import PixelButton from '@/components/UI/PixelButton';
import PixelInput from '@/components/UI/PixelInput';

type UserStatus = 'none' | 'pending' | 'added';

interface User {
    username: string;
    status: UserStatus;
}

interface UserSearchModalProps {
    onClose: () => void;
    onSendRequest: (username: string) => void;
    onRemoveFriend?: (username: string) => void;
}

export default function UserSearchModal({ onClose, onSendRequest, onRemoveFriend }: UserSearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setUsers([]);
            return;
        }

        const fetchUsers = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${backendUrl}/usuarios/filtrar_usuarios?cadena=${searchQuery}`);
                if (response.ok) {
                    const data = await response.json();
                    const formattedUsers = data.map((u: any) => ({
                        username: typeof u === 'string' ? u : u.username || u.nombre || u,
                        status: 'none'
                    }));
                    setUsers(formattedUsers);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        const debounceTimer = setTimeout(fetchUsers, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleAction = (username: string, currentStatus: UserStatus) => {
        if (currentStatus === 'none') {
            onSendRequest(username);
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.username === username ? { ...user, status: 'pending' } : user
                )
            );
        } else if (currentStatus === 'pending') {
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.username === username ? { ...user, status: 'none' } : user
                )
            );
        } else if (currentStatus === 'added') {
            if (onRemoveFriend) onRemoveFriend(username);
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.username === username ? { ...user, status: 'none' } : user
                )
            );
        }
    };

    const getButtonConfig = (status: UserStatus) => {
        switch (status) {
            case 'added':
                return { text: 'Eliminar', variant: 'red' as const };
            case 'pending':
                return { text: 'Pendiente', variant: 'purple' as const };
            default:
                return { text: 'Añadir', variant: 'green' as const };
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            {/* Contenedor del Modal */}
            <div
                className="relative w-full max-w-lg bg-[var(--color-sp-bg-dark)] border-4 border-white flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div className="p-4 border-b-4 border-white flex justify-between items-center bg-[var(--color-sp-bg-medium)]">
                    <h2 className="text-2xl font-pixel text-white tracking-widest uppercase"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}>
                        Buscar Jugadores
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-red-400 transition-colors text-3xl font-bold p-2 leading-none font-pixel"
                        aria-label="Cerrar"
                    >
                        X
                    </button>
                </div>

                {/* Buscador */}
                <div className="p-6 flex flex-col gap-4 bg-[var(--color-sp-bg-dark)]">
                    <div className="flex gap-2">
                        <PixelInput
                            placeholder="Nombre del jugador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 text-lg"
                        />
                        <PixelButton variant="green" className="!px-4 !py-2 shrink-0">
                            🔍
                        </PixelButton>
                    </div>
                </div>

                {/* Resultados con scroll */}
                <div className="flex-1 overflow-y-auto max-h-[400px] p-6 pt-0 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
                    <div className="flex flex-col gap-3">
                        {users.length > 0 ? (
                            users.map((user) => {
                                const { text, variant } = getButtonConfig(user.status);
                                return (
                                    <div
                                        key={user.username}
                                        className="flex justify-between items-center p-3 border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-white font-pixel text-xl"
                                              style={{ textShadow: "1px 1px 0 #000" }}>
                                            {user.username}
                                        </span>
                                        <PixelButton
                                            variant={variant}
                                            onClick={() => handleAction(user.username, user.status)}
                                            className="!px-3 !py-2 !text-sm min-w-[120px]"
                                        >
                                            {text}
                                        </PixelButton>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-white/60 font-pixel text-center py-4">
                                {searchQuery.length < 3 ? "Escribe al menos 3 caracteres..." : "No se encontraron jugadores"}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
