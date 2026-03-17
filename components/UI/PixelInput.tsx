import React, { forwardRef } from 'react';

export type PixelInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(
    ({ className = '', style = {}, ...props }, ref) => {
        const baseClasses = "bg-[#1f093d] text-white font-pixel border-[4px] border-white rounded-[2px] outline-none focus:outline-none px-4 py-3";
        
        const combinedStyle = {
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
