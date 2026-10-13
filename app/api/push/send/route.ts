import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/prisma';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contato@seusite.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(request: Request) {
  try {
    const { title, body, userIds } = await request.json();

    if (!title || !body || !userIds || userIds.length === 0) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    // Busca as inscrições dos técnicos que foram selecionados
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'Nenhum celular registrado para os técnicos selecionados.' }, { status: 200 });
    }

    // Dispara a notificação para cada celular
    const payload = JSON.stringify({ title, body, url: '/calendar' });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          console.error(`Erro ao enviar para ${sub.endpoint}:`, error);
          // Se o usuário bloqueou a notificação ou desinstalou, a gente limpa do banco
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      })
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro geral ao enviar push:', error);
    return NextResponse.json({ error: 'Erro ao processar envio.' }, { status: 500 });
  }
}