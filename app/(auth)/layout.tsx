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
                backgroundImage: "url('/fondo_menu.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >

            <div className="z-10 relative">
                {children}
            </div>
        </div>
    );
}
