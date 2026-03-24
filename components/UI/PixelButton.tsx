"use client";

import React from 'react';
import Image from 'next/image';

export type PixelButtonVariant = 'purple' | 'red' | 'green';

export interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: PixelButtonVariant;
    children: React.ReactNode;
}

const variantImages: Record<PixelButtonVariant, string> = {
    red: '/btn_rojo.png',
    green: '/btn_verde.png',
    purple: '/btn_morado.png',
};

export default function PixelButton({
    children,
    variant = 'purple',
    className = '',
    style = {},
    ...props
}: PixelButtonProps) {

    const baseClasses = `
    relative font-pixel tracking-widest px-6 py-4
    outline-none transition-transform duration-100
    active:scale-[0.98] flex justify-center items-center text-center
    hover:brightness-110 text-white
  `.replace(/\s+/g, ' ').trim();

    // Pure 4-way stroke as requested
    const crispTextOutline = "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000";

    const combinedStyle = {
        textShadow: crispTextOutline,
        ...style
    };

    return (
        <button
            className={`${baseClasses} ${className}`}
            style={combinedStyle}
            {...props}
        >
            <Image
                src={variantImages[variant]}
                alt={`${variant} button background`}
                fill
                className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
                unoptimized
            />
            <span className="relative z-10 w-full flex justify-center items-center">
                {children}
            </span>
        </button>
    );
}
