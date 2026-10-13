import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    // O endpoint é um link único que a Apple/Google cria para aquele celular específico
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;

    // Salva ou atualiza a inscrição no banco
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth },
      create: { userId, endpoint, p256dh, auth },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar subscription:', error);
    return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 });
  }
}