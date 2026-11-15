// aiot-toolkit can log build errors but exit 0. Validate the output, not just its exit code.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-vela-build-'));
const stage = path.join(temp, 'app');
const cert = path.join(root, 'sign/debug/certificate.pem');
const key = path.join(root, 'sign/debug/private.pem');
function run(exe, args, cwd) {
  const result = cp.spawnSync(exe, args, {cwd, stdio: 'inherit', timeout: 60000});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('Command failed: ' + exe);
}
function cleanup(dir) {
  const resolved = path.resolve(dir);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('codex-vela-build-')) {
    throw Error('Refuse to remove unverified temporary path');
  }
  fs.rmSync(resolved, {recursive: true, force: true});
}
try {
  // Generate a new project-local development identity, never use toolkit's shared default certificate.
  if (fs.existsSync(key) !== fs.existsSync(cert)) throw Error('Incomplete signing identity: keep existing files and investigate');
  if (!fs.existsSync(key)) {
    const dir = path.dirname(cert); fs.mkdirSync(dir, {recursive: true});
    const config = path.join(temp, 'openssl.cnf');
    fs.writeFileSync(config, '[req]\ndistinguished_name=dn\nprompt=no\n[dn]\nCN=CodexQuickTodoLocalDev\n');
    const openssl = process.env.OPENSSL_BIN || 'C:\\Users\\86137\\miniforge3\\Library\\bin\\openssl.exe';
    run(openssl, ['req', '-config', config, '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-x509', '-days', '3650',
      '-out', cert, '-subj', '/CN=CodexQuickTodoLocalDev'], root);
  }
  fs.mkdirSync(stage);
  fs.cpSync(path.join(root, 'src'), path.join(stage, 'src'), {recursive: true});
  fs.copyFileSync(path.join(root, 'package.json'), path.join(stage, 'package.json'));
  fs.cpSync(path.join(root, 'sign/debug'), path.join(stage, 'sign/debug'), {recursive: true});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  run(process.execPath, [path.join(root, 'tools/compile_vela.cjs')], stage);
  const dist = path.join(stage, 'dist');
  const packs = fs.existsSync(dist) ? fs.readdirSync(dist).filter(n => n.endsWith('.rpk')) : [];
  if (packs.length !== 1) throw Error('No unique RPK produced; toolkit exit status alone is not sufficient');
  run(process.env.PYTHON_BIN || 'python', [path.join(root, 'tools/inspect_package.py'), path.join(dist, packs[0])], root);
  fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
  const target = path.join(root, 'dist', packs[0]); fs.copyFileSync(path.join(dist, packs[0]), target);
  const metadata = {package: packs[0], sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),
    node: process.version, toolkit: '2.0.5', jsc: '1.0.10', builtAt: new Date().toISOString(),
    certificateSha256: new crypto.X509Certificate(fs.readFileSync(cert)).fingerprint256};
  fs.writeFileSync(path.join(root, 'dist/build-info.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log('Verified package:', target);
} catch (e) {
  console.error(e.message); process.exitCode = 1;
} finally { cleanup(temp); }
