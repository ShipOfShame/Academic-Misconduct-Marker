(() => {
  'use strict';
  const E=globalThis.ScholarEvidence,$=id=>document.getElementById(id);let data;
  const status=s=>{$('status').textContent=s;};
  async function refresh(){const s=await chrome.storage.local.get(['evidence','enabled','showCoauthors']);data=E.validate(s.evidence || await (await fetch(chrome.runtime.getURL('evidence.json'))).json());
    $('enabled').checked=s.enabled!==false;$('showCoauthors').checked=s.showCoauthors!==false;
    const people=new Set(data.papers.flatMap(p=>p.authors).map(E.normalize));
    $('coverage').textContent=`${data.papers.length} papers · ${people.size} author names · Updated ${data.updated}. Coverage is limited to these papers, not a complete collaboration network.`;
    if($('papers')){$('papers').replaceChildren();for(const p of data.papers){const row=document.createElement('section');row.className='paper';const h=document.createElement('h3');const a=document.createElement('a');a.textContent=p.title;a.href=p.url;a.target='_blank';a.rel='noopener noreferrer';h.append(a);const authors=document.createElement('p');authors.className='muted';authors.textContent=p.authors.join(' · ');row.append(h,authors);for(const f of p.findings){const tag=document.createElement('span');tag.className='tag';tag.textContent=E.labels[f.status];row.append(tag);}const evidence=document.createElement('a');evidence.textContent='Read detailed evidence';evidence.href=chrome.runtime.getURL('evidence.html')+'#'+encodeURIComponent(p.id);evidence.target='_blank';evidence.rel='noopener noreferrer';const evidenceRow=document.createElement('p');evidenceRow.append(evidence);row.append(evidenceRow);$('papers').append(row);}}
  }
  for(const key of ['enabled','showCoauthors'])$(key).addEventListener('change',async()=>{try{await chrome.storage.local.set({[key]:$(key).checked});status('Saved. Open pages will update automatically.');}catch(e){status('Could not save: '+e.message);}});
  $('options')?.addEventListener('click',()=>chrome.runtime.openOptionsPage());
  $('export')?.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='academic-misconduct-marker-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('import')?.addEventListener('change',async()=>{try{const f=$('import').files[0];if(!f)return;if(f.size>2*1024*1024)throw new Error('The file exceeds 2 MB.');const next=E.validate(JSON.parse(await f.text()));await chrome.storage.local.set({evidence:next});await refresh();status('Evidence replaced. Page markers will update automatically.');}catch(e){status('Not imported: '+e.message);}finally{$('import').value='';}});
  $('reset')?.addEventListener('click',async()=>{if(!confirm('Restoring bundled evidence will replace your custom records. Export a backup first if needed. Continue?'))return;await chrome.storage.local.remove('evidence');await refresh();status('Bundled evidence restored.');});
  refresh().catch(e=>status('Could not load: '+e.message));
})();
