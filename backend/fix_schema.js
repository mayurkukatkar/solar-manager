const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// The goal is to remove `documentTags    DocumentTag[]  @relation("TenantTags")` from User
// and add it to Tenant instead.

// Remove from User (around line 140)
content = content.replace('  documentTags    DocumentTag[]  @relation("TenantTags")\n', '');

// Add to Tenant (around line 65)
// Check if it already exists first
if (!content.includes('  documentTags           DocumentTag[]                   @relation("TenantTags")')) {
    content = content.replace(
        '  documents              Document[]\n  createdAt              DateTime                        @default(now())',
        '  documents              Document[]\n  documentTags           DocumentTag[]                   @relation("TenantTags")\n  createdAt              DateTime                        @default(now())'
    );
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Fixed schema');
