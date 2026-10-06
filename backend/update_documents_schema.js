const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Find where Document model starts and remove it
const docStart = content.indexOf('// 12. DOCUMENTS');
if (docStart !== -1) {
  content = content.substring(0, docStart);
}

const newModels = `
// ----------------------------------------------------
// 12. DOCUMENTS MODULE
// ----------------------------------------------------
enum DocumentStatus {
  MISSING
  PENDING_UPLOAD
  UPLOADED
  UNDER_REVIEW
  VERIFIED
  REJECTED
  EXPIRED
  ARCHIVED
}

model DocumentType {
  id                    String   @id @default(uuid())
  tenantId              String
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name                  String
  category              String
  isRequired            Boolean  @default(false)
  isExpiryRequired      Boolean  @default(false)
  applicableProjectType String?
  
  documents             Document[]
  requests              DocumentRequest[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Document {
  id             String   @id @default(uuid())
  tenantId       String
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  documentTypeId String?
  documentType   DocumentType? @relation(fields: [documentTypeId], references: [id])
  
  title          String
  description    String?
  category       String?
  
  fileUrl        String?
  fileType       String?
  fileSize       Int?
  storageKey     String?
  
  status         DocumentStatus @default(PENDING_UPLOAD)
  version        Int            @default(1)
  
  documentDate   DateTime?
  expiryDate     DateTime?
  
  entityType     String?
  entityId       String?
  
  customerId     String?
  customer       Customer? @relation(fields: [customerId], references: [id])
  
  projectId      String?
  project        Project?  @relation(fields: [projectId], references: [id])
  
  uploadedBy     String?
  user           User?     @relation(fields: [uploadedBy], references: [id])
  
  versions       DocumentVersion[]
  activities     DocumentActivity[]
  tags           DocumentTagRelation[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model DocumentVersion {
  id             String   @id @default(uuid())
  documentId     String
  document       Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  versionNumber  Int
  fileUrl        String
  fileType       String?
  fileSize       Int?
  storageKey     String?
  
  uploadedBy     String?
  createdAt      DateTime @default(now())
}

model DocumentRequest {
  id             String   @id @default(uuid())
  tenantId       String
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id])
  
  customerId     String?
  customer       Customer? @relation(fields: [customerId], references: [id])
  
  projectId      String?
  project        Project?  @relation(fields: [projectId], references: [id])
  
  requestedBy    String?
  dueDate        DateTime?
  status         String    @default("PENDING") // PENDING, FULFILLED
  message        String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model DocumentActivity {
  id             String   @id @default(uuid())
  documentId     String
  document       Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  userId         String?
  action         String
  metadata       Json?
  
  createdAt      DateTime @default(now())
}

model DocumentTag {
  id             String   @id @default(uuid())
  tenantId       String
  tenant         Tenant   @relation("TenantTags", fields: [tenantId], references: [id], onDelete: Cascade)
  name           String
  
  documents      DocumentTagRelation[]
}

model DocumentTagRelation {
  documentId     String
  document       Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  tagId          String
  tag            DocumentTag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([documentId, tagId])
}
`;

// Add tags to Tenant if not present
if (!content.includes('documentTags')) {
  content = content.replace('documents       Document[]\n}', 'documents       Document[]\n  documentTags    DocumentTag[]  @relation("TenantTags")\n}');
}

fs.writeFileSync('prisma/schema.prisma', content + newModels);
console.log('Advanced models added successfully');
