"use client";

import React, { useState } from 'react';
import PixelInput from '@/components/UI/PixelInput';
import PixelButton from '@/components/UI/PixelButton';
import { changePasswordAction } from '@/actions/auth';

interface ChangePasswordFormProps {
    onClose: () => void;
}

export default function ChangePasswordForm({ onClose }: ChangePasswordFormProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const textShadow = "0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.6), 0 0 12px rgba(220,200,255,0.3)";

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Todos los campos son obligatorios");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las nuevas contraseñas no coinciden");
            return;
        }

        if (newPassword.length < 8) {
            setError("La nueva contraseña debe tener al menos 8 caracteres");
            return;
        }

        setLoading(true);

        const result = await changePasswordAction(currentPassword, newPassword);
        setLoading(false);

        if (!result.success) {
            setError(result.message);
            return;
        }

        setSuccess(result.message);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center gap-6 font-pixel text-white w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1
                className="text-4xl text-center leading-relaxed mb-2 uppercase tracking-wide"
                style={{ textShadow }}
            >
                Cambiar<br />Contraseña
            </h1>

            <form onSubmit={handleSave} className="flex flex-col items-center gap-6 w-full">
                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg uppercase">Contraseña Actual</label>
                    <PixelInput
                        type="password"
                        className="w-full text-center"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg uppercase">Nueva Contraseña</label>
                    <PixelInput
                        type="password"
                        className="w-full text-center"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg uppercase">Confirmar Nueva</label>
                    <PixelInput
                        type="password"
                        className="w-full text-center"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="text-[#ffb3b3] text-sm text-center font-bold animate-pulse py-1" style={{ textShadow }}>
                        {error}
                    </p>
                )}

                {success && (
                    <p className="text-[#b9ffb3] text-sm text-center font-bold py-1" style={{ textShadow }}>
                        {success}
                    </p>
                )}

                <div className="mt-4 flex flex-col items-center gap-4 w-full">
                    <PixelButton variant="green" disabled={loading} className="w-full py-4 text-xl">
                        {loading ? 'Guardando...' : 'Guardar'}
                    </PixelButton>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-lg text-center text-gray-400 transition-colors hover:text-white uppercase tracking-tighter mt-2" 
                    >
                        Volver al menú
                    </button>
                </div>
            </form>
        </div>
    );
}
