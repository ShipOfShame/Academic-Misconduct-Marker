"""Create a repeatable, allowlisted ZIP and SHA-256 checksum (Python stdlib)."""
import json,hashlib,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'extension/manifest.json').read_text())['version']
out=root/'dist';out.mkdir(exist_ok=True)
archive=out/f'academic-misconduct-marker-v{version}.zip'
allowed={'LICENSE','brand.js','manifest.json','core.js','content.js','evidence.json','evidence.html','evidence-page.js','options.html','popup.html','ui.js','ui.css','README.md'}
allowed.update({'icons/icon.svg', 'icons/marker-target.svg', 'icons/marker-coauthor.svg'})
allowed.update(f'icons/icon-{size}.png' for size in (16,32,48,128))
files=[root/'extension'/name for name in sorted(allowed)]
if any(not p.is_file() or p.is_symlink() for p in files):
 raise SystemExit('Release input is missing or is a symbolic link.')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(files):
  info=zipfile.ZipInfo('extension/'+p.relative_to(root/'extension').as_posix(),date_time=(2020,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.create_system=0;info.external_attr=0x20
  z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert set(z.namelist()) == {"extension/"+name for name in allowed}
 assert all(i.create_system == 0 and not i.extra and not i.comment and i.date_time == (2020,1,1,0,0,0) for i in z.infolist())
 assert json.loads(z.read('extension/manifest.json'))['version']==version
checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/(archive.name+'.sha256')).write_text(checksum+'  '+archive.name+'\n')
print(archive.name,checksum)
