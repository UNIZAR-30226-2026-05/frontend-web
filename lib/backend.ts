
type UserData = {
    username: string;
    password: string;
}


export async function registerUserService(userData: object) {
    const url = `${process.env.API_URL}/usuarios/registro/`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log('Response from backend:', data); // Para verificar la respuesta del backend

        return data;

    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }

}


export async function loginUserService(userData: UserData) {
    const url = `${process.env.API_URL}/usuarios/login`;

    const params = new URLSearchParams();
    params.append('username', userData.username);
    params.append('password', userData.password);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // en el login necesitamos este formato
            },
            body: params
        });

        const data = await response.json();
        console.log('Response from backend:', data); // Para verificar la respuesta del backend

        return data;

    } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }

}
// como getItem devuelve string | null, el token puede ser null, por eso el tipo de token es string | null
export async function CrearPartidaService(token: string | null): Promise<number> {

    // Usamos NEXT_PUBLIC_API_URL porque es invocado desde un Client Component
    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const baseUrl = `${apiHost}`;
    const url = `${baseUrl}/partidas/crear_partida`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (typeof data === 'number') {
            return data;
        }

        if (typeof data === 'object' && data !== null) {
            const res = data as Record<string, unknown>;
            const id = res.id ?? res.id_partida ?? res.codigo_partida ?? res.partida_id;
            if (typeof id === 'number') {
                return id;
            }
        }

        return data; // Fallback original

    } catch (error) {
        console.error('Error creating game:', error);
        throw error;
    }

}

export async function UnirsePartidaService(codigoPartida: number, token: string | null): Promise<number> {

    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const baseUrl = `${apiHost}`;

    const attempts: Array<{ url: string; body: Record<string, number> | null }> = [
        { url: `${baseUrl}/partidas/unirse_partida`, body: { id_partida: codigoPartida } },
        { url: `${baseUrl}/partidas/unirse_partida`, body: { codigo_partida: codigoPartida } },
        { url: `${baseUrl}/partidas/unirse_partida/${codigoPartida}`, body: null },
    ];

    let lastError = 'No se pudo unir a la partida';

    for (const attempt of attempts) {
        try {
            const response = await fetch(attempt.url, {
                method: 'POST',
                headers: {
                    ...(attempt.body ? { 'Content-Type': 'application/json' } : {}),
                    'Authorization': `Bearer ${token}`
                },
                ...(attempt.body ? { body: JSON.stringify(attempt.body) } : {})
            });

            let data: unknown = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (response.ok) {
                if (typeof data === 'number') {
                    return data;
                }

                if (typeof data === 'object' && data !== null) {
                    const maybeId = data as {
                        id_partida?: number;
                        codigo_partida?: number;
                        partida_id?: number;
                        id?: number;
                    };

                    const joinedId = maybeId.id_partida ?? maybeId.codigo_partida ?? maybeId.partida_id ?? maybeId.id;
                    if (typeof joinedId === 'number') {
                        return joinedId;
                    }
                }

                return codigoPartida;
            }

            const detail = typeof data === 'object' && data !== null && 'detail' in data
                ? String((data as { detail?: unknown }).detail ?? '')
                : `Error ${response.status}`;

            lastError = detail || `Error ${response.status}`;

            if (response.status === 404 || response.status === 422) {
                continue;
            }

            throw new Error(lastError);
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Error desconocido al unirse a partida';
        }
    }

    throw new Error(lastError);
}