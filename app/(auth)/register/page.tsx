import React from 'react';
import Link from 'next/link';
import PixelInput from '../../../shared/components/PixelInput';
import PixelButton from '../../../shared/components/PixelButton';

export default function RegisterPage() {
    const textShadow = "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000";

    return (
        <div className="flex flex-col items-center gap-6 font-pixel text-white">
            <h1 
                className="text-4xl text-center leading-relaxed mb-4" 
                style={{ textShadow }}
            >
                Registrarse
            </h1>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg">Nombre de usuario</label>
                    <PixelInput className="w-full text-center" />
                </div>

                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg">Contraseña</label>
                    <PixelInput type="password" className="w-full text-center" />
                </div>

                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg">Repite la contraseña</label>
                    <PixelInput type="password" className="w-full text-center" />
                </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-6">
                <PixelButton variant="green">
                    Crear cuenta
                </PixelButton>

                <Link 
                    href="/login" 
                    className="text-sm text-center transition-colors hover:text-gray-300 leading-loose" 
                    style={{ textShadow }}
                >
                    Si ya tienes cuenta,<br />INICIA SESIÓN
                </Link>
            </div>
        </div>
    );
}
