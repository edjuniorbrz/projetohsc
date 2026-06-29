const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@portal.com';
  const password = 'admin'; // Senha simplificada
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'SUPER_ADMIN' }
    });
    console.log('Senha e role atualizadas com sucesso para:', password);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });
    console.log('Super usuário criado com sucesso com senha:', password);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
