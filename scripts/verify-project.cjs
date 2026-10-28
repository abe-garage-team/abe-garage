const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

if (!process.execArgv.includes('--experimental-vm-modules')) {
  const result = spawnSync(
    process.execPath,
    ['--experimental-vm-modules', '--no-warnings', __filename],
    { stdio: 'inherit', windowsHide: true },
  );
  process.exit(result.status ?? 1);
}
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = [];
const issues = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.npm-cache', '.git', 'dist', 'coverage'].includes(item.name)) continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else files.push(file);
  }
}
walk(root);
let imports = 0,
  syntaxChecks = 0;
for (const file of files) {
  const relative = path.relative(root, file);
  if (!/\.(js|jsx|cjs|json)$/.test(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    try {
      JSON.parse(source);
    } catch (error) {
      issues.push(relative + ': ' + error.message);
    }
    continue;
  }
  for (const match of source.matchAll(/(?:from\s+|import\s*\(|import\s+)(['"])(\.[^'"]+)\1/g)) {
    imports++;
    if (!fs.existsSync(path.resolve(path.dirname(file), match[2])))
      issues.push(relative + ': missing import ' + match[2]);
  }
  if (!file.endsWith('.jsx')) {
    syntaxChecks++;
    try {
      if (file.endsWith('.cjs')) new vm.Script(source, { filename: file });
      else new vm.SourceTextModule(source, { identifier: file });
    } catch (error) {
      issues.push(relative + ': ' + error.message);
    }
  }
}
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/scaffold-manifest.json'), 'utf8'),
);
const contracts = JSON.parse(fs.readFileSync(path.join(root, 'docs/api/contracts.json'), 'utf8'));
const contractByTaskId = new Map();
for (const contract of contracts.endpoints) {
  if (contractByTaskId.has(contract.task_id))
    issues.push('Duplicate task ID in contracts.json: ' + contract.task_id);
  contractByTaskId.set(contract.task_id, contract);
}
const entry = fs.readFileSync(path.join(root, manifest.routing.entry), 'utf8');
const main = fs.readFileSync(path.join(root, manifest.routing.main), 'utf8');
if ([...entry.matchAll(/app\.use\(['"]\/api['"]\s*,\s*mainRouter\)/g)].length !== 1)
  issues.push('Entry point must mount mainRouter once at /api');
for (const mount of manifest.routing.mounts) {
  if (!fs.existsSync(path.join(root, 'backend/src/api', mount.file)))
    issues.push('Missing route file ' + mount.file);
  if (!new RegExp('mainRouter\\.use\\([\'"]' + mount.prefix + '[\'"]').test(main))
    issues.push('Missing resource mount ' + mount.prefix);
}
for (const endpoint of manifest.endpoints) {
  const composed =
    '/api' +
    (endpoint.mount_prefix === '/' ? '' : endpoint.mount_prefix) +
    (endpoint.local_path === '/' ? '' : endpoint.local_path);
  if (composed !== endpoint.path) issues.push('Contract path mismatch: ' + endpoint.task_id);
  const contract = contractByTaskId.get(endpoint.task_id);
  if (!contract) {
    issues.push('Missing contract fixture for ' + endpoint.task_id);
  } else if (contract.path !== endpoint.path || contract.method !== endpoint.method) {
    issues.push('Manifest differs from contract fixture: ' + endpoint.task_id);
  }
}
const manifestTaskIds = new Set(manifest.endpoints.map((endpoint) => endpoint.task_id));
for (const contract of contracts.endpoints) {
  if (!manifestTaskIds.has(contract.task_id))
    issues.push('Contract fixture missing from scaffold manifest: ' + contract.task_id);
}
for (const page of manifest.frontend_pages) {
  if (
    !fs.existsSync(
      path.join(root, 'frontend/src/features', page.feature, 'pages', page.component + '.jsx'),
    )
  )
    issues.push('Missing retained page ' + page.component);
}
const schema = fs.readFileSync(path.join(root, 'backend/db/schema.sql'), 'utf8');
if ([...schema.matchAll(/CREATE TABLE /g)].length !== 14)
  issues.push('Expected 14 normalized tables');
const triggerCount = [...schema.matchAll(/CREATE TRIGGER /g)].length;
const triggerTerminators = [...schema.matchAll(/^END\$\$$/gm)].length;
if (triggerCount !== triggerTerminators)
  issues.push('Every database trigger must terminate with END$$');
console.log(
  JSON.stringify(
    {
      files: files.length,
      route_mounts: manifest.routing.mounts.length,
      planned_endpoints: manifest.endpoints.length,
      contract_fixtures: contracts.endpoints.length,
      retained_pages: manifest.frontend_pages.length,
      imports_checked: imports,
      javascript_syntax_checks: syntaxChecks,
      issues,
    },
    null,
    2,
  ),
);
if (issues.length) process.exitCode = 1;
