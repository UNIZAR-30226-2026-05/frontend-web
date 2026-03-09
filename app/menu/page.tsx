import React from 'react';

export default function MenuPage() {
    return (
        <div className="bg-sp-bg-dark text-white min-h-screen grid grid-cols-3 gap-8 p-8 font-sans font-bold">

            {/* Columna Izquierda: Usuario y Partidas */}
            <div className="flex flex-col gap-8 h-full">
                {/* Usuario Component Placeholder */}
                <div className="flex items-center gap-4 bg-sp-bg-medium/30 p-4 rounded-xl border border-sp-bg-medium shadow-md">
                    <div className="w-16 h-16 bg-sp-bg-accent rounded-xl flex items-center justify-center text-3xl">
                        🎲
                    </div>
                    <div>
                        <h2 className="text-3xl tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Usuario</h2>
                        <div className="text-sp-bg-light font-black text-xl drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)]">SP</div>
                    </div>
                </div>

                {/* Partidas de amigos */}
                <div className="flex-1 flex flex-col bg-sp-bg-medium/20 rounded-xl border border-sp-bg-medium/40 p-6 relative">
                    <h2 className="text-3xl text-center mb-8 uppercase tracking-widest leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        Partidas<br />de amigos
                    </h2>

                    <div className="mt-auto flex flex-col items-center gap-2 mb-10">
                        <p className="text-sp-text-light drop-shadow-md">!Usuario 3 te ha invitado!</p>
                        <div className="w-full h-1 bg-sp-bg-accent/50 rounded my-2"></div>
                        <p className="text-sp-text-light text-center drop-shadow-md">
                            Únete con el código:<br />
                            <span className="text-white text-xl">B372GFT</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Columna Central: Crear y Unirse a Partida */}
            <div className="flex flex-col items-center justify-center gap-12 p-8">

                {/* Botón Crear Partida */}
                <button className="w-full max-w-sm text-3xl text-white font-bold py-6 px-8 rounded-xl bg-gradient-to-r from-sp-bg-medium to-sp-bg-light border-4 border-sp-bg-accent shadow-[0_0_20px_rgba(61,172,255,0.4)] hover:shadow-[0_0_30px_rgba(61,172,255,0.6)] hover:scale-105 transition-all outline-none">
                    Crear partida
                </button>

                {/* Partida temporal */}
                <div className="w-full flex flex-col items-center max-w-sm mt-4 gap-4">
                    <div className="flex justify-between items-center w-full">
                        <span className="text-lg">Código de partida:<br /><span className="text-xl">AH245J2</span></span>
                        <button className="bg-sp-bg-light/40 border-2 border-sp-bg-accent px-6 py-2 rounded-xl text-sp-text-light hover:bg-sp-bg-medium transition-colors">
                            Usuario
                        </button>
                    </div>

                    <div className="flex justify-center w-full gap-3 mt-2">
                        <div className="bg-sp-player-3/20 border-2 border-sp-player-3 text-sp-player-3 flex-1 text-center py-2 rounded-xl text-sm">Usuario 2</div>
                        <div className="bg-sp-bg-medium/40 border-2 border-sp-bg-accent text-sp-bg-accent flex-1 text-center py-2 rounded-xl text-sm opacity-50">Vacío</div>
                        <div className="bg-sp-bg-medium/40 border-2 border-sp-bg-accent text-sp-bg-accent flex-1 text-center py-2 rounded-xl text-sm opacity-50">Vacío</div>
                    </div>
                </div>

                {/* Unirse a una partida */}
                <div className="w-full flex flex-col items-center mt-8 p-6 gap-6">
                    <h2 className="text-2xl text-center leading-tight drop-shadow-md">Unirse a una<br />partida con código</h2>
                    <input
                        type="text"
                        className="w-full max-w-sm text-center text-3xl font-mono tracking-widest bg-sp-bg-dark border-[6px] border-white rounded-2xl py-4 outline-none focus:border-sp-bg-accent shadow-inner transition-colors"
                    />
                    <p className="text-center text-sm text-sp-text-light/80 max-w-xs mt-2">
                        Crea una partida e invita a tus amigos o únete a una partida
                    </p>
                </div>

            </div>

            {/* Columna Derecha: Amigos y Reglas */}
            <div className="flex flex-col justify-between h-full">

                {/* Lista de amigos */}
                <div className="flex flex-col gap-6 w-full max-w-xs ml-auto">
                    <div className="border-b-[3px] border-white pb-2 flex justify-center mt-4">
                        <h2 className="text-3xl tracking-widest drop-shadow-sm">Amigos</h2>
                    </div>

                    <div className="flex flex-col gap-5 mt-4">
                        <div className="flex justify-between items-center w-full">
                            <span className="text-2xl drop-shadow-md">Usuario 1</span>
                            <span className="bg-sp-player-2/20 text-sp-player-2 border-2 border-sp-player-2 px-3 py-1 rounded outline-none text-sm font-bold min-w-[5rem] text-center">Invitado</span>
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-2xl drop-shadow-md">Usuario 2</span>
                            <span className="bg-sp-player-3/10 text-sp-player-3 border-2 border-sp-player-3 px-3 py-1 rounded outline-none text-sm font-bold min-w-[5rem] text-center">Contigo</span>
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-2xl drop-shadow-md">Usuario 3</span>
                            <button className="bg-sp-bg-medium/60 text-sp-text-light border-2 border-sp-bg-accent px-3 py-1 rounded outline-none text-sm font-bold min-w-[5rem] text-center hover:bg-sp-bg-light transition-colors">Invitar</button>
                        </div>
                    </div>
                </div>

                {/* Mascota y Reglas */}
                <div className="flex justify-end items-end pb-4 pr-10 hover:scale-105 transition-transform cursor-pointer">
                    <div className="flex flex-col items-center">
                        <div className="relative text-7xl text-sp-bg-light drop-shadow-xl z-0 -rotate-12 mb-2">
                            🧙‍♂️
                            <div className="absolute top-0 right-0 text-3xl -translate-y-4 translate-x-4 bg-sp-bg-dark rounded-full">❔</div>
                        </div>
                        <span className="text-3xl tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">Reglas</span>
                    </div>
                </div>

            </div>

        </div>
    );
}
