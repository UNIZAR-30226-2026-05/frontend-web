'use client';   // IMPORTANTE: usamos use client ya que queremos que se ejetute en el cliente.
                // Esto se debe a que los campos que rellena el usuario tienen que ser reactivos 
                // a la hora de mostrerle los errores de validación.
                // Así mismo, si queremos que el usuario cambie el estado, es obligatorio que el
                // componente se ejecute en el cliente.

import React from 'react';
import Link from 'next/link';
import PixelInput from '../UI/PixelInput';
import PixelButton from '../UI/PixelButton';

export default function RegisterForm() {
    const textShadow = "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000";

    return (
        <div className="flex flex-col items-center gap-6 font-pixel text-white">
            <form>
                <h1 
                    className="text-4xl text-center leading-relaxed mb-4" 
                    style={{ textShadow }}
                >
                    Registrarse
                </h1>

                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    <div className="flex flex-col gap-2 w-full text-center">
                        <label style={{ textShadow }} className="text-lg">Nombre de usuario</label>
                        <PixelInput placeholder='Username'
                        className="w-full text-center" />
                    </div>

                    <div className="flex flex-col gap-2 w-full text-center">
                        <label style={{ textShadow }} className="text-lg">Contraseña</label>
                        <PixelInput type="password" 
                                    placeholder='Contraseña'
                                    className="w-full text-center" />
                    </div>

                    <div className="flex flex-col gap-2 w-full text-center">
                        <label style={{ textShadow }} className="text-lg">Repite la contraseña</label>
                        <PixelInput type="password" 
                                    placeholder='Repite la contraseña'
                                    className="w-full text-center" />
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
            </form>
        </div>
    );
}
