const fs = require('fs');

console.log('Patching prisma/schema.prisma...');
const schemaPath = 'prisma/schema.prisma';
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// 1. Update User model to add gestorRelation and gestorId
const originalUserFields = `  isActive  Boolean   @default(true)
  projects  Project[]
  tasks     Task[]
  createdAt DateTime  @default(now())`;

const newUserFields = `  isActive  Boolean   @default(true)
  projects  Project[]
  tasks     Task[]
  gestorId  String?
  gestor    Gestor?   @relation(fields: [gestorId], references: [id])
  createdAt DateTime  @default(now())`;

schemaContent = schemaContent.replace(originalUserFields, newUserFields);

// 2. Update Project model to add gestorRelation and gestorId
const originalProjectFields = `  owner       User     @relation(fields: [ownerId], references: [id])
  tasks       Task[]
  createdAt   DateTime @default(now())`;

const newProjectFields = `  owner       User     @relation(fields: [ownerId], references: [id])
  tasks       Task[]
  gestorId    String?
  gestor      Gestor?  @relation(fields: [gestorId], references: [id])
  createdAt   DateTime @default(now())`;

schemaContent = schemaContent.replace(originalProjectFields, newProjectFields);

// 3. Add Gestor model at the end
const gestorModel = `
model Gestor {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  isActive  Boolean   @default(true)
  users     User[]
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
`;

if (!schemaContent.includes('model Gestor')) {
  schemaContent += gestorModel;
}

fs.writeFileSync(schemaPath, schemaContent);
console.log('prisma/schema.prisma patched successfully!');
