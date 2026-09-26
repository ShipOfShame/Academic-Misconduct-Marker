const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const root=path.resolve(__dirname,'..','extension');
const E=require('../extension/core.js');
const data=JSON.parse(fs.readFileSync(path.join(root,'evidence.json')));
const clone=()=>JSON.parse(JSON.stringify(data));
const wait=()=>new Promise(r=>setTimeout(r,230));
async function page(html,url='https://arxiv.org/abs/2508.18264'){
  const {document,window}=parseHTML('<!doctype html><html><body>'+html+'</body></html>');
  let storage={},onChange,mutation;
  const chrome={storage:{local:{get:async()=>storage},onChanged:{addListener:fn=>onChange=fn}},runtime:{getURL:p=> 'https://extension.test/'+p}};
  const ctx=vm.createContext({document,location:new URL(url),chrome,URL,console,setTimeout,clearTimeout,fetch:async()=>({json:async()=>clone()}),NodeFilter:{SHOW_TEXT:4},MutationObserver:class{constructor(fn){mutation=fn;}observe(){}disconnect(){}}});
  vm.runInContext(fs.readFileSync(path.join(root,'core.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'brand.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'content.js'),'utf8'),ctx);
  await wait();
  return {document,window,buttons:()=>[...document.querySelectorAll('[data-se-badge]')].map(h=>h.shadowRoot.querySelector('button')),change:async s=>{storage={...storage,...s};onChange(Object.fromEntries(Object.keys(s).map(k=>[k,{}])),'local');await wait();},mutate:async()=>{mutation();await wait();}};
}
test('seed data validates, includes nineteen issue papers and sixty-five full author names',()=>{assert.equal(E.validate(data),data);assert.equal(data.papers.length,19);assert.equal(new Set(data.papers.flatMap(p=>p.authors)).size,65);});
test('arxiv identity requires trusted host and handles PDF/version forms',()=>{assert.equal(E.arxivId('https://arxiv.org/pdf/2508.18264v2.pdf'),'2508.18264');assert.equal(E.arxivId('https://arxiv.org.evil.test/abs/2508.18264'),null);});
test('unknown paper ID overrides a coincidentally identical title',()=>{assert.equal(E.paperFor(data,data.papers[0].title,['https://arxiv.org/abs/1234.12345']),null);});
test('matching an author on an unknown paper stays a name candidate',()=>{assert.equal(E.authorFor(data,'Sixun Dong').confirmed,false);assert.equal(E.authorFor(data,'S Dong').confirmed,false);assert.equal(E.authorFor(data,'Juhua Hu').role,'coauthor');assert.equal(E.authorFor(data,'Not An Author'),null);});
test('coauthor relationship never inherits target status',()=>{const p=data.papers[1];assert.equal(E.authorFor(data,'Juhua Hu',p).role,'coauthor');assert.equal(E.authorFor(data,'Juhua Hu',p).confirmed,true);});
test('imports reject script links, unknown status, duplicate papers and inconsistent IDs',()=>{for(const change of [d=>d.papers[0].findings[0].url='javascript:alert(1)',d=>d.papers[0].findings[0].status='fraud',d=>d.papers.push(d.papers[0]),d=>d.papers[0].url='https://arxiv.org/abs/1234.12345']){const d=clone();change(d);assert.throws(()=>E.validate(d));}});
test('arxiv marks target and coauthor; evidence opens; disable removes every marker',async()=>{const p=await page('<h1 class="title">MMTok</h1><div class="authors"><a>Sixun Dong</a>, <a>Juhua Hu</a>, <a>Unknown</a></div>');assert.equal(p.buttons().length,3);assert.ok(p.buttons().some(b=>b.textContent==='Under review'));assert.ok(p.buttons().some(b=>b.textContent==='Associated coauthor'));p.buttons()[0].click();const panel=p.document.querySelector('[data-se-panel]');assert.ok(panel);assert.match(panel.shadowRoot.querySelector('section').textContent,/Reporting discrepancy/);await p.change({enabled:false});assert.equal(p.buttons().length,0);assert.equal(p.document.querySelector('[data-se-panel]'),null);});
test('dynamic changes clear stale identity tags and do not duplicate markers',async()=>{const p=await page('<h1 class="title">MMTok</h1><div class="authors"><a>Sixun Dong</a></div>');await p.mutate();assert.equal(p.buttons().length,2);p.document.querySelector('.authors a').textContent='Someone Else';await p.mutate();assert.equal(p.buttons().length,1);});
test('coauthor toggle keeps the target with only open issue records',async()=>{const p=await page('<h1 class="title">MMTok</h1><div class="authors"><a>Sixun Dong</a><a>Juhua Hu</a></div>');await p.change({showCoauthors:false});assert.equal(p.buttons().length,2);assert.ok(data.papers.every(p=>p.findings.every(f=>E.openIssueStatuses.includes(f.status))));assert.ok(!data.papers.some(p=>p.findings.some(f=>f.status==='no_confirmed_issue')));});
test('arxiv search author links use each result context',async()=>{const p=await page('<li class="arxiv-result"><p><a href="https://arxiv.org/abs/2508.18264">arXiv:2508.18264</a></p><p class="title">MMTok</p><p class="authors"><a>Sixun Dong</a>, <a>Juhua Hu</a></p></li>','https://arxiv.org/search/?query=MMTok');assert.equal(p.buttons().length,3);assert.ok(p.buttons().some(b=>b.textContent==='Associated coauthor'));});
test('imported markup is rendered as text rather than executable DOM',async()=>{const d=clone();d.papers[1].findings[0].title='<img src=x onerror=alert(1)>';const p=await page('<h1 class="title">MMTok</h1>');await p.change({evidence:d});p.buttons()[0].click();const shadow=p.document.querySelector('[data-se-panel]').shadowRoot;assert.equal(shadow.querySelector('img'),null);assert.match(shadow.querySelector('section').textContent,/<img/);});
test('author logos preserve accessible identity and evidence interaction',async()=>{const p=await page('<div class="authors"><a>Sixun Dong</a><a>Juhua Hu</a></div>');const [red,orange]=p.buttons();assert.ok(red.classList.contains('target'));assert.ok(orange.classList.contains('coauthor'));for(const b of [red,orange]){assert.ok(b.querySelector('svg'));assert.equal(b.querySelector('svg').getAttribute('aria-hidden'),'true');assert.ok(b.getAttribute('aria-label').includes('open evidence'));assert.ok(b.getRootNode().querySelector('.hovercard'));assert.equal(b.title,'');b.click();assert.ok(p.document.querySelector('[data-se-panel]'));}});

test('Scholar restored: exact profile confirmed, different ID conflicts, plain names remain candidates',async()=>{
 const real=await page('<div id="gsc_prf_in">Sixun Dong</div>','https://scholar.google.com/citations?user=j71Y2-4AAAAJ');assert.ok(real.buttons()[0].classList.contains('target'));
 const other=await page('<div id="gsc_prf_in">Sixun Dong</div>','https://scholar.google.com/citations?user=anotherID');assert.equal(other.buttons()[0].textContent,'Identity conflict');
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));assert.ok(m.content_scripts[0].matches.includes('https://scholar.google.com/*'));
});
test('Scholar results restore author abbreviations and toggles',async()=>{const authors='S Dong, J Hu - ICLR, 2026';const p=await page('<div class="gs_r"><h3 class="gs_rt"><a href="https://arxiv.org/abs/2508.18264">MMTok</a></h3><div class="gs_a">'+authors+'</div></div>','https://scholar.google.com/scholar?q=mmtok');assert.equal(p.buttons().length,3);await p.change({enabled:false});assert.equal(p.document.querySelector('.gs_a').textContent,authors);});
test('ORCID format, checksum, hostile URL and conflicting identifiers',()=>{
 assert.equal(E.orcidId('https://orcid.org/0000-0002-1825-0097'),'0000-0002-1825-0097');assert.equal(E.orcidId('0000-0002-1825-0098'),null);assert.equal(E.orcidId('https://orcid.org.evil.test/0000-0002-1825-0097'),null);
 const d=clone();d.identities[0].orcids=['0000-0002-1825-0097'];E.validate(d);
 assert.equal(E.authorFor(d,'Sixun Dong',null,{orcid:'0000-0002-1825-0097'}).identityLevel,'identifier');
 assert.equal(E.authorFor(d,'Sixun Dong',d.papers[0],{scholarUrl:'https://scholar.google.com/citations?user=j71Y2-4AAAAJ',orcid:'0000-0001-5109-3700'}).identityLevel,'conflict');
});
test('affiliation or two other coauthors support but do not confirm identity',()=>{
 const a=E.authorFor(data,'Sixun Dong',null,{affiliations:['University of Central Florida']});assert.equal(a.identityLevel,'supported');assert.equal(a.confirmed,false);
 assert.equal(E.authorFor(data,'Sixun Dong',null,{coauthors:['Wei Fan','Teresa Wu']}).identityLevel,'supported');
 assert.equal(E.authorFor(data,'Sixun Dong',null,{coauthors:['Sixun Dong','Wei Fan','Wei Fan']}).identityLevel,'name');
});
test('same-name identities are separate and duplicate persistent IDs are rejected',()=>{
 const d=clone();const second={...d.identities[0],id:'different-person',scholarIds:['otherProfile'],orcids:[],paperIds:[]};d.identities.push(second);E.validate(d);
 assert.equal(E.authorFor(d,'Sixun Dong').identityLevel,'ambiguous');
 assert.equal(E.authorFor(d,'Sixun Dong',null,{scholarUrl:'https://scholar.google.com/citations?user=j71Y2-4AAAAJ'}).identityId,'sixun-dong-ironieser');
 assert.equal(E.authorFor(d,'Sixun Dong',null,{scholarUrl:'https://scholar.google.com/citations?user=otherProfile'}),null);
 second.scholarIds=['j71Y2-4AAAAJ'];assert.throws(()=>E.validate(d));
 const bad=clone();bad.identities[0].sources=['javascript:alert(1)'];assert.throws(()=>E.validate(bad));
});
test('new publication-linked identities require matching identifiers on unknown papers',()=>{
 const tao=E.authorFor(data,'Tao Zhe',null,{orcid:'0000-0003-4942-9775'});
 assert.equal(tao.identityLevel,'identifier');assert.equal(tao.role,'coauthor');
 assert.equal(E.authorFor(data,'Tao Zhe',null,{orcid:'0000-0001-5294-5776'}).identityLevel,'conflict');
 const bai=E.authorFor(data,'Haoyue Bai',null,{orcid:'0009-0009-1328-9230'});
 assert.equal(bai.identityVerified,true);assert.equal(bai.role,'coauthor');
 for(const name of ['Cong Wei','Xing Xie']){
  assert.equal(E.authorFor(data,name).confirmed,false);
  assert.equal(E.authorFor(data,name,null,{scholarUrl:'https://scholar.google.com/citations?user=unknownID'}).confirmed,false);
 }
});
test('ORCID extraction stays within one author container',async()=>{
 const d=clone();d.identities[0].orcids=['0000-0002-1825-0097'];
 const p=await page('<div class="ltx_personname">Sixun Dong<a href="https://orcid.org/0000-0002-1825-0097"></a></div><div class="ltx_personname">Juhua Hu</div>','https://arxiv.org/html/1234.12345');await p.change({evidence:d});assert.ok(p.buttons()[0].classList.contains('target'));assert.equal(p.buttons().length,1);
});

test('all 64 active coauthors have individual audit provenance and unresolved IDs are withheld',()=>{
 const names=new Set(data.papers.flatMap(p=>p.authors));names.delete('Sixun Dong');
 const rows=data.identities.filter(r=>names.has(r.name));
 assert.equal(rows.length,64);assert.equal(new Set(rows.map(r=>r.name)).size,64);
 assert.deepEqual(['verified','supported','unresolved'].map(s=>rows.filter(r=>r.verificationStatus===s).length),[48,11,5]);
 for(const r of rows){assert.ok(r.verificationNote.length>30);assert.ok(r.sources.length);if(r.verificationStatus!=='verified')assert.equal(r.scholarIds.length+r.orcids.length,0);}
 const d=clone();d.identities.find(r=>r.name==='Steven Li').scholarIds=['unprovenID'];assert.throws(()=>E.validate(d));
});
test('recorded bylines do not upgrade unresolved personal identities',()=>{
 const p=data.papers.find(p=>p.id==='2604.04929');
 const unresolved=E.authorFor(data,'Steven Li',p);assert.equal(unresolved.confirmed,true);assert.equal(unresolved.identityVerified,false);assert.equal(unresolved.verificationStatus,'unresolved');
 const known=E.authorFor(data,'Juhua Hu',p);assert.equal(known.identityVerified,true);
 const stranger=E.authorFor(data,'Juhua Hu');assert.equal(stranger.identityVerified,false);assert.equal(stranger.confirmed,false);
 const legacy=clone();legacy.identities=[];assert.equal(E.authorFor(legacy,'Juhua Hu',p).verificationStatus,'not_audited');
});
test('curated coauthor IDs confirm only the linked person and reject known homonyms',()=>{
 const known=E.authorFor(data,'Zibo Zhao',null,{scholarUrl:'https://scholar.google.com/citations?user=x3EgqesAAAAJ'});
 assert.equal(known.identityVerified,true);assert.equal(known.role,'coauthor');
 const wrong=E.authorFor(data,'Zibo Zhao',null,{scholarUrl:'https://scholar.google.com/citations?user=z7ephOIAAAAJ'});assert.equal(wrong.identityLevel,'conflict');assert.equal(wrong.identityVerified,false);
 assert.ok(!data.identities.some(r=>r.orcids.includes('0000-0001-8203-9723')||r.orcids.includes('0000-0002-1390-0708')));
 const orcid=E.authorFor(data,'Haoyun Deng',null,{orcid:'0000-0001-6611-3938'});assert.equal(orcid.identityVerified,true);assert.equal(orcid.role,'coauthor');
});
test('unverified coauthors receive no marker on recorded arxiv papers or Scholar profiles',async()=>{
 const pending=data.identities.filter(r=>r.verificationStatus!=='verified');assert.equal(pending.length,16);
 for(const r of pending){
  const paper=data.papers.find(p=>r.paperIds.includes(p.id));
  const p=await page('<div class="authors"><a>'+r.name+'</a></div>','https://arxiv.org/abs/'+paper.id);
  assert.equal(p.buttons().length,0,r.name);assert.equal(p.document.querySelector('.authors').textContent,r.name);
 }
 const scholar=await page('<div id="gsc_prf_in">Steven Li</div>','https://scholar.google.com/citations?user=unknownID');
 assert.equal(scholar.buttons().length,0);
 const authors='S Li, S Dong - 2026';
 const result=await page('<div class="gs_r"><h3 class="gs_rt"><a href="https://arxiv.org/abs/2604.04929">Rethinking Model Efficiency</a></h3><div class="gs_a">'+authors+'</div></div>','https://scholar.google.com/scholar?q=efficiency');
 assert.equal(result.buttons().filter(b=>b.classList.contains('coauthor')||b.classList.contains('candidate')).length,0);
 assert.equal(result.document.querySelector('.gs_a').textContent.replace('Under review',''),authors);
});
test('coauthor markers require both a verified identity and a matching page; downgrades remove old markers',async()=>{
 const unknown=await page('<div class="authors"><a>Juhua Hu</a></div>','https://arxiv.org/abs/1234.12345');assert.equal(unknown.buttons().length,0);
 const exact=await page('<div id="gsc_prf_in">Zibo Zhao</div>','https://scholar.google.com/citations?user=x3EgqesAAAAJ');assert.equal(exact.buttons().length,1);assert.ok(exact.buttons()[0].classList.contains('coauthor'));
 const conflict=await page('<div id="gsc_prf_in">Zibo Zhao</div>','https://scholar.google.com/citations?user=z7ephOIAAAAJ');assert.equal(conflict.buttons().length,0);
 const p=await page('<div class="authors"><a>Juhua Hu</a></div>');assert.equal(p.buttons().length,1);
 const d=clone(),r=d.identities.find(r=>r.name==='Juhua Hu');r.verificationStatus='supported';r.scholarIds=[];r.orcids=[];
 await p.change({evidence:d});assert.equal(p.buttons().length,0);assert.equal(p.document.querySelector('[data-se-panel]'),null);
});

test('hover cards are compact, contain paper and evidence links, and dismiss with Escape',async()=>{
 const p=await page('<div class="authors"><a>Sixun Dong</a><a>Juhua Hu</a></div>');
 for(const b of p.buttons()){
  const shadow=b.getRootNode(),card=shadow.querySelector('.hovercard');assert.ok(card.hidden);
  shadow.host.dispatchEvent(new p.window.Event('mouseenter'));assert.equal(card.hidden,false);
  assert.ok(card.querySelectorAll('a').length>=2);assert.match(card.textContent,/suspected|Suspected/);
  assert.doesNotMatch(card.textContent,/Individual identity audit/);
  const event=new p.window.Event('keydown',{bubbles:true});Object.defineProperty(event,'key',{value:'Escape'});shadow.host.dispatchEvent(event);assert.equal(card.hidden,true);
 }
 const d=clone();d.papers[1].evidenceUrl='https://github.com/example/evidence/blob/main/papers/2508.18264.md';E.validate(d);await p.change({evidence:d});
 const card=p.buttons().find(b=>b.classList.contains('coauthor')).getRootNode().querySelector('.hovercard');
 assert.ok([...card.querySelectorAll('a')].some(a=>a.href===d.papers[1].evidenceUrl));
 d.papers[1].evidenceUrl='javascript:alert(1)';assert.throws(()=>E.validate(d));
});

test('bundled evidence page loads the requested paper and keeps unknown IDs isolated',async()=>{
 const {document}=parseHTML('<html><body><p id="notice"></p><div id="record"></div></body></html>');let changed;
 const location={hash:'#2508.18264'};
 const ctx=vm.createContext({document,location,URL,addEventListener:(_,fn)=>changed=fn,chrome:{storage:{local:{get:async()=>({})}},runtime:{getURL:p=>'https://extension.test/'+p}},fetch:async()=>({json:async()=>clone()})});
 vm.runInContext(fs.readFileSync(path.join(root,'core.js'),'utf8'),ctx);
 await vm.runInContext(fs.readFileSync(path.join(root,'evidence-page.js'),'utf8'),ctx);
 assert.match(document.querySelector('h2').textContent,/MMTok/);assert.equal(document.querySelector('#record a').href,data.papers[1].url);
 location.hash='#9999.99999';await changed();assert.match(document.querySelector('#record').textContent,/No evidence record found/);assert.equal(document.querySelector('h2'),null);
});


test('active catalogue rejects clarification-only, no-issue and fully corrected papers',()=>{
 for(const status of ['needs_clarification','no_confirmed_issue','corrected']){
  const d=clone();d.papers[1].findings.forEach(f=>f.status=status);assert.throws(()=>E.validate(d),/documented open issue/);
 }
 const mixed=clone();mixed.papers[0].findings[0].status='corrected';assert.throws(()=>E.validate(mixed),/documented open issues/);
 const legacy=clone();delete legacy.inclusionPolicy;legacy.papers[1].findings[0].status='no_confirmed_issue';assert.equal(E.validate(legacy),legacy);
});
test('detailed evidence is mandatory and unsafe or incomplete source locators are rejected',()=>{
 for(const change of [d=>delete d.papers[0].findings[0].evidence,d=>d.papers[0].findings[0].evidence.reason='',d=>d.papers[0].findings[0].evidence.sources=[],d=>d.papers[0].findings[0].evidence.sources[0].url='javascript:alert(1)',d=>delete d.papers[0].findings[0].evidence.sources[0].location]){const d=clone();change(d);assert.throws(()=>E.validate(d));}
});
test('removed papers and orphan identities cannot supply active paper or author records',()=>{
 for(const id of ['2505.15076','2508.15760']){
  assert.equal(E.paperFor(data,'',['https://arxiv.org/abs/'+id]),null);
  assert.ok(!data.identities.some(r=>r.paperIds.includes(id)));
 }
 const removed=clone();removed.papers=removed.papers.filter(p=>p.id!=='2609.07720');
 for(const identity of removed.identities)identity.paperIds=identity.paperIds.filter(id=>id!=='2609.07720');
 removed.identities=removed.identities.filter(identity=>identity.paperIds.length);
 assert.equal(E.validate(removed),removed);
 assert.equal(E.paperFor(removed,'',['https://arxiv.org/abs/2609.07720']),null);
 for(const name of ['Raine Ma','Jiaben Chen'])assert.equal(E.authorFor(removed,name),null);
});
test('full evidence panel shows rationale and locators and renders imported evidence as text',async()=>{
 const d=clone();d.papers[1].findings[0].evidence.reason='<img src=x onerror=alert(1)>';
 const p=await page('<h1 class="title">MMTok</h1>');await p.change({evidence:d});p.buttons()[0].click();
 const panel=p.document.querySelector('[data-se-panel]').shadowRoot;
 assert.match(panel.querySelector('section').textContent,/Reason for flagging/);assert.match(panel.querySelector('section').textContent,/Table 21/);
 assert.match(panel.querySelector('section').textContent,/<img/);assert.equal(panel.querySelector('img'),null);
});

const profileRow=(byline,title='A paper outside the issue database')=>'<div class="gsc_a_tr"><a class="gsc_a_at">'+title+'</a><div class="gs_gray">'+byline+'</div></div>';
test('verified Scholar owner remains marked on unlisted papers, with only existing evidence',async()=>{
 const p=await page('<div id="gsc_prf_in">Sixun Dong</div>'+profileRow('N Gong*, S Dong*, H Bai','Agentic Feature Augmentation: Unifying Selection and Generation with Teaming, Planning, and Memories')+profileRow('M Yin, S Dong, M Zhang','LiveMCP-101: Stress Testing and Diagnosing MCP-enabled Agents on Challenging Queries'),'https://scholar.google.com/citations?user=j71Y2-4AAAAJ&hl=zh-CN');
 assert.equal(p.buttons().length,3);assert.ok(p.buttons().every(b=>b.classList.contains('target')));
 const card=p.buttons()[0].getRootNode().querySelector('.hovercard');
 assert.ok(card.querySelectorAll('a').length);assert.ok(!card.textContent.includes('LiveMCP-101'));
 p.document.body.insertAdjacentHTML('beforeend',profileRow('Sixun Dong, Steven Li'));
 await p.mutate();assert.equal(p.buttons().length,4);await p.mutate();assert.equal(p.buttons().length,4);
 await p.change({enabled:false});assert.equal(p.buttons().length,0);assert.equal(p.document.querySelectorAll('[data-se-author]').length,0);
});
test('verified coauthor profile owner is marked on other papers without lending identity to others',async()=>{
 const p=await page('<div id="gsc_prf_in">Zibo Zhao</div>'+profileRow('Z Zhao, S Dong, Steven Li'),'https://scholar.google.com/citations?user=x3EgqesAAAAJ');
 assert.equal(p.buttons().filter(b=>b.classList.contains('coauthor')).length,2);
 assert.equal(p.buttons().filter(b=>b.classList.contains('target')).length,0);
 assert.ok(p.buttons().some(b=>b.textContent==='Identity unverified'));
 await p.change({showCoauthors:false});assert.equal(p.buttons().length,1);
});
test('wrong Scholar ID or heading cannot confirm an unlisted byline',async()=>{
 for(const [heading,id] of [['Sixun Dong','anotherID'],['Someone Else','j71Y2-4AAAAJ']]){
  const p=await page('<div id="gsc_prf_in">'+heading+'</div>'+profileRow('S Dong, N Gong'),'https://scholar.google.com/citations?user='+id);
  assert.equal(p.buttons().filter(b=>b.classList.contains('target')).length,0);
  assert.equal(p.buttons().filter(b=>b.classList.contains('coauthor')).length,0);
 }
});
test('explicit byline identifiers override profile context, which stays inside publication rows',async()=>{
 const p=await page('<div id="gsc_prf_in">Sixun Dong</div>'+profileRow('<a href="https://scholar.google.com/citations?user=anotherID">S Dong</a>')+'<div class="gs_r"><div class="gs_a">S Dong, N Gong</div></div>','https://scholar.google.com/citations?user=j71Y2-4AAAAJ');
 assert.equal(p.buttons().filter(b=>b.classList.contains('target')).length,1);
 assert.ok(p.buttons().some(b=>b.textContent==='Identity conflict'));assert.ok(p.buttons().some(b=>b.textContent==='Identity unverified'));
});
