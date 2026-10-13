import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import bcrypt from 'bcryptjs';

// POST: Criar novo usuário (Apenas Admin deve ter acesso a esta rota no front)
export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    // Verifica se o email já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    // Criptografa a senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria o usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role, // ADMIN, COMERCIAL ou TECNICO
      },
    });

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro interno ao criar usuário.' }, { status: 500 });
  }
}

// GET: Listar usuários (útil para o painel do Admin e para o comercial ver a lista de técnicos)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}