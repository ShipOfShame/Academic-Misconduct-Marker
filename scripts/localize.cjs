const assert=require('node:assert/strict'),crypto=require('node:crypto');
const E=require('../extension/core.js');
const fields=['scope','observation','reason','limitation'];
const text=s=>typeof s==='string'&&s.trim().length>0;
function localize(data,locale){
 assert.equal(locale.locale,'zh-CN');assert.ok(text(locale.notice));
 assert.deepEqual(Object.keys(locale.papers).sort(),data.papers.map(p=>p.id).sort(),'Translation paper coverage differs');
 const result=JSON.parse(JSON.stringify(data));result.notice=locale.notice;
 result.papers=result.papers.map(p=>{
  const t=locale.papers[p.id];assert.equal(t.sourceHash,crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex'),'Stale translation: '+p.id);
  assert.equal(t.findings.length,p.findings.length);
  p.originalTitle=p.title;p.evidenceUrl=`https://github.com/ShipOfShame/Academic-Misconduct-Marker/blob/main/docs/zh/papers/${p.id}.md`;
  p.findings=p.findings.map((f,i)=>{
   const tr=t.findings[i];assert.ok(text(tr.title)&&text(tr.detail));assert.ok(fields.every(k=>text(tr.evidence[k])));assert.equal(tr.evidence.sources.length,f.evidence.sources.length);
   const sources=f.evidence.sources.map((source,j)=>{const ts=tr.evidence.sources[j];assert.ok(text(ts.label)&&text(ts.location));return {...source,label:ts.label,location:ts.location};});
   return {...f,title:tr.title,detail:tr.detail,evidence:{...Object.fromEntries(fields.map(k=>[k,tr.evidence[k]])),sources}};
  });return p;
 });
 return E.validate(result);
}
module.exports={localize};
