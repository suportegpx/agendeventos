import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';

// POST: Criar novo evento e escalar técnicos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, clientName, location, startDatetime, endDatetime, setupStartDatetime, notes, staffIds } = body;

    if (!title || !location || !startDatetime || !endDatetime) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios do evento.' }, { status: 400 });
    }

    let client = null;
    if (clientName) {
      client = await prisma.client.create({
        data: { companyName: clientName },
      });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        clientId: client ? client.id : null,
        location,
        startDatetime: new Date(startDatetime),
        endDatetime: new Date(endDatetime),
        setupStartDatetime: setupStartDatetime ? new Date(setupStartDatetime) : null,
        notes,
      },
    });

    if (staffIds && staffIds.length > 0) {
      for (const userId of staffIds) {
        await prisma.eventStaff.create({
          data: {
            eventId: newEvent.id,
            userId: Number(userId),
            assignedRole: 'Técnico Escalado',
          },
        });
      }
    }

    return NextResponse.json({ success: true, eventId: newEvent.id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno ao criar evento.' }, { status: 500 });
  }
}

// PUT: Atualizar evento existente e redefinir equipe escalada
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, clientName, location, startDatetime, endDatetime, setupStartDatetime, notes, staffIds, status } = body;

    if (!id || !title || !location || !startDatetime || !endDatetime) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes para atualização.' }, { status: 400 });
    }

    let clientId = undefined;
    if (clientName) {
      const client = await prisma.client.create({
        data: { companyName: clientName },
      });
      clientId = client.id;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        title,
        ...(clientId && { clientId }),
        location,
        startDatetime: new Date(startDatetime),
        endDatetime: new Date(endDatetime),
        setupStartDatetime: setupStartDatetime ? new Date(setupStartDatetime) : null,
        notes,
        ...(status && { status }),
      },
    });

    if (staffIds) {
      await prisma.eventStaff.deleteMany({
        where: { eventId: Number(id) },
      });

      for (const userId of staffIds) {
        await prisma.eventStaff.create({
          data: {
            eventId: Number(id),
            userId: Number(userId),
            assignedRole: 'Técnico Escalado',
          },
        });
      }
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar evento.' }, { status: 500 });
  }
}

// GET: Listar todos os eventos com os técnicos escalados
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    let events;

    if (role === 'TECNICO' && userId) {
      const assignments = await prisma.eventStaff.findMany({
        where: { userId: Number(userId) },
        select: { eventId: true },
      });
      const eventIds = assignments.map((a) => a.eventId);

      events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        include: {
          client: true,
          staffAssignments: {
            include: { user: { select: { id: true, name: true, role: true } } },
          },
          comments: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { startDatetime: 'asc' },
      });
    } else {
      events = await prisma.event.findMany({
        include: {
          client: true,
          staffAssignments: {
            include: { user: { select: { id: true, name: true, role: true } } },
          },
          comments: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { startDatetime: 'asc' },
      });
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: 'Erro ao buscar eventos.' }, { status: 500 });
  }
}
// DELETE: Excluir evento inteiro
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do evento não fornecido.' }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return NextResponse.json({ error: 'Erro ao excluir evento.' }, { status: 500 });
  }
}