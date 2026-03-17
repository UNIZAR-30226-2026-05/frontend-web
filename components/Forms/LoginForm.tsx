'use client';   // IMPORTANTE: usamos use client ya que queremos que se ejetute en el cliente.
                // Esto se debe a que los campos que rellena el usuario tienen que ser reactivos 
                // a la hora de mostrerle los errores de validación.
                // Así mismo, si queremos que el usuario cambie el estado, es obligatorio que el
                // componente se ejecute en el cliente.


import React from 'react';
import Link from 'next/link';
import PixelInput from '../UI/PixelInput';
import PixelButton from '../UI/PixelButton';

export default function LoginForm() {
    const textShadow = "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000";

    return (
        <div className="flex flex-col items-center gap-6 font-pixel text-white">
            <h1 
                className="text-4xl text-center leading-relaxed mb-4" 
                style={{ textShadow }}
            >
                Inicia sesión<br />para jugar
            </h1>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg">Nombre de usuario</label>
                    <PixelInput className="w-full text-center" placeholder='Username'/>
                </div>

                <div className="flex flex-col gap-2 w-full text-center">
                    <label style={{ textShadow }} className="text-lg">Contraseña</label>
                    <PixelInput type="password" className="w-full text-center" placeholder='Contraseña'/>
                </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-6">
                <PixelButton variant="purple">
                    Entrar
                </PixelButton>

                <Link 
                    href="/register" 
                    className="text-sm text-center transition-colors hover:text-gray-300 leading-loose" 
                    style={{ textShadow }}
                >
                    Si no tienes cuenta,<br />regístrate AQUÍ
                </Link>
            </div>
        </div>
    );
}
