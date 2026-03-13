"use client";

import React from 'react';
import PixelButton from '@/shared/components/PixelButton';

export default function MenuPage() {
    return (
        <div
            className="text-white min-h-screen grid grid-cols-3 gap-8 p-8 font-pixel font-normal text-xl tracking-wide relative overflow-hidden"
            style={{
                backgroundImage: "url('/bg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >


            {/* Columna Izquierda: Usuario y Partidas */}
            <div className="flex flex-col gap-8 h-full z-10 relative">
                {/* Usuario Component */}
                <div className="flex items-center gap-4 p-4 mt-2">
                    <img src="/logo_NOFondo.png" alt="Logo SP" className="w-[8rem] h-auto drop-shadow-[0_4px_0_rgba(0,0,0,1)] z-10" />
                    <span
                        className="text-[2.5rem] tracking-widest font-bold text-white whitespace-nowrap"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Usuario
                    </span>
                </div>

                {/* Partidas de amigos */}
                <div className="flex-1 flex flex-col p-6 pl-4 relative mt-4">
                    <h2
                        className="text-[2.8rem] leading-snug mb-10 text-white font-bold whitespace-nowrap"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Partidas<br />de amigos
                    </h2>

                    <div className="mt-8 flex flex-col gap-3 w-fit">
                        <p
                            className="text-[#a8a8a8] text-[1.1rem] font-bold mb-1"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Usuario 3 te ha invitado!
                        </p>
                        <div className="w-full h-[2px] bg-white mb-2 shadow-[0_2px_0_#000]"></div>
                        <p
                            className="text-white text-[1.2rem] font-bold leading-tight"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Únete con el código:<br />
                            <span
                                className="text-white text-[1.8rem] mt-4 block"
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
                <PixelButton variant="purple" className="w-full max-w-[28rem] py-6 text-[1.8rem]">
                    Crear partida
                </PixelButton>

                {/* Partida temporal compacta */}
                <div className="w-full max-w-[28rem] mt-2 mb-4">
                    <div className="flex justify-between items-center w-full mb-4 px-2">
                        <div className="flex flex-col">
                            <span
                                className="text-[1.1rem] leading-snug text-white font-bold"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Código de partida:
                            </span>
                            <span
                                className="text-[1.6rem] text-white mt-1 inline-block font-bold"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                AH245J2
                            </span>
                        </div>
                        <div className="flex justify-end">
                            <PixelButton variant="purple_blue" className="!px-6 !py-3 !text-[1.1rem] !tracking-wider">
                                Usuario
                            </PixelButton>
                        </div>
                    </div>

                    <div className="flex justify-between w-full gap-5">
                        <PixelButton variant="purple" className="flex-1 !px-2 !py-4 !text-[1rem] !tracking-wider">Usuario 2</PixelButton>
                        <PixelButton variant="purple" className="flex-1 !px-2 !py-4 !text-[1rem] !tracking-wider opacity-70">Vacío</PixelButton>
                        <PixelButton variant="purple" className="flex-1 !px-2 !py-4 !text-[1rem] !tracking-wider opacity-70">Vacío</PixelButton>
                    </div>
                </div>

                {/* Unirse a una partida */}
                <div className="w-full flex flex-col items-center mt-2 gap-4">
                    <h2
                        className="text-[1.8rem] text-white font-bold text-center leading-snug mb-2"
                        style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                    >
                        Unirse a una<br />partida con código
                    </h2>
                    <div className="relative w-full max-w-[24rem]">
                        <input
                            type="text"
                            className="w-full text-center text-[2rem] font-bold font-pixel tracking-widest bg-[#1f093d] text-white py-4 outline-none transition-colors"
                            style={{
                                border: "4px solid #fff",
                                borderRadius: "2px",
                                boxShadow: "inset 0 0 5px rgba(150, 100, 255, 0.5)",
                                textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000"
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-center mt-4">
                        <p
                            className="text-center text-[0.9rem] text-white font-bold"
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
                            className="text-[1.8rem] tracking-[0.1em] pb-2 text-white font-bold"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Amigos
                        </h2>
                        <div className="w-[85%] mx-auto h-[2px] bg-[#dcbaff] shadow-[0_2px_0px_rgba(0,0,0,1)]"></div>
                    </div>

                    <div className="flex flex-col gap-[1.8rem] px-2 mt-2">
                        <div className="flex justify-between items-center w-full gap-4 flex-nowrap">
                            <span
                                className="text-[1.3rem] text-white font-bold whitespace-nowrap mt-1"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Usuario 1
                            </span>
                            <PixelButton variant="red" className="!px-3 !py-2 !text-[0.9rem] min-w-[7rem] whitespace-nowrap">Invitado</PixelButton>
                        </div>
                        <div className="flex justify-between items-center w-full gap-4 flex-nowrap">
                            <span
                                className="text-[1.3rem] text-white font-bold whitespace-nowrap mt-1"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Usuario 2
                            </span>
                            <PixelButton variant="green" className="!px-3 !py-2 !text-[0.9rem] min-w-[7rem] whitespace-nowrap">Contigo</PixelButton>
                        </div>
                        <div className="flex justify-between items-center w-full gap-4 flex-nowrap">
                            <span
                                className="text-[1.3rem] text-white font-bold whitespace-nowrap mt-1"
                                style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                            >
                                Usuario 3
                            </span>
                            <PixelButton variant="purple" className="!px-3 !py-2 !text-[0.9rem] min-w-[7rem] whitespace-nowrap">Invitar</PixelButton>
                        </div>
                    </div>
                </div>

                {/* Mascota y Reglas */}
                <div className="flex justify-end items-end pb-2 pr-4 hover:scale-105 transition-transform cursor-pointer absolute bottom-[-1rem] right-[-1rem] group">
                    <div className="flex flex-col items-center relative gap-2">
                        <div className="relative">
                            <img src="/personajes/mago.png" alt="Mago" className="w-[14rem] drop-shadow-[0_6px_0_rgba(0,0,0,1)] z-0 -scale-x-100" />
                            <div
                                className="absolute -top-[1.2rem] -left-[2.8rem] text-[5.5rem] text-white font-bold rotate-[-15deg] group-hover:scale-110 transition-transform"
                                style={{ textShadow: "3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000" }}
                            >
                                ?
                            </div>
                        </div>
                        <span
                            className="text-[2.5rem] tracking-widest z-10 text-white font-bold whitespace-nowrap"
                            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
                        >
                            Reglas
                        </span>
                    </div>
                </div>

            </div>

        </div>
    );
}
