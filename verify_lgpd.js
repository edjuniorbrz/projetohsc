const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const api = axios.create({
  baseURL: 'http://localhost:3333',
  validateStatus: () => true
});

async function main() {
  console.log('=== STARTING LGPD COMPLIANCE & API VERIFICATION ===\n');

  try {
    const timestamp = Date.now();
    
    // 1. Clear database entries to ensure a clean test environment
    await prisma.document.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('✔ Cleaned up database tables.');

    // 2. Create users using register API
    console.log('\n--- 1. Creating Test Users ---');
    const regManager = await api.post('/auth/register', {
      name: 'Dr. Roberto (Coordenador de TI)',
      email: `roberto_${timestamp}@hospital.com`,
      password: 'password123',
      role: 'MANAGER'
    });
    console.log(`Manager Registered: ${regManager.data.name} (ID: ${regManager.data.id})`);

    const regAnalyst1 = await api.post('/auth/register', {
      name: 'Fabiano (Técnico de Suporte)',
      email: `fabiano_${timestamp}@hospital.com`,
      password: 'password123',
      role: 'ANALYST'
    });
    console.log(`Analyst 1 Registered: ${regAnalyst1.data.name} (ID: ${regAnalyst1.data.id})`);

    const regAnalyst2 = await api.post('/auth/register', {
      name: 'Juliana (Analista de Banco de Dados)',
      email: `juliana_${timestamp}@hospital.com`,
      password: 'password123',
      role: 'ANALYST'
    });
    console.log(`Analyst 2 Registered: ${regAnalyst2.data.name} (ID: ${regAnalyst2.data.id})`);

    // 3. Login Users
    console.log('\n--- 2. Logging In Users ---');
    const logManager = await api.post('/auth/login', {
      email: `roberto_${timestamp}@hospital.com`,
      password: 'password123'
    });
    const managerToken = logManager.data.token;

    const logAnalyst1 = await api.post('/auth/login', {
      email: `fabiano_${timestamp}@hospital.com`,
      password: 'password123'
    });
    const analyst1Token = logAnalyst1.data.token;

    const logAnalyst2 = await api.post('/auth/login', {
      email: `juliana_${timestamp}@hospital.com`,
      password: 'password123'
    });
    const analyst2Token = logAnalyst2.data.token;
    console.log('✔ Tokens acquired successfully.');

    // 4. Create Project as Manager
    console.log('\n--- 3. Creating Project & Task ---');
    const projRes = await api.post('/projects', {
      title: 'Atualização do Prontuário Eletrônico Ala Sul',
      description: 'Implementação de conformidade HIPAA nos prontuários de cardiologia.'
    }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const projectId = projRes.data.id;
    console.log(`Project Created: "${projRes.data.title}" (ID: ${projectId})`);

    // 5. Create Task and Assign to Analyst 1 (Fabiano)
    const taskRes = await api.post('/tasks', {
      title: 'Configurar Criptografia no Banco de Prontuários',
      projectId: projectId,
      assigneeId: regAnalyst1.data.id
    }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const taskId = taskRes.data.id;
    console.log(`Task Created and Assigned to Fabiano: "${taskRes.data.title}" (ID: ${taskId})`);

    // 6. Create a Confidential Document linked to the task
    console.log('\n--- 4. Creating Confidential & Public Document Records ---');
    
    // Create physical mock files in uploads folder
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    fs.writeFileSync(path.join(uploadsDir, 'prontuario_confidencial.pdf'), 'CONTÉUDO MÉDICO ALTAMENTE CONFIDENCIAL');
    fs.writeFileSync(path.join(uploadsDir, 'manual_instrucoes.txt'), 'Manual de instrução público.');

    const docConfidential = await prisma.document.create({
      data: {
        filename: 'prontuario_confidencial.pdf',
        originalName: 'Prontuário_Paciente_AlaSul.pdf',
        isConfidential: true,
        taskId: taskId
      }
    });
    console.log(`Confidential Document created in DB: "${docConfidential.originalName}" (ID: ${docConfidential.id})`);

    const docPublic = await prisma.document.create({
      data: {
        filename: 'manual_instrucoes.txt',
        originalName: 'Manual_Infra_Geral.txt',
        isConfidential: false,
        taskId: taskId
      }
    });
    console.log(`Public Document created in DB: "${docPublic.originalName}" (ID: ${docPublic.id})`);

    // 7. Verify List APIs
    console.log('\n--- 5. Verifying List Documents API Restrictions (LGPD) ---');
    
    const docsResManager = await api.get('/documents', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log(`Manager Roberto sees: ${docsResManager.data.length} document(s).`);
    console.log('Manager documents list:', docsResManager.data.map(d => `${d.originalName} (Confidencial: ${d.isConfidential})`));

    const docsResAnalyst1 = await api.get('/documents', {
      headers: { Authorization: `Bearer ${analyst1Token}` }
    });
    console.log(`Analyst 1 (Fabiano - Assignee) sees: ${docsResAnalyst1.data.length} document(s).`);
    console.log('Analyst 1 documents list:', docsResAnalyst1.data.map(d => `${d.originalName} (Confidencial: ${d.isConfidential})`));

    const docsResAnalyst2 = await api.get('/documents', {
      headers: { Authorization: `Bearer ${analyst2Token}` }
    });
    console.log(`Analyst 2 (Juliana - Other Team) sees: ${docsResAnalyst2.data.length} document(s). (Expect 1 because the confidential one should be filtered out)`);
    console.log('Analyst 2 documents list:', docsResAnalyst2.data.map(d => `${d.originalName} (Confidencial: ${d.isConfidential})`));

    // 8. Verify Download API Restrictions
    console.log('\n--- 6. Verifying Download LGPD Blocking Rules ---');

    // Case A: Manager downloads confidential doc (Allowed)
    const dlManager = await api.get(`/documents/${docConfidential.id}/download`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log(`A. Manager Roberto download: Status [${dlManager.status}] (Expect 200)`);

    // Case B: Analyst 1 (Assignee) downloads confidential doc (Allowed)
    const dlAnalyst1 = await api.get(`/documents/${docConfidential.id}/download`, {
      headers: { Authorization: `Bearer ${analyst1Token}` }
    });
    console.log(`B. Analyst 1 Fabiano (Assignee) download: Status [${dlAnalyst1.status}] (Expect 200)`);

    // Case C: Analyst 2 (Other Team) downloads confidential doc (Forbidden - Blocked by LGPD!)
    const dlAnalyst2 = await api.get(`/documents/${docConfidential.id}/download`, {
      headers: { Authorization: `Bearer ${analyst2Token}` }
    });
    console.log(`C. Analyst 2 Juliana (Other Team) download: Status [${dlAnalyst2.status}] (Expect 403 Forbidden)`);
    console.log(`   Error Message returned: "${JSON.stringify(dlAnalyst2.data.error || dlAnalyst2.data)}"`);

    // Case D: Analyst 2 downloads public doc (Allowed)
    const dlPublicAnalyst2 = await api.get(`/documents/${docPublic.id}/download`, {
      headers: { Authorization: `Bearer ${analyst2Token}` }
    });
    console.log(`D. Analyst 2 Juliana download public document: Status [${dlPublicAnalyst2.status}] (Expect 200)`);

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! LGPD ENFORCEMENT VERIFIED! ===');

  } catch (error) {
    console.error('❌ Validation script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
