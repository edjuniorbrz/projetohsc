const fs = require('fs');

console.log('Patching prisma/schema.prisma to add cargo column to Gestor...');
const schemaPath = 'prisma/schema.prisma';
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace the Gestor model block to include cargo
const originalGestor = `model Gestor {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  isActive  Boolean   @default(true)`;

const newGestor = `model Gestor {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  cargo     String?
  isActive  Boolean   @default(true)`;

schemaContent = schemaContent.replace(originalGestor, newGestor);

fs.writeFileSync(schemaPath, schemaContent);
console.log('prisma/schema.prisma cargo column added successfully!');
