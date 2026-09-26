const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const E=require('../extension/core.js'),data=E.validate(JSON.parse(fs.readFileSync('evidence-database/database.json')));
const pkg=require('../package.json'),m=require('../extension/manifest.json');
assert.equal(pkg.version,m.version,'Manifest/package versions differ');
assert.deepEqual(m.permissions,['storage'],'Review new permissions explicitly');
assert.equal(data.inclusionPolicy,'documented-open-issues','Published data must use the active issue policy');
assert.ok(data.identities.every(r=>r.paperIds.length),'Orphan identities must not remain in the published dataset');
const names=new Set(data.papers.flatMap(p=>p.authors));
for(const name of names)assert.ok(data.identities.some(r=>r.name===name),'Missing audit: '+name);
for(const r of data.identities){assert.ok(['verified','supported','unresolved'].includes(r.verificationStatus));assert.ok(r.verificationNote);}
for(const p of data.papers)assert.equal(p.evidenceUrl,`https://github.com/ShipOfShame/Academic-Misconduct-Marker/blob/main/evidence-database/papers/${p.id}.md`);
const localPath=/(?:\/(?:Users|home)\/[^/\s]+\/|\/var\/folders\/|\/opt\/homebrew\/|[A-Z]:\\Users\\)/i;
const pngChunks=new Set(['IHDR','PLTE','IDAT','IEND','tRNS','sRGB','gAMA','cHRM']);
function checkPng(file){
 const bytes=fs.readFileSync(file);assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid PNG: '+file);
 let pos=8,ended=false;
 while(pos<bytes.length){
  assert.ok(pos+12<=bytes.length,'Truncated PNG: '+file);
  const length=bytes.readUInt32BE(pos),kind=bytes.toString('ascii',pos+4,pos+8);
  assert.ok(pngChunks.has(kind),'Nonessential image metadata: '+file);
  assert.ok(pos+length+12<=bytes.length,'Truncated PNG: '+file);
  pos+=length+12;if(kind==='IEND'){ended=true;break;}
 }
 assert.ok(ended&&pos===bytes.length,'Unexpected PNG trailing data: '+file);
}
const ignored=new Set(['.git','node_modules','dist','test-results','playwright-report']);
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(e.name))continue;const p=path.join(dir,e.name);
 assert.ok(!e.isSymbolicLink(),'Publication input is a symbolic link: '+p);
 assert.ok(!/^(?:\.env(?:\..*)?|\.DS_Store|\.npmrc)$/.test(e.name)&&!/[.](?:pem|key)$/.test(e.name),'Private configuration file: '+p);
 if(e.isDirectory())walk(p);else if(/\.png$/.test(p))checkPng(p);else if(/\.(md|json|js|cjs|html|css|yml|yaml|py|svg|txt)$/.test(p)){
 const text=fs.readFileSync(p,'utf8');
 assert.ok(!localPath.test(text),'Local account or environment path: '+p);
 const localized=(p.startsWith('docs/assets/')&&p.endsWith('-zh-CN.svg'))||p==='README.zh-CN.md'||p.startsWith('docs/zh/')||p==='evidence-database/locales/zh-CN.json'||/^locales\/.*zh-CN\.json$/.test(p)||p==='docs/i18n/zh-CN.js';
 const languageLink=String.fromCodePoint(0x7b80,0x4f53,0x4e2d,0x6587);
 const englishText=['README.md','docs/index.html','site/index.en.html'].includes(p)?text.split(languageLink).join(''):text;
 if(!localized)assert.ok(!/\p{Script=Han}/u.test(englishText),'Chinese text outside a dedicated locale: '+p);
 assert.ok(!/(gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(text),'Possible credential: '+p);
 if(/\.md$/.test(p))for(const link of text.matchAll(/\]\(([^)]+)\)/g)){const to=link[1];if(/^(https?:|#|mailto:)/.test(to))continue;assert.ok(fs.existsSync(path.resolve(path.dirname(p),to.split('#')[0])),'Broken local documentation link: '+p+' -> '+to);}
}}}
walk('.');
cp.execFileSync(process.execPath,['scripts/generate.cjs','--check'],{stdio:'inherit'});
console.log(`Validated ${data.papers.length} papers, ${data.identities.length} identity records, separate language content, links, permission scope, and publication metadata.`);
