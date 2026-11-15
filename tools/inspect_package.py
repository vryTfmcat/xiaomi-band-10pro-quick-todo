"""Inspect actual RPK payload. This is a package check, not a device-runtime test."""
import json
import sys
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
source_manifest = json.loads((root / 'src/manifest.json').read_text(encoding='utf-8'))
packages = [Path(sys.argv[1])] if len(sys.argv) > 1 else list((root / 'dist').glob('*.' + source_manifest['versionName'] + '.rpk'))
if len(packages) != 1:
    raise SystemExit('Expected exactly one RPK')
with ZipFile(packages[0]) as archive:
    if archive.testzip() is not None:
        raise SystemExit('Invalid ZIP CRC')
    names = archive.namelist()
    assert not any('private' in n.lower() or n.endswith('.pem') or 'node_modules' in n for n in names), 'Unexpected private/build input'
    assert 'app.jsc' in names, names
    assert 'pages/index/index.jsc' in names, names
    assert not any(n.endswith('.js') for n in names), names
    manifest = json.loads(archive.read('manifest.json'))
    assert manifest['package'] == 'com.local.codex.quicktodo'
    source_manifest = json.loads((root / 'src/manifest.json').read_text(encoding='utf-8'))
    assert manifest['versionName'] == source_manifest['versionName']
    assert manifest['features'] == source_manifest['features']
    assert manifest['router']['entry'] == 'pages/index'
    assert 'common/icon.png' in names
    print(json.dumps({'package': manifest['package'], 'files': names, 'size': packages[0].stat().st_size}, ensure_ascii=False))
