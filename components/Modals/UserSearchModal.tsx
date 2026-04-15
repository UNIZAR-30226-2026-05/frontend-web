"use client";

import React, { useState } from 'react';
import PixelButton from '@/components/UI/PixelButton';
import PixelInput from '@/components/UI/PixelInput';

type UserStatus = 'none' | 'pending' | 'added';

interface User {
    username: string;
    status: UserStatus;
}

interface UserSearchModalProps {
    onClose: () => void;
}

const INITIAL_MOCK_USERS: User[] = [
    { username: 'ProGamer99', status: 'none' },
    { username: 'SnowKing', status: 'added' },
    { username: 'IceQueen', status: 'pending' },
    { username: 'PixelMaster', status: 'added' },
    { username: 'WinterIsComing', status: 'none' },
    { username: 'Frosty', status: 'pending' },
];

export default function UserSearchModal({ onClose }: UserSearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>(INITIAL_MOCK_USERS);

    const handleAction = (username: string, currentStatus: UserStatus) => {
        setUsers(prevUsers =>
            prevUsers.map(user => {
                if (user.username !== username) return user;
                
                // Logic: 
                // none -> pending
                // pending -> none (cancel)
                // added -> none (remove)
                let nextStatus: UserStatus = 'none';
                if (currentStatus === 'none') nextStatus = 'pending';
                else if (currentStatus === 'pending') nextStatus = 'none';
                else if (currentStatus === 'added') nextStatus = 'none';

                return { ...user, status: nextStatus };
            })
        );
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
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
                                No se encontraron jugadores
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
