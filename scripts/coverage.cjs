const assert=require('node:assert/strict');

module.exports=(data,inventory)=>{
 const identity=data.identities.find(r=>r.id===inventory.identityId);
 assert.ok(identity,'Publication inventory needs a known identity');
 assert.equal(inventory.checked,data.updated,'Refresh the publication inventory for the database snapshot');
 assert.ok(inventory.sources.length&&inventory.sources.every(s=>s.label&&s.url.startsWith('https://')),'Inventory sources are required');
 const ids=new Set(inventory.papers.map(p=>p.id));
 assert.ok(ids.size>0&&ids.size===inventory.papers.length,'Publication inventory IDs must be unique');
 assert.ok(inventory.papers.every(p=>p.title&&p.url.startsWith('https://')&&typeof p.reviewed==='boolean'),'Incomplete publication inventory');
 const active=new Set(data.papers.filter(p=>identity.paperIds.includes(p.id)).map(p=>p.id));
 for(const id of active){
  assert.ok(ids.has(id),'Recorded paper missing from publication inventory: '+id);
  assert.ok(inventory.papers.find(p=>p.id===id).reviewed,'Recorded paper must be reviewed: '+id);
 }
 return {active,total:ids.size,reviewed:inventory.papers.filter(p=>p.reviewed).length,
  pending:inventory.papers.filter(p=>!p.reviewed).length,percentage:Number((100*active.size/ids.size).toFixed(1))};
};
