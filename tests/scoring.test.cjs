const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../docs/scoring.js');
const corpus=require('../evidence-database/database.json');
function paper(id,statuses,extra={}){return {id,title:'Paper '+id,authors:['Example Author'],findings:statuses.map(status=>({status,checked:'2026-09-26'})),...extra};}
test('distinct open types count once; corrected and neutral records contribute zero',()=>{
 const result=R.score(paper('1',['reporting_error','reporting_error','implementation_error','material_gap','needs_clarification','corrected','no_confirmed_issue']));
 assert.equal(result.points,8);assert.equal(result.maximum,8);assert.equal(result.parts.length,3);
 assert.equal(R.score(paper('2',['corrected','no_confirmed_issue'])).points,0);
});
test('correcting a finding removes its points without masking other open findings',()=>{
 const p=paper('1',['reporting_error','material_gap']);assert.equal(R.score(p).points,5);
 p.findings[0].status='corrected';assert.equal(R.score(p).points,2);
});
test('invalid custom inputs use defaults; zero weights disable scoring',()=>{
 assert.deepEqual(R.weights({reporting_error:NaN,implementation_error:-1,material_gap:6,needs_clarification:0.5}),R.defaults);
 assert.equal(R.weights({reporting_error:'5'}).reporting_error,3);
 assert.equal(R.weights({reporting_error:5}).reporting_error,5);
 const zero=Object.fromEntries(Object.keys(R.defaults).map(key=>[key,0]));
 assert.deepEqual(R.score(paper('1',['material_gap']),zero),{points:0,maximum:0,parts:[{key:'material_gap',label:R.labels.material_gap,points:0}]});
});
test('search and finding filters compose; stable sorting never mutates the input',()=>{
 const rows=[paper('2',['reporting_error']),paper('1',['reporting_error']),paper('3',['material_gap'],{title:'A special paper'})];
 assert.deepEqual(R.select(rows).map(p=>p.id),['1','2','3']);
 assert.deepEqual(rows.map(p=>p.id),['2','1','3']);
 assert.deepEqual(R.select(rows,{query:' EXAMPLE ',status:'material_gap'}).map(p=>p.id),['3']);
 assert.equal(R.select(rows,{query:'missing'}).length,0);
 assert.equal(R.select(rows,{sort:'title'})[0].id,'3');
 rows[0].findings[0].checked='2026-09-27';assert.equal(R.select(rows,{sort:'checked'})[0].id,'2');
});
test('published corpus uses known statuses; original findings are not changed by scoring',()=>{
 const before=JSON.stringify(corpus);
 for(const p of corpus.papers){for(const f of p.findings)assert.ok(Object.hasOwn(R.labels,f.status));const s=R.score(p);assert.ok(s.points>=0&&s.points<=8);}
 assert.equal(R.score(corpus.papers.find(p=>p.id==='2506.24124')).points,5);
 assert.equal(R.score(corpus.papers.find(p=>p.id==='2601.21347')).points,R.defaults.implementation_error);
 assert.ok(!Object.hasOwn(R.defaults,'needs_clarification'));
 assert.equal(JSON.stringify(corpus),before);
});
