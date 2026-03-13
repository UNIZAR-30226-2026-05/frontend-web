import Image from "next/image";

export default function GamePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[url('/bg.jpg')] bg-cover bg-center">
      
      {/* Contenedor principal que centra el tablero y respeta límites de pantalla */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
          <Image
            src="/tablero_def.png"
            alt="Tablero de juego"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Contenedor superpuesto para controles (esquina inferior derecha) */}
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 flex flex-col items-end gap-4">
        {/* Aquí se integrará el dado y otras acciones del jugador */}
        <div id="dice-container"></div>
      </div>
      
    </main>
  );
}
