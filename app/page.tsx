"use client";

import Link from "next/link";
import PixelButton from "@/components/UI/PixelButton";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/lobby.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      {/* Zona interactiva del Logo (dibujado en el fondo) */}
      <div 
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[24rem] h-[15rem] cursor-pointer z-10"
        onClick={() => window.location.href = '/'}
        aria-label="Snow Party Logo"
      />

      {/* Botones de acción */}
      <div className="flex gap-6 mt-12 z-10">
        <Link href="/login">
          <PixelButton
            variant="purple_blue"
            className="font-pixel text-xl md:text-2xl"
            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
          >
            Iniciar Sesión
          </PixelButton>
        </Link>
        <Link href="/register">
          <PixelButton
            variant="green"
            className="font-pixel text-xl md:text-2xl"
            style={{ textShadow: "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000" }}
          >
            Registrarse
          </PixelButton>
        </Link>
      </div>
    </main>
  );
}
