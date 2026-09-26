const fs=require('node:fs'),path=require('node:path');
const E=require('../extension/core.js');
const data=E.validate(JSON.parse(fs.readFileSync('evidence-database/database.json')));
const outputs=new Map();
outputs.set('docs/core.js',fs.readFileSync('extension/core.js','utf8'));
outputs.set('docs/data.json',JSON.stringify(data,null,2)+'\n');
const B=require('../extension/brand.js');
outputs.set('extension/icons/icon.svg',B.logoSvg);
outputs.set('docs/icon.svg',B.logoSvg);
for(const role of ['target','coauthor','candidate']){
 outputs.set('extension/icons/marker-'+role+'.svg',B.markerSvg(role));
 outputs.set('docs/assets/marker-'+role+'.svg',B.markerSvg(role));
}
const words=JSON.parse(fs.readFileSync('locales/generator.zh-CN.json'));
const inventory=JSON.parse(fs.readFileSync('evidence-database/publication-inventory.json'));
const coverage=require('./coverage.cjs')(data,inventory);
const coverageLines=['# Sixun Dong publication inventory','',`Snapshot: ${inventory.checked}. ${coverage.active.size} of ${coverage.total} listed papers have active database records (${coverage.percentage}%). ${coverage.reviewed} papers have been reviewed; ${coverage.pending} await full text.`,'',
 'The denominator is the union of the author publication page and Google Scholar list checked on this date. Repeated listings of the same paper are merged; versions sharing an arXiv ID count once. Separately titled works with different identifiers remain separate entries. Publicly listed works awaiting full text are included. Unattributed same-name results are excluded.','',
 'This bibliography supplies the denominator; only papers with admitted open issues enter the extension and website issue database.','',
 ...inventory.sources.map(s=>`- [${s.label}](${s.url})`),'',
 '| Paper | Review status |','|---|---|'];
for(const p of inventory.papers){
 const status=coverage.active.has(p.id)?`[Recorded issues](../evidence-database/papers/${p.id}.md)`:p.reviewed?'Reviewed; no active issue record':'Awaiting full text';
 coverageLines.push(`| [${p.title}](${p.url}) | ${status} |`);
}
outputs.set('docs/publication-coverage.md',coverageLines.join('\n')+'\n');
const coauthors=data.identities.filter(r=>!data.targets.some(t=>t.identityId===r.id));
const summaryValues={date:data.updated,papers:data.papers.length,findings:data.papers.reduce((n,p)=>n+p.findings.length,0),
 identities:data.identities.length,coauthors:coauthors.length,
 verified:coauthors.filter(r=>r.verificationStatus==='verified').length,
 supported:coauthors.filter(r=>r.verificationStatus==='supported').length,
 unresolved:coauthors.filter(r=>r.verificationStatus==='unresolved').length};
summaryValues.unmarked=summaryValues.supported+summaryValues.unresolved;
Object.assign(summaryValues,{casePapers:coverage.active.size,totalPapers:coverage.total,percentage:coverage.percentage,pending:coverage.pending});
for(const [file,templates] of [
 ['README.md',{
  'case-summary':'> **{casePapers} / {totalPapers} publicly listed papers ({percentage}%) have recorded open issues.**\n>\n> Snapshot: **{date}**. The denominator is the [publication inventory](docs/publication-coverage.md) compiled from the author’s homepage and Google Scholar, including {pending} papers awaiting full text.',
  'database-summary':'As of **{date}**, the database contains **{papers} papers and {findings} open issues** in three categories:',
  'identity-summary':'As of **{date}**, the [identity audit](docs/identity-audit.md) covers **{identities} author records**. Among {coauthors} coauthors, {verified} have verified identity links, {supported} have supporting evidence, and {unresolved} remain unresolved. The {unmarked} supported or unresolved coauthors receive no markers.'
 }],
 ['README.zh-CN.md',{'case-summary':words.readmeCaseSummary,'database-summary':words.readmeSummary,'identity-summary':words.readmeIdentitySummary}]
]){
 let text=fs.readFileSync(file,'utf8');
 for(const [name,template] of Object.entries(templates)){
  const block=new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`,'g');
  if([...text.matchAll(block)].length!==1)throw Error('Expected one '+name+' block: '+file);
  const summary=template.replace(/\{(\w+)\}/g,(_,key)=>{
   if(!Object.hasOwn(summaryValues,key))throw Error('Unknown summary value: '+key);
   return summaryValues[key];
  });
  text=text.replace(block,`<!-- ${name}:start -->\n${summary}\n<!-- ${name}:end -->`);
 }
 outputs.set(file,text);
}
for(const [file,content] of require('./brand-assets.cjs')(data,words.cover))outputs.set(file,content);
const enUI=JSON.parse(fs.readFileSync('locales/ui.en.json'));
const zhUI=JSON.parse(fs.readFileSync('locales/ui.zh-CN.json'));
for(const [name,ui] of [['en',enUI],['zh-CN',zhUI]])outputs.set('docs/i18n/'+name+'.js','globalThis.SiteLocale = '+JSON.stringify(ui,null,2)+';\n');
const enHTML=fs.readFileSync('site/index.en.html','utf8');
outputs.set('docs/index.html',enHTML);
let zhHTML=enHTML;
const translations=JSON.parse(fs.readFileSync('locales/site.zh-CN.json'));
for(const [from,to] of Object.entries(translations)){if(!zhHTML.includes(from))throw Error('Unused static translation: '+from);zhHTML=zhHTML.split(from).join(to);}
zhHTML=zhHTML.replace('<html lang="en" data-locale="en">','<html lang="zh-CN" data-locale="zh-CN">')
 .replace(/<a id="language-switch"[^>]*>[^<]*<\/a>/,'<a id="language-switch" class="language-switch" href="../" hreflang="en" lang="en">English</a>')
 .replace('rel="canonical" href="https://shipofshame.github.io/Academic-Misconduct-Marker/"','rel="canonical" href="https://shipofshame.github.io/Academic-Misconduct-Marker/zh/"')
 .replaceAll('href="icon.svg"','href="../icon.svg"').replaceAll('src="icon.svg"','src="../icon.svg"')
 .replaceAll('href="site.css"','href="../site.css"').replaceAll('src="assets/','src="../assets/')
 .replaceAll('src="core.js"','src="../core.js"').replaceAll('src="scoring.js"','src="../scoring.js"').replaceAll('src="site.js"','src="../site.js"')
 .replace('src="i18n/en.js"','src="../i18n/zh-CN.js"')
 .replace('/blob/main/docs/methodology.md','/blob/main/docs/zh/methodology.md')
 .replace('/blob/main/docs/installation.md','/blob/main/README.zh-CN.md#'+words.installAnchor)
 .replace('/tree/main/evidence-database/papers','/tree/main/docs/zh/papers');
outputs.set('docs/zh/index.html',zhHTML);
const {localize}=require('./localize.cjs');
const zh=localize(data,JSON.parse(fs.readFileSync('evidence-database/locales/zh-CN.json')));
outputs.set('docs/zh/data.json',JSON.stringify(zh,null,2)+'\n');
for(const p of zh.papers){
 const lines=['# '+p.title,'','[English](../../../evidence-database/papers/'+p.id+'.md) · ['+words.paper+']('+p.url+')','',words.authors+p.authors.join(', '),'',zh.notice,''];
 for(const f of p.findings){lines.push('## '+f.title,'',words.status+zhUI.labels[f.status]+words.checked+f.checked,'',f.detail,'');for(const section of E.findingSections(f))lines.push('### '+zhUI.sections[section.label],'',section.text,'');lines.push('### '+words.sources,'');for(const source of f.evidence.sources)lines.push('- ['+source.label+']('+source.url+') — '+source.location);lines.push('');}
 outputs.set('docs/zh/papers/'+p.id+'.md',lines.join('\n'));
}
// Content versions keep cached scripts, translations and data in sync with each page.
const digest=content=>require('node:crypto').createHash('sha256').update(content).digest('hex').slice(0,16);
for(const page of ['docs/index.html','docs/zh/index.html']){
 const directory=path.dirname(page), dataPath=directory+'/data.json';
 let html=outputs.get(page).replace('</head>',`  <meta name="evidence-version" content="${digest(outputs.get(dataPath))}">\n</head>`);
 html=html.replace(/((?:src|href)=")([^"?]+\.(?:js|css))(")/g,(_,prefix,url,suffix)=>{
  const asset=path.posix.normalize(path.posix.join(directory,url));
  return prefix+url+'?v='+digest(outputs.get(asset)??fs.readFileSync(asset))+suffix;
 });
 outputs.set(page,html);
}

const xml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
for(const [locale,title,subtitle] of [['en','Academic Misconduct Marker','SOURCE-LINKED RESEARCH SCRUTINY'],['zh-CN',words.brand,words.tagline]]){
 const mark=B.logoSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">','<svg x="8" y="16" width="80" height="80" viewBox="0 0 64 64">');
 outputs.set('docs/assets/wordmark-'+locale+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 112"><title>${xml(title)}</title><rect width="720" height="112" rx="18" fill="#faf9f6"/>${mark}<text x="111" y="51" font-family="Arial, system-ui, sans-serif" font-size="29" font-weight="700" fill="#211a1b">${xml(title)}</text><text x="113" y="78" font-family="Arial, system-ui, sans-serif" font-size="12" letter-spacing="2" fill="#786760">${xml(subtitle)}</text></svg>\n`);
}

outputs.set('extension/LICENSE',fs.readFileSync('LICENSE','utf8'));
outputs.set('extension/evidence.json',JSON.stringify(data,null,2)+'\n');
const index=['# Paper evidence','',`Snapshot: ${data.updated}. ${data.papers.length} papers. These are version-scoped findings, not personal misconduct verdicts.`,'','| Paper | Findings |','|---|---|'];
for(const p of data.papers){
 const lines=['# '+p.title,'','[Read paper]('+p.url+')','','Authors: '+p.authors.join(', '),'',data.notice,'','Paper-level findings do not establish wrongdoing by every coauthor.',''];
 for(const f of p.findings){
  lines.push('## '+f.title,'','Status: '+E.labels[f.status]+' · Checked: '+f.checked,'',f.detail,'');
  for(const section of E.findingSections(f))lines.push('### '+section.label,'',section.text,'');
  lines.push('### Sources and exact locations','');
  for(const source of f.evidence?.sources||[{label:'Original source',url:f.url,location:'See the version scope above.'}])lines.push('- ['+source.label+']('+source.url+') — '+source.location);
  lines.push('');
 }
 outputs.set('evidence-database/papers/'+p.id+'.md',lines.join('\n'));
 index.push(`| [${p.title}](${p.id}.md) | ${p.findings.map(f=>E.labels[f.status]).join('; ')} |`);
}
outputs.set('evidence-database/papers/README.md',index.join('\n')+'\n');
const statuses={verified:'Verified',supported:'Supported; unverified',unresolved:'Unresolved'};
const lines=['# Individual coauthor identity audit','',`Checked: ${data.updated}. Scope: ${coauthors.length} coauthor records in the ${data.papers.length}-paper corpus; not a complete career collaboration network.`,'',`Verified: ${coauthors.filter(r=>r.verificationStatus==='verified').length}. Supported but unverified: ${coauthors.filter(r=>r.verificationStatus==='supported').length}. Unresolved: ${coauthors.filter(r=>r.verificationStatus==='unresolved').length}.`,'','Verified means a public professional identity chain was established through a personal page, institutional roster, identifier, and paper context. This is not a legal identity check. Some records remain institution/team-scoped without persistent IDs. A name alone never confirms an unknown page. ORCID records may be self-asserted. Historical institutions are not necessarily current employers.','', '| Author | Status | Identifiers | Evidence and limits |','|---|---|---|---|'];
for(const r of coauthors){const ids=[...r.scholarIds.map(i=>`[Scholar](https://scholar.google.com/citations?user=${i})`),...r.orcids.map(i=>`[ORCID](https://orcid.org/${i})`)];lines.push(`| ${r.name} | ${statuses[r.verificationStatus]} | ${ids.join(' / ')||'Not imported'} | ${r.verificationNote} ${r.sources.map((s,i)=>`[Source ${i+1}](${s})`).join(' ')} |`);}
lines.push('','## Remaining work','','Supported and unresolved identities require additional primary-source bridges. Paper bylines remain distinct from personal identity confirmation. No models or research experiments were run, and this audit makes no new misconduct allegation against coauthors.');
outputs.set('docs/identity-audit.md',lines.join('\n')+'\n');
const stale=['evidence-database/papers','docs/zh/papers'].flatMap(dir=>fs.existsSync(dir)?fs.readdirSync(dir).filter(name=>/^\d{4}\.\d{4,5}\.md$/.test(name)&&!outputs.has(dir+'/'+name)).map(name=>dir+'/'+name):[]);
if(process.argv.includes('--check')&&stale.length)throw Error('Unlisted generated paper records remain: '+stale.join(', '));
if(!process.argv.includes('--check'))for(const name of stale)fs.unlinkSync(name);
if(process.argv.includes('--check')){for(const [p,s] of outputs)if(!fs.existsSync(p)||fs.readFileSync(p,'utf8')!==s)throw Error('Generated file is stale: '+p);console.log('Generated records are current.');}
else{for(const [p,s] of outputs){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);}console.log(`Generated ${outputs.size} files.`);}
