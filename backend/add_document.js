const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

content = content.replace(
  'checklistTemplates     InstallationChecklistTemplate[]\n',
  'checklistTemplates     InstallationChecklistTemplate[]\n  documents              Document[]\n'
);

content = content.replace(
  'projectsOwned   Project[]       @relation("ProjectOwner")\n}',
  'projectsOwned   Project[]       @relation("ProjectOwner")\n  documents       Document[]\n}'
);

content += `
// ----------------------------------------------------
// 12. DOCUMENTS
// ----------------------------------------------------
model Document {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  title       String
  description String?
  fileUrl     String
  fileType    String?
  fileSize    Int?
  
  entityType  String?
  entityId    String?
  
  uploadedBy  String?
  user        User?    @relation(fields: [uploadedBy], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`;

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema updated successfully');
