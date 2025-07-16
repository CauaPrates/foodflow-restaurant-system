import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuários
  const adminPassword = await bcrypt.hash('admin123', 10);
  const garcomPassword = await bcrypt.hash('garcom123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: {
      email: 'admin@restaurante.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const garcom = await prisma.user.upsert({
    where: { email: 'garcom@restaurante.com' },
    update: {},
    create: {
      email: 'garcom@restaurante.com',
      name: 'Funcionário',
      password: garcomPassword,
      role: 'GARCOM',
    },
  });

  console.log('✅ Usuários criados:', { admin: admin.email, garcom: garcom.email });

  // Criar mesas
  const mesas = [
    { number: 1, capacity: 2, status: 'AVAILABLE' },
    { number: 2, capacity: 4, status: 'AVAILABLE' },
    { number: 3, capacity: 6, status: 'AVAILABLE' },
    { number: 4, capacity: 2, status: 'AVAILABLE' },
    { number: 5, capacity: 4, status: 'AVAILABLE' },
    { number: 6, capacity: 8, status: 'AVAILABLE' },
    { number: 7, capacity: 2, status: 'AVAILABLE' },
    { number: 8, capacity: 4, status: 'AVAILABLE' },
  ];

  for (const mesa of mesas) {
    await prisma.table.upsert({
      where: { number: mesa.number },
      update: {},
      create: mesa,
    });
  }

  console.log('✅ Mesas criadas');

  // Criar categorias básicas
  const categorias = [
    { name: 'Pratos Principais', description: 'Pratos principais do cardápio' },
    { name: 'Bebidas', description: 'Bebidas diversas' },
    { name: 'Sobremesas', description: 'Sobremesas e doces' },
    { name: 'Entradas', description: 'Entradas e aperitivos' },
  ];

  for (const categoria of categorias) {
    await prisma.category.upsert({
      where: { name: categoria.name },
      update: {},
      create: categoria,
    });
  }

  console.log('✅ Categorias básicas criadas');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });