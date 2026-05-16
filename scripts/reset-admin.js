const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Delete existing users
  await prisma.user.deleteMany({});
  console.log('Antiguos usuarios eliminados.');

  // Create new admin
  const email = 'admin@groomingpet.com';
  const password = 'AdminGrooming2024!'; // Temporary password
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('====================================');
  console.log('NUEVO PERFIL CREADO');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
