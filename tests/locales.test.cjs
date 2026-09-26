const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {localize}=require('../scripts/localize.cjs');
const E=require('../extension/core.js'),B=require('../extension/brand.js');
const data=require('../evidence-database/database.json'),translation=require('../evidence-database/locales/zh-CN.json');
const en=require('../locales/ui.en.json'),zh=require('../locales/ui.zh-CN.json');
test('translation covers the corpus without changing facts, identifiers, status or source URLs',()=>{
 const localized=localize(data,translation);assert.equal(localized.papers.length,data.papers.length);assert.deepEqual(localized.identities,data.identities);
 for(let i=0;i<data.papers.length;i++){
  const p=data.papers[i],q=localized.papers[i];assert.equal(p.id,q.id);assert.deepEqual(p.authors,q.authors);assert.equal(p.url,q.url);assert.equal(q.originalTitle,p.title);assert.equal(q.title,p.title);
  for(let j=0;j<p.findings.length;j++){const f=p.findings[j],g=q.findings[j];assert.equal(f.status,g.status);assert.equal(f.checked,g.checked);assert.equal(f.url,g.url);assert.deepEqual(f.evidence.sources.map(s=>s.url),g.evidence.sources.map(s=>s.url));
   const nums=s=>(s.match(/\d+(?:[.,]\d+)*/g)||[]).sort();assert.deepEqual(nums(f.evidence.observation),nums(g.evidence.observation),'Numeric observations differ: '+p.id);
  }
 }
});
test('missing or stale translations block generation',()=>{
 const changed=structuredClone(data);changed.papers[0].findings[0].detail+=' Changed.';assert.throws(()=>localize(changed,translation),/Stale translation/);
 const missing=structuredClone(translation);delete missing.papers[data.papers[0].id];assert.throws(()=>localize(data,missing),/coverage/);
 const empty=structuredClone(translation);empty.papers[data.papers[0].id].findings[0].evidence.reason='';assert.throws(()=>localize(data,empty));
});
test('runtime locale keys and interpolation placeholders agree',()=>{
 for(const group of ['strings','labels']){assert.deepEqual(Object.keys(en[group]).sort(),Object.keys(zh[group]).sort());for(const key of Object.keys(en[group]))assert.deepEqual((en[group][key].match(/\{\w+\}/g)||[]).sort(),(zh[group][key].match(/\{\w+\}/g)||[]).sort());}
 for(const f of data.papers.flatMap(p=>p.findings))for(const section of E.findingSections(f))assert.ok(zh.sections[section.label]);
});
test('role icons share generated geometry but remain visually distinct, with toolbar PNG sizes',()=>{
 assert.notEqual(B.markerSvg('target'),B.markerSvg('coauthor'));assert.notEqual(B.markerSvg('coauthor'),B.markerSvg('candidate'));
 for(const role of ['target','coauthor','candidate'])assert.equal(fs.readFileSync('extension/icons/marker-'+role+'.svg','utf8'),B.markerSvg(role));
 for(const size of [16,32,48,128]){const png=fs.readFileSync('extension/icons/icon-'+size+'.png');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
 const m=require('../extension/manifest.json');assert.ok(m.content_scripts[0].js.indexOf('brand.js')<m.content_scripts[0].js.indexOf('content.js'));
});
