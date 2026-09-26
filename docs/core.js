(function (root) {
  'use strict';
  const labels = {reporting_error:'Reporting discrepancy', implementation_error:'Implementation issue', material_gap:'Missing materials', needs_clarification:'Needs clarification', corrected:'Corrected', no_confirmed_issue:'No confirmed issue'};
  const openIssueStatuses = Object.freeze(['reporting_error','implementation_error','material_gap']);
  const evidenceFields = Object.freeze({scope:'Reviewed material',observation:'Observed evidence',reason:'Reason for flagging',limitation:'Scope and author response'});
  const hasOpenIssue = paper => paper.findings.some(f=>openIssueStatuses.includes(f.status));
  const findingSections = finding => finding.evidence ? Object.entries(evidenceFields).map(([key,label])=>({label:finding.status==='corrected'&&key==='reason'?'Correction context':label,text:finding.evidence[key]})) : [];
  const normalize = s => String(s || '').normalize('NFKC').replace(/[₂]/g,'2').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  const arxivId = value => { try { const u = new URL(value); if (!['arxiv.org','www.arxiv.org'].includes(u.hostname)) return null; return u.pathname.match(/^\/(?:abs|html|pdf)\/(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?\/?$/)?.[1] || null; } catch { return null; } };
  function validate(data) {
    const fail = text => { throw new Error(text); };
    const str = (v, max=2000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.papers) || !Array.isArray(data.targets)) fail('Invalid evidence-file format.');
    if (data.papers.length > 500 || data.targets.length > 50 || !str(data.notice) || !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) fail('Invalid evidence size, date, or notice.');
    if (data.inclusionPolicy !== undefined && data.inclusionPolicy !== 'documented-open-issues') fail('Invalid inclusion policy.');
    const strict = data.inclusionPolicy === 'documented-open-issues';
    const names = new Set();
    for (const t of data.targets) {
      if (!str(t.name,120) || !safeUrl(t.identityUrl) || names.has(normalize(t.name))) fail('Invalid or duplicate review subject.');
      names.add(normalize(t.name));
    }
    const ids = new Set(), titles = new Set();
    for (const p of data.papers) {
      if (!/^\d{4}\.\d{4,5}$/.test(p.id) || ids.has(p.id) || !str(p.title,500) || titles.has(normalize(p.title)) || arxivId(p.url) !== p.id) fail('Invalid or duplicate paper ID, title, or source URL.');
      ids.add(p.id); titles.add(normalize(p.title));
      if(p.evidenceUrl!==undefined&&!safeUrl(p.evidenceUrl))fail('Invalid repository evidence URL.');
      if (!Array.isArray(p.authors) || !p.authors.length || p.authors.length > 100 || !p.authors.every(a=>str(a,120)) || new Set(p.authors.map(normalize)).size !== p.authors.length) fail('Invalid author list.');
      if (!Array.isArray(p.findings) || p.findings.length > 30) fail('Invalid findings.');
      if (strict && !hasOpenIssue(p)) fail('A listed paper must have a documented open issue.');
      for (const f of p.findings) {
        if (!Object.hasOwn(labels,f.status) || !str(f.title,200) || !str(f.detail,5000) || !safeUrl(f.url) || !/^\d{4}-\d{2}-\d{2}$/.test(f.checked)) fail('Invalid finding status, text, date, or URL.');
        if (strict && (!f.evidence || !openIssueStatuses.includes(f.status))) fail('Listed findings require documented open issues and detailed evidence.');
        if (f.evidence !== undefined) {
          const e = f.evidence;
          if (!e || typeof e !== 'object' || !Object.keys(evidenceFields).every(key=>str(e[key],5000)) || !Array.isArray(e.sources) || !e.sources.length || e.sources.length > 10 || !e.sources.every(source=>source && str(source.label,200) && str(source.location,500) && safeUrl(source.url))) fail('Invalid detailed evidence or source locator.');
        }
      }
    }
    if(data.identities!==undefined){
      if(!Array.isArray(data.identities)||data.identities.length>1000)fail('Invalid identity records.');
      const keys=new Set(),scholars=new Set(),orcids=new Set();
      for(const r of data.identities){
        if(!str(r.id,120)||keys.has(r.id)||!str(r.name,120)||!Array.isArray(r.sources)||!r.sources.length||!r.sources.every(safeUrl)||!/^\d{4}-\d{2}-\d{2}$/.test(r.checked))fail('Invalid identity provenance.');keys.add(r.id);
        for(const field of ['scholarIds','orcids','affiliations','paperIds'])if(!Array.isArray(r[field])||r[field].length>500||!r[field].every(x=>str(x,300)))fail('Invalid identity field.');
        if(r.verificationStatus!==undefined){
          if(!['verified','supported','unresolved'].includes(r.verificationStatus)||!str(r.verificationNote,2500))fail('Invalid identity verification status or explanation.');
          if(r.verificationStatus!=='verified'&&(r.scholarIds.length||r.orcids.length))fail('Unverified identifiers cannot enable automatic identity matching.');
        }
        for(const id of r.scholarIds){if(!/^[A-Za-z0-9_-]{6,64}$/.test(id)||scholars.has(id))fail('Invalid or shared Scholar ID.');scholars.add(id);}
        for(const id of r.orcids){if(orcidId(id)!==id||orcids.has(id))fail('Invalid or shared ORCID.');orcids.add(id);}
        if(r.paperIds.some(id=>!data.papers.some(p=>p.id===id&&p.authors.some(a=>normalize(a)===normalize(r.name)))))fail('Identity paper binding is invalid.');
      }
    }
    for(const t of data.targets)if(t.identityId!==undefined&&!(data.identities||[]).some(r=>r.id===t.identityId&&normalize(r.name)===normalize(t.name)))fail('Invalid target identity binding.');
    return data;
  }
  function paperFor(data, title, urls=[]) {
    const ids = urls.map(arxivId).filter(Boolean);
    if (ids.length) return data.papers.find(p=>ids.includes(p.id)) || null;
    return data.papers.find(p=>normalize(p.title) === normalize(title)) || null;
  }
  function authorFor(data, name, paper=null, context={}) {
    let n=normalize(name);
    const all=[...new Set(data.papers.flatMap(p=>p.authors))];
    if (!all.some(a=>normalize(a)===n) && !data.targets.some(t=>normalize(t.name)===n)) {
      const matches=all.filter(a=>{const parts=normalize(a).split(' ');return n===parts.slice(0,-1).map(s=>s[0]).join(' ')+' '+parts.at(-1) || n===parts[0][0]+' '+parts.at(-1);});
      const eligible=paper?matches.filter(a=>paper.authors.includes(a)):matches;
      if(eligible.length!==1)return null;
      n=normalize(eligible[0]);
    }
    const target=data.targets.find(t=>normalize(t.name)===n);
    const relations=data.papers.filter(p=>p.authors.some(a=>normalize(a)===n) && p.authors.some(a=>data.targets.some(t=>normalize(t.name)===normalize(a))));
    if (!target && !relations.length) return null;
    const confirmed=!!paper && paper.authors.some(a=>normalize(a)===n);
    const result={name:target?.name || relations.flatMap(p=>p.authors).find(a=>normalize(a)===n), role:target?'target':'coauthor', confirmed, papers:relations};
    return resolveIdentity(data,result,paper,context);
  }
  const scholarHosts=['scholar.google.com','scholar.google.com.hk','scholar.google.co.uk','scholar.google.com.au'];
  function scholarId(value){try{const u=new URL(value);const id=u.searchParams.get('user');return u.protocol==='https:'&&scholarHosts.includes(u.hostname)&&u.pathname==='/citations'&&/^[A-Za-z0-9_-]{6,64}$/.test(id||'')?id:null;}catch{return null;}}
  function orcidId(value){
    let id=String(value||'');if(id.startsWith('https://')){try{const u=new URL(id);if(u.hostname!=='orcid.org'||u.search||u.hash||u.username||u.password)return null;id=u.pathname.slice(1);}catch{return null;}}
    if(!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(id))return null;
    const digits=id.replace(/-/g,'');let total=0;for(const d of digits.slice(0,15))total=(total+Number(d))*2;
    const check=(12-total%11)%11;return digits[15]===(check===10?'X':String(check))?id:null;
  }
  function resolveIdentity(data,a,paper,c){
    const records=(data.identities||[]).filter(r=>normalize(r.name)===normalize(a.name));
    const sid=scholarId(c.scholarUrl),oid=orcidId(c.orcid);
    const positive=records.filter(r=>(sid&&r.scholarIds.includes(sid))||(oid&&r.orcids.includes(oid)));
    const r=positive.length===1?positive[0]:records.length===1?records[0]:null;
    if(r){
      const target=data.targets.some(t=>normalize(t.name)===normalize(r.name)&&(t.identityId?t.identityId===r.id:records.length===1));
      const related=a.papers.filter(p=>r.paperIds.includes(p.id));
      if(!target&&!related.length)return null;
      a={...a,role:target?'target':'coauthor',papers:related};
    }
    const reason=[];let level=a.confirmed?'paper':'name';
    // Conflicting identifiers override byline, title, affiliation and network evidence.
    const foreign=(data.identities||[]).some(x=>normalize(x.name)!==normalize(a.name)&&((sid&&x.scholarIds.includes(sid))||(oid&&x.orcids.includes(oid))));
    if(foreign||positive.length>1||(r&&((sid&&r.scholarIds.length&&!r.scholarIds.includes(sid))||(oid&&r.orcids.length&&!r.orcids.includes(oid))))){level='conflict';reason.push('Identifier conflicts with the curated identity record.');}
    else if(records.length>1&&!r){level='ambiguous';reason.push('Multiple identity records share this name.');}
    else if(positive.length===1){level='identifier';reason.push(sid&&r.scholarIds.includes(sid)?'Exact curated Scholar profile ID.':'Exact curated ORCID.');}
    else if(a.confirmed&&(!r||r.paperIds.includes(paper.id))){reason.push('Name occurs on this recorded paper.');}
    else{
      level='name';
      const affiliation=(c.affiliations||[]).find(x=>r?.affiliations.some(y=>normalize(x)===normalize(y)));
      if(affiliation)reason.push('Matching recorded institution: '+affiliation+'.');
      const seen=new Set((c.coauthors||[]).map(normalize).filter(n=>n!==normalize(a.name)));
      const shared=a.papers.map(p=>({p,names:p.authors.filter(n=>normalize(n)!==normalize(a.name)&&seen.has(normalize(n)))})).filter(x=>x.names.length>=2);
      if(shared.length)reason.push('At least two other full-name coauthors match recorded paper '+shared[0].p.id+': '+shared[0].names.join(', ')+'.');
      if(affiliation||shared.length)level='supported';
      if(!reason.length)reason.push('Name match only; no independent identity evidence.');
    }
    const matched=['paper','identifier'].includes(level);
    return {...a,confirmed:matched,identityVerified:matched&&r?.verificationStatus==='verified',verificationStatus:r?.verificationStatus||'not_audited',verificationNote:r?.verificationNote||'No individual identity audit is attached to this record.',identityLevel:level,identityId:r?.id||null,reasons:reason,identitySources:r?.sources||[]};
  }
  const api={labels,openIssueStatuses,hasOpenIssue,findingSections,normalize,safeUrl,arxivId,validate,paperFor,authorFor,scholarId,orcidId,scholarHosts};
  root.ScholarEvidence=api;
  if (typeof module !== 'undefined') module.exports=api;
})(globalThis);
