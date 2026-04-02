import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const username = cookieStore.get('username')?.value;
    const token = cookieStore.get('jwt')?.value;

    if (!username || !token) {
        return NextResponse.json({ detail: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json({ username, token }, { status: 200 });
}
