import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{
                backgroundImage: "url('/bg_inicio.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* 
            Zona interactiva del Logo (dibujado en el fondo)
            <Link 
                href="/"
                className="absolute top-4 left-4 w-[12rem] h-[10rem] cursor-pointer z-20"
                aria-label="Volver al inicio"
            />
            */}

            <div className="z-10 relative">
                {children}
            </div>
        </div>
    );
}
