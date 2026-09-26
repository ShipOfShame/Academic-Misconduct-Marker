(async()=>{
 const E=globalThis.ScholarEvidence,root=document.getElementById('record');
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const link=(text,url)=>{const n=el('a',text);n.href=E.safeUrl(url);n.target='_blank';n.rel='noopener noreferrer';return n;};
 async function render(){try{
  const stored=await chrome.storage.local.get(['evidence']);
  const data=E.validate(stored.evidence||await(await fetch(chrome.runtime.getURL('evidence.json'))).json());
  const p=data.papers.find(p=>p.id===decodeURIComponent(location.hash.slice(1)));
  document.getElementById('notice').textContent=data.notice;root.replaceChildren();
  if(!p){root.append(el('p','No evidence record found for this paper.'));return;}
  root.append(el('h2',p.title),link('Read paper ↗',p.url),el('p',p.authors.join(' · ')));
  root.append(el('p','Paper-level findings do not establish wrongdoing by every coauthor.'));
  for(const f of p.findings){const section=el('section','');section.append(el('h3',f.title),el('p',E.labels[f.status]),el('p',f.detail));for(const item of E.findingSections(f))section.append(el('h4',item.label),el('p',item.text));for(const source of f.evidence?.sources||[{label:'Original source',url:f.url,location:''}])section.append(link(source.label+' ↗',source.url),el('p',source.location));section.append(el('p','Checked: '+f.checked));root.append(section);}
 }catch{root.replaceChildren(el('p','The evidence record could not be loaded.'));}}
 addEventListener('hashchange',render);await render();
})();
