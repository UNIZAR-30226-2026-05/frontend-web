import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('jwt')?.value;

    if (!token) {
        return NextResponse.json({ detail: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json({ token }, { status: 200 });
}
