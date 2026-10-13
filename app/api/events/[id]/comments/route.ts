import { NextResponse } from 'next/server';
import { prisma } from '@/prisma'; // ou '@/lib/prisma' dependendo da sua pasta

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const eventId = Number(params.id);
    const { userId, comment } = await request.json();

    if (!userId || !comment) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const newComment = await prisma.eventComment.create({
      data: {
        eventId,
        userId,
        comment,
      },
    });

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar comentário:', error);
    return NextResponse.json({ error: 'Erro ao salvar comentário.' }, { status: 500 });
  }
}

// DELETE: Excluir um comentário específico
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'ID do comentário não fornecido.' }, { status: 400 });
    }

    await prisma.eventComment.delete({
      where: { id: Number(commentId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    return NextResponse.json({ error: 'Erro ao excluir comentário.' }, { status: 500 });
  }
}