"use client";

import React from 'react';

export type PixelButtonVariant = 'primary' | 'success' | 'warning' | 'hero';

export interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: PixelButtonVariant;
    children: React.ReactNode;
}

export default function PixelButton({
    children,
    variant = 'primary',
    className = '',
    style = {},
    ...props
}: PixelButtonProps) {

    const baseClasses = `
    relative font-pixel tracking-widest px-6 py-4
    outline-none transition-transform duration-100
    active:translate-y-[4px] active:scale-[0.98] active:shadow-[0_0px_0_#000]
    flex justify-center items-center text-center
    backdrop-blur-sm bg-opacity-80
  `.replace(/\s+/g, ' ').trim();

    const getVariantStyles = (v: PixelButtonVariant) => {
        // Unmistakable CSS checkerboard texture explicitly over the background color
        const texturePattern = "repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1)), repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))";
        const texturePosition = "0 0, 4px 4px";
        const textureSize = "8px 8px";

        switch (v) {
            case 'success':
                return {
                    backgroundColor: "#1f8b1b",
                    backgroundImage: texturePattern,
                    backgroundPosition: texturePosition,
                    backgroundSize: textureSize,
                    boxShadow: "0 0 0 2px #37f132, inset 0 0 0 2px #106b0d, 0 6px 0 2px rgba(0,0,0,0.8)"
                };
            case 'warning':
                return {
                    backgroundColor: "#a11c4c",
                    backgroundImage: texturePattern,
                    backgroundPosition: texturePosition,
                    backgroundSize: textureSize,
                    boxShadow: "0 0 0 2px #ff5a88, inset 0 0 0 2px #750e33, 0 6px 0 2px rgba(0,0,0,0.8)"
                };
            case 'hero':
                return {
                    backgroundColor: "#3a1b6b",
                    backgroundImage: texturePattern,
                    backgroundPosition: texturePosition,
                    backgroundSize: textureSize,
                    boxShadow: "0 0 0 2px #b088f0, inset 0 0 0 2px #8a4bcf, 0 6px 0 2px rgba(0,0,0,0.8)"
                };
            case 'primary':
            default:
                return {
                    backgroundColor: "#452378",
                    backgroundImage: texturePattern,
                    backgroundPosition: texturePosition,
                    backgroundSize: textureSize,
                    boxShadow: "0 0 0 2px #8f5aff, inset 0 0 0 2px #5c20e6, 0 6px 0 2px rgba(0,0,0,0.8)"
                };
        }
    };

    const isHero = variant === 'hero';

    // Pure 4-way stroke as requested
    const crispTextOutline = "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000";

    const combinedStyle = {
        textShadow: crispTextOutline,
        margin: variant === 'hero' ? '6px' : '4px', // To account for the 0 0 0 box-shadows acting as borders
        ...(isHero ? { clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)' } : {}),
        ...getVariantStyles(variant),
        ...style
    };

    return (
        <button
            className={`${baseClasses} text-white hover:brightness-110 ${className}`}
            style={combinedStyle}
            {...props}
        >
            {children}
        </button>
    );
}
