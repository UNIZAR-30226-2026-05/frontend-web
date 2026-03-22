"use client";

import React from 'react';
import Link from 'next/link';
import PixelButton from '@/components/UI/PixelButton';

export default function MenuPage() {
    return (
        <div
            className="text-white min-h-screen grid grid-cols-3 gap-8 p-8 font-pixel font-normal text-2xl tracking-wide relative overflow-hidden"
            style={{
                backgroundImage: "url('/lobby.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >


            {/* Columna Izquierda: Usuario y Partidas */}
            <div className="flex flex-col gap-8 h-full z-10 relative">
                {/* Usuario Component */}
                <div className="flex items-center gap-4 p-4 mt-2">
                    {/* Zona interactiva del Logo (dibujado en el fondo) */}
                    <div
                        className="absolute top-[3rem] left-[3rem] w-[12rem] h-[10rem] cursor-pointer z-10"
                        onClick={() => window.location.href = '/'}
                        aria-label="Snow Party Logo"
                    />
                    <span
                        className="text-[3rem] tracking-widest font-bold text-white whitespace-nowrap ml-[14rem]"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Usuario
                    </span>
                </div>

                {/* Partidas de amigos */}
                <div className="flex-1 flex flex-col p-6 pl-4 relative mt-20">
                    <h2
                        className="text-[3.5rem] leading-snug mb-10 text-white font-bold whitespace-nowrap"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Partidas<br />de amigos
                    </h2>

                    <div className="mt-8 flex flex-col gap-3 w-fit">
                        <p
                            className="text-[#a8a8a8] text-[1.3rem] font-bold mb-1"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Usuario 3 te ha invitado!
                        </p>
                        <div className="w-full h-[2px] bg-white mb-2 shadow-[0_2px_0_#000]"></div>
                        <p
                            className="text-white text-[1.5rem] font-bold leading-tight"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Únete con el código:<br />
                            <span
                                className="text-white text-[2.2rem] mt-4 block"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                B372GFT
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Columna Central: Crear y Unirse a Partida */}
            <div className="flex flex-col items-center justify-center gap-[4rem] p-8 z-10 relative">

                {/* Botón Crear Partida */}
                <PixelButton variant="purple" className="w-full max-w-[28rem] py-6 text-[2.2rem]">
                    Crear partida
                </PixelButton>

                {/* Partida temporal compacta */}
                <div className="w-full max-w-[28rem] mt-2 mb-4">
                    <div className="flex justify-between items-center w-full mb-4 px-2">
                        <div className="flex flex-col">
                            <span
                                className="text-[1.3rem] leading-snug text-white font-bold"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Código de partida:
                            </span>
                            <span
                                className="text-[2rem] text-white mt-1 inline-block font-bold"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                AH245J2
                            </span>
                        </div>
                        <div className="flex justify-end">
                            <PixelButton variant="purple" className="!px-6 !py-3 !text-[1.3rem] !tracking-wider">
                                Usuario
                            </PixelButton>
                        </div>
                    </div>

                    <div className="flex justify-between w-full gap-5">
                        <PixelButton variant="purple" className="flex-1 !px-2 !py-4 !text-[1.2rem] !tracking-wider">Usuario 2</PixelButton>
                        <PixelButton variant="purple" className="flex-1 !px-2 !py-4 !text-[1.2rem] !tracking-wider opacity-70">Vacío</PixelButton>
                        <PixelButton variant="purple" className="flex-1 !px-2 !py-4 !text-[1.2rem] !tracking-wider opacity-70">Vacío</PixelButton>
                    </div>
                </div>

                {/* Unirse a una partida */}
                <div className="w-full flex flex-col items-center mt-2 gap-4">
                    <h2
                        className="text-[2.2rem] text-white font-bold text-center leading-snug mb-2"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Unirse a una<br />partida con código
                    </h2>
                    <div className="relative w-full max-w-[24rem]">
                        <input
                            type="text"
                            className="w-full text-center text-[2.5rem] font-bold font-pixel tracking-widest text-white py-4 outline-none transition-colors"
                            style={{
                                backgroundImage: "url('/rellenable.png')",
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                                boxShadow: "inset 0 0 5px rgba(150, 100, 255, 0.5)",
                                textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000"
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-center mt-4">
                        <p
                            className="text-center text-[1.1rem] text-white font-bold"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Crea una partida e invita<br />a tus amigos o únete a<br />una partida
                        </p>
                    </div>
                </div>

            </div>

            {/* Columna Derecha: Amigos y Reglas */}
            <div className="flex flex-col justify-between h-full z-10 relative">

                {/* Lista de amigos */}
                <div className="flex flex-col gap-6 w-full max-w-[22rem] ml-auto mt-6">
                    <div className="flex flex-col items-center mb-2">
                        <h2
                            className="text-[2.2rem] tracking-[0.1em] pb-2 text-white font-bold"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Amigos
                        </h2>
                        <div className="w-[85%] mx-auto h-[2px] bg-[#dcbaff] shadow-[0_2px_0px_rgba(0,0,0,1)]"></div>
                    </div>

                    <div className="flex flex-col gap-[1.8rem] px-2 mt-2">
                        <div className="flex justify-between items-center w-full gap-4 flex-nowrap">
                            <span
                                className="text-[1.6rem] text-white font-bold whitespace-nowrap mt-1"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Usuario 1
                            </span>
                            <PixelButton variant="red" className="!px-3 !py-2 !text-[1.1rem] min-w-[7rem] whitespace-nowrap">Invitado</PixelButton>
                        </div>
                        <div className="flex justify-between items-center w-full gap-4 flex-nowrap">
                            <span
                                className="text-[1.6rem] text-white font-bold whitespace-nowrap mt-1"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Usuario 2
                            </span>
                            <PixelButton variant="green" className="!px-3 !py-2 !text-[1.1rem] min-w-[7rem] whitespace-nowrap">Contigo</PixelButton>
                        </div>
                        <div className="flex justify-between items-center w-full gap-4 flex-nowrap">
                            <span
                                className="text-[1.6rem] text-white font-bold whitespace-nowrap mt-1"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Usuario 3
                            </span>
                            <PixelButton variant="purple" className="!px-3 !py-2 !text-[1.1rem] min-w-[7rem] whitespace-nowrap">Invitar</PixelButton>
                        </div>
                    </div>
                </div>

                {/* Zona interactiva de Reglas (Mago dibujado en el fondo) */}
                <Link
                    href="/rules"
                    className="absolute bottom-0 right-0 w-[20rem] h-[25rem] cursor-pointer z-10"
                    aria-label="Reglas del juego"
                />

            </div>

        </div>
    );
}
