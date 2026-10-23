"""Build an allowlisted release; never include .env, keys, logs or other projects."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
target = root / 'cloudbusters-release.zip'
files = [root / 'package.json', root / 'package-lock.json']
for folder in ('server', 'public', 'scripts', 'tests'):
    files.extend(p for p in (root / folder).rglob('*') if p.is_file())
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for path in files:
        if path.name.startswith('.env') or path.suffix in ('.pem', '.key', '.zip', '.pyc'):
            continue
        archive.write(path, path.relative_to(root).as_posix())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert not any('.env' in p or p.endswith(('.pem', '.key')) for p in archive.namelist())
print(f'{target.name}: {target.stat().st_size} bytes; archive integrity and secret-file exclusions passed')
