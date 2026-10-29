import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webClientDir = path.resolve(__dirname, '..');

test('Centralized UI Primitives existence and exports in web-client/src/components/ui', async (t) => {
  const uiDir = path.join(webClientDir, 'src', 'components', 'ui');
  assert.ok(fs.existsSync(uiDir), 'components/ui directory must exist');

  const requiredFiles = [
    'Button.tsx',
    'Input.tsx',
    'Select.tsx',
    'Modal.tsx',
    'Table.tsx',
    'Badge.tsx',
    'Card.tsx',
    'Toast.tsx',
    'EmptyState.tsx',
    'Skeleton.tsx',
    'index.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(uiDir, file);
    assert.ok(fs.existsSync(filePath), `File ${file} must exist in components/ui`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.length > 50, `File ${file} must not be empty`);
  }

  // Verify index.ts re-exports all primitives
  const indexContent = fs.readFileSync(path.join(uiDir, 'index.ts'), 'utf8');
  assert.match(indexContent, /export \* from '\.\/Button';/);
  assert.match(indexContent, /export \* from '\.\/Input';/);
  assert.match(indexContent, /export \* from '\.\/Select';/);
  assert.match(indexContent, /export \* from '\.\/Modal';/);
  assert.match(indexContent, /export \* from '\.\/Table';/);
  assert.match(indexContent, /export \* from '\.\/Badge';/);
  assert.match(indexContent, /export \* from '\.\/Card';/);
  assert.match(indexContent, /export \* from '\.\/Toast';/);
  assert.match(indexContent, /export \* from '\.\/EmptyState';/);
  assert.match(indexContent, /export \* from '\.\/Skeleton';/);
});

test('Button primitive specifications and double-click prevention', (t) => {
  const buttonFile = path.join(webClientDir, 'src', 'components', 'ui', 'Button.tsx');
  const content = fs.readFileSync(buttonFile, 'utf8');

  // Verify variants
  assert.match(content, /primary:/);
  assert.match(content, /secondary:/);
  assert.match(content, /outline:/);
  assert.match(content, /ghost:/);
  assert.match(content, /danger:/);

  // Verify sizes
  assert.match(content, /sm:/);
  assert.match(content, /md:/);
  assert.match(content, /lg:/);

  // Verify double-click prevention
  assert.match(content, /const isDisabled = disabled \|\| isLoading;/);
  assert.match(content, /disabled=\{isDisabled\}/);
  assert.match(content, /aria-busy=\{isLoading\}/);
});

test('Modal primitive accessibility, Escape key, and backdrop click', (t) => {
  const modalFile = path.join(webClientDir, 'src', 'components', 'ui', 'Modal.tsx');
  const content = fs.readFileSync(modalFile, 'utf8');

  assert.match(content, /role="dialog"/);
  assert.match(content, /aria-modal="true"/);
  assert.match(content, /document\.body\.style\.overflow = 'hidden'/); // Scroll lock
  assert.match(content, /e\.key === 'Escape'/); // Escape key dismissal
  assert.match(content, /closeOnBackdrop \? onClose : undefined/); // Backdrop click
});

test('ToastContext notification system specifications', (t) => {
  const contextFile = path.join(webClientDir, 'src', 'context', 'ToastContext.tsx');
  const content = fs.readFileSync(contextFile, 'utf8');

  assert.match(content, /type ToastType = 'success' \| 'error' \| 'warning' \| 'info'/);
  assert.match(content, /duration \?\? 3000/); // Default 3s auto-dismiss
  assert.match(content, /role="alert"/);
  assert.match(content, /aria-live="assertive"/);
  assert.match(content, /dismissToast\(id\)/);
});

test('404 Route Resolution verification', (t) => {
  const routes = [
    'src/app/tenant/installation/schedule/page.tsx',
    'src/app/tenant/installation/calendar/page.tsx',
    'src/app/tenant/installation/checklists/page.tsx',
    'src/app/tenant/inventory/products/new/page.tsx',
    'src/app/tenant/quotations/new/page.tsx',
    'src/app/super-admin/security/page.tsx',
    'src/app/super-admin/profile/page.tsx',
  ];

  for (const r of routes) {
    const fullPath = path.join(webClientDir, r);
    assert.ok(fs.existsSync(fullPath), `Resolved route page ${r} must exist`);
  }
});

test('Zero native alert() invocations in target refactored modules', (t) => {
  const targetFiles = [
    'src/app/tenant/finance/page.tsx',
    'src/app/tenant/surveys/page.tsx',
    'src/app/tenant/tasks/page.tsx',
    'src/app/tenant/projects/[id]/page.tsx',
  ];

  for (const f of targetFiles) {
    const fullPath = path.join(webClientDir, f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const alertMatches = content.match(/\balert\s*\(/g);
    assert.equal(alertMatches, null, `Target file ${f} must not contain any native alert() calls`);
  }
});

test('Responsive form grids in leads and surveys modals', (t) => {
  const leadsFile = path.join(webClientDir, 'src', 'app', 'tenant', 'leads', 'page.tsx');
  const leadsContent = fs.readFileSync(leadsFile, 'utf8');

  // Verify responsive sm:grid-cols-2 replaces rigid grid-cols-2 in modals
  assert.match(leadsContent, /grid grid-cols-1 sm:grid-cols-2 gap-4/);

  const surveysFile = path.join(webClientDir, 'src', 'app', 'tenant', 'surveys', 'page.tsx');
  const surveysContent = fs.readFileSync(surveysFile, 'utf8');
  assert.match(surveysContent, /grid grid-cols-1 sm:grid-cols-2 gap-3/);
});

test('Strict TypeScript configuration in next.config.ts', (t) => {
  const nextConfigFile = path.join(webClientDir, 'next.config.ts');
  const content = fs.readFileSync(nextConfigFile, 'utf8');

  assert.doesNotMatch(content, /ignoreBuildErrors:\s*true/, 'ignoreBuildErrors must be completely removed');
});
