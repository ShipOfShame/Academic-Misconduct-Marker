(() => {
  'use strict';
  if(!['arxiv.org','www.arxiv.org',...globalThis.ScholarEvidence.scholarHosts].includes(location.hostname))return;
  const E=globalThis.ScholarEvidence;
  let data, prefs={}, observer, timer, panel, lastFocus, activeHover, epoch=0;
  const mounts=new Map(), textWrappers=new Set();
  const styles=`
.hovercard{--accent:#b4232c;--tint:#fff3f2;position:fixed;z-index:2147483647;display:flex;flex-direction:column;width:380px;max-width:calc(100vw - 24px);max-height:min(560px,calc(100vh - 24px));overflow:hidden;background:#fff;color:#24272e;border:1px solid #e3e5e8;border-top:3px solid var(--accent);border-radius:16px;box-shadow:0 18px 54px #18202b26,0 3px 10px #18202b12;font-size:13px;line-height:1.5;text-align:left;white-space:normal;overflow-wrap:anywhere;color-scheme:light}
.hovercard[data-role="coauthor"]{--accent:#a64708;--tint:#fff5e9}.hovercard[data-role="candidate"]{--accent:#596777;--tint:#f1f4f7}
.hovercard[hidden]{display:none}.hover-header{flex-shrink:0;padding:20px 20px 16px;background:linear-gradient(120deg,var(--tint),#fff 85%)}
.hover-identity{display:flex;align-items:center;gap:12px}.hover-emblem{display:flex;align-items:center;justify-content:center;flex:0 0 38px;height:38px;border-radius:11px;background:var(--accent);color:white;box-shadow:0 2px 4px #18202b12}.hover-emblem svg{width:28px;height:28px}
.hovercard .hover-eyebrow{margin:0 0 3px;color:var(--accent);font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}.hovercard .hover-name{margin:0;font-size:21px;line-height:1.25;letter-spacing:-.4px;font-weight:700;color:#20242c}
.hovercard .hover-summary{margin:13px 0 0;color:#535b67;font-size:12px;line-height:1.6}
.hover-list-heading{display:flex;align-items:center;justify-content:space-between;flex-shrink:0;padding:12px 20px 10px;border-top:1px solid #edf0f2;color:#66707e;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase}.hover-count{padding:1px 7px;border-radius:5px;background:#f0f2f4;color:#424b57;font-size:11px;letter-spacing:0;font-variant-numeric:tabular-nums}
.hover-papers{min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#cbd0d6 transparent;padding:0 20px;scroll-padding:10px}
.hover-paper{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:10px;padding:14px 0;border-top:1px solid #edf0f2}.hover-paper:first-child{border-top:0;padding-top:4px}.hover-number{padding-top:3px;color:#89929e;font-size:10px;font-weight:600;font-variant-numeric:tabular-nums}
.hovercard a{text-decoration:none}.hovercard .hover-title{display:block;color:#262d36;font-size:13px;line-height:1.55;font-weight:600}.hovercard .hover-title:hover{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
.hover-paper-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:9px}.hover-arxiv{color:#7c8591;font-size:10px;font-variant-numeric:tabular-nums}.hovercard .hover-evidence{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:6px;background:var(--tint);color:var(--accent);font-size:10px;font-weight:650}.hovercard .hover-evidence:hover{box-shadow:inset 0 0 0 1px var(--accent)}
.hover-footer{flex-shrink:0;padding:10px 20px;border-top:1px solid #e9edf0;background:#fafbfc}.hovercard .hover-open{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:5px 0;border:0;background:transparent;color:#4d5866;text-align:left;font-size:11px;font-weight:600}.hovercard .hover-open:hover{color:var(--accent)}
.hovercard :is(a,button):focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
:host{all:initial;position:relative;display:inline-block;font-family:system-ui,-apple-system,sans-serif;color:#172638}*{box-sizing:border-box}button{font:inherit;cursor:pointer} .badge{font-size:11px;line-height:1.6;margin:0 5px;padding:1px 7px;border:1px solid #9db7be;border-radius:12px;background:#eff7f7;color:#185d69;white-space:nowrap}.logo-badge{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;vertical-align:-4px;margin:0 4px;padding:0;border:0;border-radius:5px;line-height:0}.logo-badge svg{display:block;width:20px;height:20px}.logo-badge:hover{filter:brightness(.85)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.logo-badge.target{background:#b91c1c;color:white}.logo-badge.coauthor{background:#c2410c;color:white}.logo-badge.candidate{background:#64748b;color:white;outline:1px dashed #64748b;outline-offset:2px}.target{background:#b91c1c;border-color:#991b1b;color:#fff;font-weight:700}.coauthor{background:#ffedd5;border-color:#c2410c;color:#9a3412;font-weight:700}.badge:focus-visible{outline:3px solid #172638;outline-offset:2px}.candidate{background:#f3f4f6;border-color:#c9ced5;color:#4e5968}.panel{overflow-wrap:anywhere;position:fixed;right:16px;top:16px;bottom:16px;width:min(420px,calc(100vw - 32px));overflow:auto;background:#fff;border:1px solid #d6dfe4;border-radius:16px;box-shadow:0 12px 60px #142d3840;padding:24px;font-size:14px;line-height:1.7}.close{float:right;border:0;background:#eef2f4;border-radius:50%;width:30px;height:30px}h2{font-size:21px;margin:8px 30px 12px 0;line-height:1.4}h3{font-size:15px;margin:8px 0}p{margin:8px 0}.muted{color:#60717d;font-size:12px}.notice{padding:12px;background:#f1f6f7;border-radius:8px}.card{border-top:1px solid #e0e7eb;padding:14px 0}a{color:#0d6474;text-decoration:underline}.tag{font-size:11px;background:#edf2f4;border-radius:5px;padding:3px 6px}.footer{margin-top:20px;color:#697580;font-size:12px}`;
  const el=(tag,text,cls)=>{const n=document.createElement(tag); if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  function link(text,url) {const a=el('a',text); a.href=E.safeUrl(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
  function closeHover(){activeHover?.();activeHover=null;}
  function closePanel(){panel?.remove();panel=null;if(lastFocus?.isConnected)lastFocus.focus();}
  function show(info,button){
    closeHover();closePanel();lastFocus=button;
    panel=el('div');panel.dataset.sePanel='';panel.style.cssText='position:fixed;z-index:2147483647;inset:0;pointer-events:none';
    const shadow=panel.attachShadow({mode:'open'});shadow.append(el('style',styles));
    const box=el('section',undefined,'panel');box.style.pointerEvents='auto';box.setAttribute('role','dialog');box.setAttribute('aria-label','Research evidence');
    const close=el('button','×','close');close.setAttribute('aria-label','Close evidence');close.onclick=closePanel;box.append(close,el('p','ACADEMIC MISCONDUCT MARKER · LOCAL EVIDENCE','muted'));
    box.append(el('h2',info.paper ? info.paper.title : info.author.name));
    box.append(el('p',data.notice,'notice'));
    if(info.author){
      const a=info.author;
      const status={verified:'Verified from public sources',supported:'Supporting evidence; identity not yet verified',unresolved:'Unresolved',not_audited:'Not individually audited'};
      box.append(el('p','Page match: '+a.identityLevel,'muted'));
      for(const reason of a.reasons||[])box.append(el('p',reason));
      box.append(el('h3','Individual identity audit'),el('p',status[a.verificationStatus]),el('p',a.verificationNote));
      box.append(el('p',a.identityVerified?'This page match is linked to an individually verified identity.':'This page match does not establish a verified personal identity. A recorded byline confirms the paper relationship only.','muted'));
      for(const source of a.identitySources||[])box.append(link('Identity source ↗',source));
      if(a.role==='coauthor')box.append(el('p','The coauthor marker indicates a shared byline on a recorded paper, not wrongdoing by this person.'));
    }
    const papers=info.paper?[info.paper]:info.author.papers;
    for(const p of papers){const item=el('div',undefined,'card');item.append(link(p.title,p.url));
      if(info.paper)for(const f of p.findings){const c=el('div',undefined,'card');c.append(el('span',E.labels[f.status],'tag'),el('h3',f.title),el('p',f.detail));for(const section of E.findingSections(f))c.append(el('h4',section.label),el('p',section.text));for(const source of f.evidence?.sources||[{label:'View original source',url:f.url,location:''}])c.append(link(source.label+' ↗',source.url),el('p',source.location,'muted'));c.append(el('p',`Reviewed: ${f.checked} · Status applies only to the versions described`,'muted'));item.append(c);}
      else {item.append(el('p','A paper-level finding does not automatically apply to every author.','muted'));const b=el('button','View paper evidence','badge');b.onclick=()=>show({paper:p},button);item.append(b);}
      box.append(item);
    }
    box.append(el('p',`Evidence updated: ${data.updated} · ${data.papers.length} papers. Coauthor coverage is limited to these papers, not a complete collaboration network. Export, correct, or replace evidence in extension settings.`,'footer'));
    shadow.append(box);document.documentElement.append(panel);close.focus();
  }
  function badge(node,info,label,cls=''){
    if(!node || mounts.has(node))return;
    const host=el('span');host.dataset.seBadge='';const shadow=host.attachShadow({mode:'open'});shadow.append(el('style',styles));
    const b=el('button',undefined,`badge ${cls}${info.author?' logo-badge':''}`);
    if(info.author){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
      for(const shape of globalThis.EvidenceBrand.shapes(cls)){const node=document.createElementNS('http://www.w3.org/2000/svg',shape.tag);for(const [key,value] of Object.entries(shape.attrs))node.setAttribute(key,value);svg.append(node);}b.style.backgroundColor=globalThis.EvidenceBrand.palettes[cls]||globalThis.EvidenceBrand.palettes.candidate;b.style.color='#fff';b.append(svg,el('span',label,'sr-only'));
    }else b.textContent=label;
    if(!info.author)b.title=`${label}: ${info.paper.title} — Click to view evidence`;
    b.type='button';b.setAttribute('aria-label',`${label}: ${info.paper?.title || info.author?.name}, open evidence`);b.onclick=e=>{e.preventDefault();e.stopPropagation();show(info,b);};shadow.append(b);
    if(info.author){
      const a=info.author,card=el('section',undefined,'hovercard');card.hidden=true;card.dataset.role=cls;card.id='author-preview';card.setAttribute('aria-label','Author and related evidence');
      b.setAttribute('aria-controls',card.id);b.setAttribute('aria-expanded','false');
      const summary=!a.confirmed?'Identity not confirmed':a.role==='target'?'Suspected research-integrity concerns':'Coauthor of an author with suspected research-integrity concerns';
      const header=el('header',undefined,'hover-header'),identity=el('div',undefined,'hover-identity');
      const emblem=el('span',undefined,'hover-emblem');emblem.setAttribute('aria-hidden','true');emblem.append(b.querySelector('svg').cloneNode(true));
      const name=el('div');name.append(el('p',!a.confirmed?'Identity review':a.role==='target'?'Review subject':'Associated coauthor','hover-eyebrow'),el('h2',a.name,'hover-name'));
      identity.append(emblem,name);header.append(identity,el('p',summary,'hover-summary'));
      const heading=el('div',undefined,'hover-list-heading');heading.append(el('span','Related papers'),el('span',String(a.papers.length),'hover-count'));
      const papers=el('div',undefined,'hover-papers');
      card.append(header,heading,papers);
      for(const [index,p] of a.papers.entries()){
        const row=el('div',undefined,'hover-paper'),body=el('div');
        const number=el('span',String(index+1).padStart(2,'0'),'hover-number');number.setAttribute('aria-hidden','true');
        const title=link(p.title,p.url);title.className='hover-title';body.append(title);
        const meta=el('div',undefined,'hover-paper-meta');meta.append(el('span','arXiv: '+p.id,'hover-arxiv'));
        const evidence=el('a',p.evidenceUrl?'Repository evidence ↗':'Evidence record ↗');
        evidence.href=p.evidenceUrl||chrome.runtime.getURL('evidence.html')+'#'+encodeURIComponent(p.id);
        evidence.target='_blank';evidence.rel='noopener noreferrer';evidence.className='hover-evidence';meta.append(evidence);body.append(meta);row.append(number,body);papers.append(row);
      }
      const footer=el('footer',undefined,'hover-footer'),details=el('button',undefined,'hover-open');details.type='button';
      details.append(el('span','Open full evidence'),el('span','↗'));details.onclick=e=>{e.preventDefault();e.stopPropagation();show(info,b);};footer.append(details);card.append(footer);
      let leaveTimer;
      const close=()=>{clearTimeout(leaveTimer);card.hidden=true;b.setAttribute('aria-expanded','false');};
      const open=()=>{
        clearTimeout(leaveTimer);if(activeHover!==close)closeHover();activeHover=close;
        card.style.maxHeight='';card.hidden=false;b.setAttribute('aria-expanded','true');
        const rect=b.getBoundingClientRect?.();
        if(rect){
          const width=document.documentElement.clientWidth||1024,height=document.documentElement.clientHeight||768;
          const cardWidth=card.offsetWidth||Math.min(380,width-24),naturalHeight=card.offsetHeight||0;
          const belowSpace=Math.max(0,height-rect.bottom-12),aboveSpace=Math.max(0,rect.top-12);
          const below=naturalHeight<=belowSpace||belowSpace>=aboveSpace;
          card.style.maxHeight=Math.min(560,below?belowSpace:aboveSpace)+'px';
          const cardHeight=card.offsetHeight||0;
          card.style.left=Math.max(12,Math.min(rect.left,width-cardWidth-12))+'px';
          card.style.top=Math.max(12,below?rect.bottom:rect.top-cardHeight)+'px';
        }
      };
      host.addEventListener('mouseenter',open);host.addEventListener('mouseleave',()=>{leaveTimer=setTimeout(()=>{if(!shadow.activeElement)close();},140);});
      b.addEventListener('focus',open);host.addEventListener('focusout',()=>setTimeout(()=>{if(!shadow.activeElement)close();},0));
      host.addEventListener('keydown',e=>{if(e.key==='Escape'){close();e.stopPropagation();}});
      shadow.append(card);
    }
    node.after(host);mounts.set(node,host);
  }
  function identityContext(node,name=node.textContent){
    const ctx={scholarUrl:node.href,affiliations:[],coauthors:[]};
    const profile=node.id==='gsc_prf_in';
    const card=node.closest('.gs_ai_t');
    if(profile){ctx.scholarUrl=location.href;ctx.affiliations=[...document.querySelectorAll('#gsc_prf_inw .gsc_prf_il')].map(n=>n.textContent.trim());}
    if(card)ctx.affiliations=[...card.querySelectorAll('.gs_ai_aff')].map(n=>n.textContent.trim());
    // ORCID is read only from the author's own semantic container, never a whole paper.
    const person=node.closest('[itemtype="https://schema.org/Person"],[itemtype="http://schema.org/Person"],.ltx_personname');
    if(person){ctx.orcid=[...person.querySelectorAll('a[href]')].map(a=>a.href).find(E.orcidId);ctx.affiliations.push(...[...person.querySelectorAll('[itemprop="affiliation"]')].map(n=>n.textContent.trim()));}
    const entry=node.closest('li.arxiv-result,dd,.gs_r,.gsc_a_tr')||node.closest('.authors');
    if(entry)ctx.coauthors=[...entry.querySelectorAll('.authors a,.list-authors a,.gs_a a,[data-se-author]')].map(n=>n.textContent.trim());
    // A verified profile identifies its owner in publication bylines, including unlisted papers.
    // Never lend that identity to other authors or replace an explicit author identifier.
    if(node.closest('.gsc_a_tr')&&!E.scholarId(ctx.scholarUrl)&&!ctx.orcid){
      const heading=document.querySelector('#gsc_prf_in');
      const owner=heading&&E.authorFor(data,heading.textContent,null,{scholarUrl:location.href});
      const candidate=E.authorFor(data,name);
      if(owner?.identityVerified&&owner.identityLevel==='identifier'&&candidate?.identityId===owner.identityId){
        ctx.scholarUrl=location.href;
      }
    }
    return ctx;
  }
  function author(node,paper){const a=E.authorFor(data,node.textContent,paper,identityContext(node));if(!a || (a.role==='coauthor'&&(!prefs.showCoauthors||!a.identityVerified)))return;
    const labels={conflict:'Identity conflict',ambiguous:'Ambiguous identity',supported:'Identity supported, unverified',name:'Identity unverified'};
    badge(node,{author:a},!a.confirmed?labels[a.identityLevel]:a.role==='target'?'Under review':'Associated coauthor',!a.confirmed?'candidate':a.role==='target'?'target':'coauthor');}
  function authorText(container,paper){
    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){if(node.parentElement.closest('a,[data-se-badge],[data-se-author]'))continue;
      const pieces=node.textContent.split(/([,，;；]|\s+[–—-]\s+)/);const frag=document.createDocumentFragment();let changed=false;
      for(const part of pieces){if(/^\s+[–—-]\s+$/.test(part)){frag.append(document.createTextNode(part));continue;}
        const a=E.authorFor(data,part.trim(),paper,identityContext(container,part.trim()));if(a&&(a.role==='target'||(prefs.showCoauthors&&a.identityVerified))){const span=el('span',part);span.dataset.seAuthor='';textWrappers.add(span);frag.append(span);changed=true;}else frag.append(document.createTextNode(part));}
      if(changed){node.replaceWith(frag);}
    }
    container.querySelectorAll('[data-se-author]').forEach(n=>author(n,paper));
  }
  function clearMarks(){closeHover();for(const host of mounts.values())host.remove();mounts.clear();for(const span of textWrappers)if(span.isConnected)span.replaceWith(document.createTextNode(span.textContent));textWrappers.clear();}
  function scan(){
    if(!data || !prefs.enabled)return;
    observer?.disconnect();
    clearMarks();
    if(location.hostname.endsWith('arxiv.org')){
      const p=E.paperFor(data,'',[location.href]);
      if(p)badge(document.querySelector('h1.title,h1.ltx_title_document'),{paper:p},'Paper evidence');
      document.querySelectorAll('div.authors a,.ltx_personname').forEach(n=>author(n,p));
      document.querySelectorAll('div.authors').forEach(n=>authorText(n,p));
      document.querySelectorAll('li.arxiv-result,dt').forEach(row=>{
        const scope=row.matches('dt')?row.nextElementSibling:row;if(!scope)return;
        const title=scope.querySelector('.title,.list-title'), links=[...row.querySelectorAll('a[href]')].map(a=>a.href);
        const paper=E.paperFor(data,title?.textContent?.replace(/^Title:\s*/i,''),links);
        if(paper)badge(title,{paper},'Paper evidence');scope.querySelectorAll('.authors a,.list-authors a').forEach(n=>author(n,paper));scope.querySelectorAll('.authors,.list-authors').forEach(n=>authorText(n,paper));
      });
    }else{
      document.querySelectorAll('.gs_r,.gsc_a_tr,#gsc_oci').forEach(row=>{
        const title=row.querySelector('.gs_rt a,.gsc_a_at,#gsc_oci_title'),links=[...row.querySelectorAll('a[href]')].map(a=>a.href);
        const paper=E.paperFor(data,title?.textContent,links);if(paper)badge(title,{paper},'Paper evidence');
        row.querySelectorAll('.gs_a a,.gsc_a_tr .gs_gray:first-of-type a').forEach(n=>author(n,paper));
        row.querySelectorAll('.gs_a,.gsc_a_tr .gs_gray:first-of-type').forEach(n=>authorText(n,paper));
        if(row.id==='gsc_oci')row.querySelectorAll('.gs_scl').forEach(field=>{if(/^(Authors|\u4f5c\u8005)$/i.test(field.querySelector('.gsc_oci_field')?.textContent.trim()||'')){const value=field.querySelector('.gsc_oci_value');if(value)authorText(value,paper);}});
      });
      document.querySelectorAll('#gsc_prf_in,.gsc_rsb_aa a,.gs_ai_name a').forEach(n=>author(n,null));
    }
    observer?.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  async function reload(){const token=++epoch;const stored=await chrome.storage.local.get(['evidence','enabled','showCoauthors']);const next=stored.evidence || await (await fetch(chrome.runtime.getURL('evidence.json'))).json();if(token!==epoch)return;
    data=E.validate(next);prefs={enabled:stored.enabled!==false,showCoauthors:stored.showCoauthors!==false};observer?.disconnect();clearMarks();closePanel();scan();}
  observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,180);});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&['evidence','enabled','showCoauthors'].some(k=>changes[k]))reload().catch(console.warn);});
  document.addEventListener('scroll',e=>{if(!e.composedPath().some(n=>n.classList?.contains('hover-papers')))closeHover();},true);
  globalThis.addEventListener?.('resize',closeHover);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)closePanel();});
  reload().catch(e=>console.warn('Academic Misconduct Marker:',e.message));
})();
