import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const eventId = Number(params.id);
    const { userId, comment } = await request.json();

    if (!userId || !comment) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const newComment = await prisma.eventComment.create({
      data: {
        eventId,
        userId: Number(userId),
        comment,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar comentário:', error);
    return NextResponse.json({ error: 'Erro ao salvar comentário.' }, { status: 500 });
  }
}