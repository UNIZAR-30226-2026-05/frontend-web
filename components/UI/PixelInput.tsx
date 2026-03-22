import React, { forwardRef } from 'react';

export interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(
    ({ className = '', style = {}, ...props }, ref) => {
        const baseClasses = "text-white font-pixel rounded-[2px] outline-none focus:outline-none px-4 py-3";
        
        const combinedStyle = {
            backgroundImage: "url('/rellenable.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            boxShadow: 'inset 0 0 5px rgba(150, 100, 255, 0.5)',
            ...style
        };

        return (
            <input
                ref={ref}
                className={`${baseClasses} ${className}`.trim()}
                style={combinedStyle}
                {...props}
            />
        );
    }
);

PixelInput.displayName = 'PixelInput';

export default PixelInput;
