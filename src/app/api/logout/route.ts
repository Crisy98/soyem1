import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout exitoso' });
  
  // Eliminar la cookie del token
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    secure: true,
    sameSite: 'strict',
  });

  return response;
}
