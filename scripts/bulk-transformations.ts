import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Dynamic resolution of the source folder
let SOURCE_DIR = "./fotos_masivas";
if (!fs.existsSync(SOURCE_DIR) && fs.existsSync("./FOTOS PORTAFOLIO")) {
  SOURCE_DIR = "./FOTOS PORTAFOLIO";
}

const DEST_DIR = "./public/uploads/transformations";

// Array of 35 popular, high-fidelity and natural dog names
const DOG_NAMES = [
  "Max", "Luna", "Charlie", "Bella", "Rocky", "Daisy", "Cooper", "Bailey", 
  "Lola", "Buddy", "Toby", "Milo", "Sophie", "Jack", "Lucy", "Oliver", 
  "Chloe", "Teddy", "Lily", "Bentley", "Maggie", "Zeus", "Coco", "Duke", 
  "Sadie", "Winston", "Bear", "Ruby", "Oscar", "Penny", "Gizmo", "Mia", 
  "Leo", "Stella", "Nala"
];

interface DogGroup {
  id: string;
  antes?: string;
  despues?: string;
  documentacion?: string;
}

async function main() {
  console.log(`🚀 Iniciando proceso de carga masiva de transformaciones desde '${SOURCE_DIR}'...`);

  // Ensure source folder exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`⚠️ La carpeta de origen '${SOURCE_DIR}' no existe.`);
    console.log(`💡 Creando la carpeta '${SOURCE_DIR}' e inyectando archivos de demostración de prueba...`);
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
    
    // 1x1 px transparent GIF content
    const dummyImage = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    
    // Perro 1: Full data (antes + despues + documentacion)
    fs.writeFileSync(path.join(SOURCE_DIR, "perro1-antes.jpg"), dummyImage);
    fs.writeFileSync(path.join(SOURCE_DIR, "perro1-despues.jpg"), dummyImage);
    fs.writeFileSync(path.join(SOURCE_DIR, "perro1-documentacion.png"), dummyImage);
    
    // Perro 2: Optional missing documentation (antes + despues)
    fs.writeFileSync(path.join(SOURCE_DIR, "perro2-antes.png"), dummyImage);
    fs.writeFileSync(path.join(SOURCE_DIR, "perro2-despues.png"), dummyImage);
    
    // Perro 3: Full data with alternative extensions (antes + despues + documentacion)
    fs.writeFileSync(path.join(SOURCE_DIR, "perro3-antes.jpeg"), dummyImage);
    fs.writeFileSync(path.join(SOURCE_DIR, "perro3-despues.jpeg"), dummyImage);
    fs.writeFileSync(path.join(SOURCE_DIR, "perro3-documento.jpg"), dummyImage);
    
    console.log("✅ Archivos de prueba creados exitosamente en ./fotos_masivas.");
  }

  // Ensure destination directory exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SOURCE_DIR);
  const groups: { [key: string]: DogGroup } = {};

  // Regex to extract dog ID, type (antes|despues|documentacion|documento), and extension
  const filenameRegex = /^perro(\d+)-(antes|despues|documentacion|documento)\.(jpg|jpeg|png)$/i;

  for (const file of files) {
    const match = file.match(filenameRegex);
    if (!match) continue;

    const dogId = match[1];
    const type = match[2].toLowerCase(); // antes | despues | documentacion | documento

    if (!groups[dogId]) {
      groups[dogId] = { id: dogId };
    }

    if (type === "antes") {
      groups[dogId].antes = file;
    } else if (type === "despues") {
      groups[dogId].despues = file;
    } else if (type === "documentacion" || type === "documento") {
      groups[dogId].documentacion = file;
    }
  }

  const validGroups = Object.values(groups).filter(g => g.antes && g.despues);

  if (validGroups.length === 0) {
    console.log("⚠️ No se encontraron grupos de fotos válidos (deben contener tanto 'antes' como 'despues').");
    return;
  }

  console.log(`📦 Encontrados ${validGroups.length} grupos válidos listos para procesar.`);

  let processedCount = 0;

  for (const g of validGroups) {
    const uuid = crypto.randomUUID();

    const beforeExt = path.extname(g.antes!).toLowerCase();
    const afterExt = path.extname(g.despues!).toLowerCase();
    const docExt = g.documentacion ? path.extname(g.documentacion).toLowerCase() : "";

    const beforeDestName = `${uuid}-antes${beforeExt}`;
    const afterDestName = `${uuid}-despues${afterExt}`;
    const docDestName = g.documentacion ? `${uuid}-doc${docExt}` : null;

    // Copy files securely to public folder
    fs.copyFileSync(
      path.join(SOURCE_DIR, g.antes!),
      path.join(DEST_DIR, beforeDestName)
    );
    fs.copyFileSync(
      path.join(SOURCE_DIR, g.despues!),
      path.join(DEST_DIR, afterDestName)
    );

    if (g.documentacion && docDestName) {
      fs.copyFileSync(
        path.join(SOURCE_DIR, g.documentacion),
        path.join(DEST_DIR, docDestName)
      );
    }

    // Select random pet name
    const randomName = DOG_NAMES[Math.floor(Math.random() * DOG_NAMES.length)];

    // Map public urls
    const beforePhotoUrl = `/uploads/transformations/${beforeDestName}`;
    const afterPhotoUrl = `/uploads/transformations/${afterDestName}`;
    const contractImage = docDestName ? `/uploads/transformations/${docDestName}` : null;

    // Insert record in Database via Prisma
    await prisma.transformation.create({
      data: {
        petName: randomName,
        breed: "Raza por definir",
        age: Math.floor(Math.random() * 10) + 1, // Random age between 1 and 10 years
        serviceDate: new Date(),
        beforePhotoUrl,
        afterPhotoUrl,
        contractImage,
        technicalDescriptionEs: "Descripción pendiente",
        technicalDescriptionEn: "Description pending",
        visible: true
      }
    });

    processedCount++;
    console.log(
      `✅ Perro ${g.id} (${randomName}) procesado. (${g.documentacion ? "Con documento" : "Sin documento"})`
    );
  }

  console.log(`\n🎉 ¡Carga masiva finalizada con éxito! Se inyectaron ${processedCount} registros.`);
}

main()
  .catch((e) => {
    console.error("❌ Error durante la ejecución del script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
