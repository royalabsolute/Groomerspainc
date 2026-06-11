const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO CONFIGURACIÓN DE USUARIO MAESTRO ===");

  // 1. Eliminar TODOS los usuarios existentes
  const deleteResult = await prisma.user.deleteMany();
  console.log(`Se eliminaron ${deleteResult.count} usuarios existentes de la base de datos.`);

  // 2. Encriptar la contraseña maestra "Mega1321@"
  const plainPassword = "Mega1321@";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 3. Crear el único usuario maestro
  const masterUser = await prisma.user.create({
    data: {
      email: 'srjaggeroff@gmail.com',
      name: 'Master User',
      password: hashedPassword,
      role: 'ADMIN_GENERAL' // Se mantiene en el esquema por compatibilidad
    }
  });

  console.log(`Usuario maestro creado con éxito: ${masterUser.email}`);
  console.log("=== PROCESO COMPLETADO ===");
}

main()
  .catch((e) => {
    console.error("Error al configurar el usuario maestro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
