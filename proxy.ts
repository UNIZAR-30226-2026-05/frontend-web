
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';


// rutas protejidas, sin JWT no entras
const protectedRoutes = ['/menu'] // añadrir futuras rutas aqui

// función que nos dice si una ruta a la que quiere acceder el usuario está protegida o no, 
function IsProtectedRoute(path: string) {
    return protectedRoutes.includes(path);
}


export async function proxy(request: NextRequest) {

    const pathActual = request.nextUrl.pathname;

    if (!IsProtectedRoute(pathActual)) {
        return NextResponse.next(); // si la ruta no es protegida, dejamos pasar al usuario
    }

    try {
        const cookieStore = await cookies();
        const jwt = cookieStore.get('jwt')?.value; // obtenemos el JWT de las cookies

        if (!jwt) {
            return NextResponse.redirect(new URL('/login', request.url)); // si no hay JWT, redirigimos al usuario a la página de login
        }

        return NextResponse.next(); // si hay JWT, dejamos pasar al usuario a la ruta protegida

    } catch (error) {
        console.error('Error en el proxy al verificar token:', error);
        return NextResponse.redirect(new URL('/login', request.url)); // en caso de error, redirigimos al usuario a la página de login
    }

}