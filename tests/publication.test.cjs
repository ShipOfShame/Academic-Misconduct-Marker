const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');

test('case coverage includes pending works and rejects incomplete or duplicate denominators',()=>{
 const coverage=require('../scripts/coverage.cjs');
 const data=JSON.parse(fs.readFileSync('evidence-database/database.json'));
 const inventory=JSON.parse(fs.readFileSync('evidence-database/publication-inventory.json'));
 const result=coverage(data,inventory);
 assert.equal(result.total,25);assert.equal(result.active.size,19);assert.equal(result.percentage,76);
 assert.equal(result.pending,4);assert.equal(result.reviewed,21);
 const corrected=structuredClone(data);
 corrected.papers=corrected.papers.filter(p=>p.id!==inventory.papers[0].id);
 assert.equal(coverage(corrected,inventory).percentage,72);
 const unrelated=structuredClone(data);
 unrelated.papers.push({id:'unrelated'});
 assert.equal(coverage(unrelated,inventory).active.size,19);
 const duplicate=structuredClone(inventory);duplicate.papers.push(duplicate.papers[0]);
 assert.throws(()=>coverage(data,duplicate),/unique/);
 const missing=structuredClone(inventory);missing.papers.shift();
 assert.throws(()=>coverage(data,missing),/missing from publication inventory/);
 const stale=structuredClone(inventory);stale.checked='2020-01-01';
 assert.throws(()=>coverage(data,stale),/Refresh the publication inventory/);
});

test('publication validation rejects private paths, private files, and image metadata',()=>{
 const fixtures=[
  ['docs/publication-check.md','/Us'+'ers/example/private/file','Local account'],
  ['docs/.env.publication-check','EXAMPLE=private','Private configuration'],
  ['docs/publication-check.png',Buffer.concat([
   Buffer.from([137,80,78,71,13,10,26,10]),
   Buffer.from([0,0,0,0]),Buffer.from('tEXt'),Buffer.alloc(4)
  ]),'Nonessential image metadata']
 ];
 for(const [file,content,message] of fixtures){
  assert.ok(!fs.existsSync(file));fs.writeFileSync(file,content);
  try{assert.throws(()=>cp.execFileSync(process.execPath,['scripts/validate.cjs'],{stdio:'pipe'}),error=>error.stderr.toString().includes(message));}
  finally{fs.unlinkSync(file);}
 }
});
