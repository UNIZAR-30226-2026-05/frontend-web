import Link from "next/link";
import PixelButton from "@/components/UI/PixelButton";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      {/* Logo del juego */}
      <img
        src="/logo_NOFondo.png"
        alt="Snow Party Logo"
        className="w-[20rem] md:w-[24rem] z-10 hover:scale-105 transition-transform duration-300 ease-in-out drop-shadow-2xl"
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
