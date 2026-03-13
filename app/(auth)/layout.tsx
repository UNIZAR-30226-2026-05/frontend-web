import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative"
            style={{
                backgroundImage: "url('/bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(17, 12, 22, 0.95) 40%, rgba(48,7,77,0.95) 120%)"
                }}
            />
            <div className="z-10 relative">
                {children}
            </div>
        </div>
    );
}
