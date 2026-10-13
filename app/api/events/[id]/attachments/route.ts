import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';

// GET: Listar anexos do evento
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const eventId = Number(params.id);

    const attachments = await prisma.eventAttachment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Erro ao buscar anexos:', error);
    return NextResponse.json({ error: 'Erro ao buscar anexos.' }, { status: 500 });
  }
}

// POST: Enviar novo arquivo (imagem, planta baixa, PDF)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const eventId = Number(params.id);
    const { fileName, fileType, fileData } = await request.json();

    if (!fileName || !fileData) {
      return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 });
    }

    const newAttachment = await prisma.eventAttachment.create({
      data: {
        eventId,
        fileName,
        fileType,
        fileData,
      },
    });

    return NextResponse.json({ success: true, attachment: newAttachment }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar anexo:', error);
    return NextResponse.json({ error: 'Erro ao salvar anexo.' }, { status: 500 });
  }
}

// DELETE: Excluir um anexo específico
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Pegamos o ID do anexo pela URL (ex: ?attachmentId=5)
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'ID do anexo não fornecido.' }, { status: 400 });
    }

    await prisma.eventAttachment.delete({
      where: { id: Number(attachmentId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir anexo:', error);
    return NextResponse.json({ error: 'Erro ao excluir anexo.' }, { status: 500 });
  }
}