import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (adminExists) {
      return NextResponse.json({ message: 'Já existe um Admin cadastrado!' });
    }

    const passwordHash = await bcrypt.hash('123456', 10); // Senha padrão inicial

    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'suporte@graphixlocacao.com.br',
        passwordHash,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ success: true, message: 'Admin criado com sucesso!', email: admin.email, senhaTemp: '123456' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar admin' }, { status: 500 });
  }
}