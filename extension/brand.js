/* Original vector marks. Geometry is shared by assets and injected page markers. */
(function(root){
  'use strict';
  const palettes={target:'#b4232c',coauthor:'#b85108',candidate:'#667078'};
  const frame=[{tag:'path',attrs:{d:'M10 6H6v20h4M22 6h4v20h-4',fill:'none',stroke:'currentColor','stroke-width':'2.4','stroke-linecap':'round','stroke-linejoin':'round'}}];
  const symbols={
    target:[...frame,{tag:'path',attrs:{d:'M16 10v8',stroke:'currentColor','stroke-width':'3','stroke-linecap':'round'}},{tag:'circle',attrs:{cx:'16',cy:'23',r:'1.7',fill:'currentColor'}}],
    coauthor:[...frame,{tag:'path',attrs:{d:'m17 12 1-1a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0m1 1-1 1a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m-4 4 6-6',fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round'}}],
    candidate:[...frame,{tag:'path',attrs:{d:'M12.5 12a3.5 3.5 0 0 1 7 0c0 3-3.5 3-3.5 6',fill:'none',stroke:'currentColor','stroke-width':'2.6','stroke-linecap':'round'}},{tag:'circle',attrs:{cx:'16',cy:'23',r:'1.5',fill:'currentColor'}}]
  };
  const attrs=o=>Object.entries(o).map(([k,v])=>`${k}="${v}"`).join(' ');
  const shapes=role=>symbols[role]||symbols.candidate;
  function markerSvg(role){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>${role} evidence marker</title><rect width="32" height="32" rx="7" fill="${palettes[role]||palettes.candidate}"/><g color="#fff">${shapes(role).map(s=>`<${s.tag} ${attrs(s.attrs)}/>`).join('')}</g></svg>
`;}
  const logoSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Academic Misconduct Marker</title><desc>Red and orange evidence brackets around a white attention mark.</desc><rect width="64" height="64" rx="15" fill="#211a1b"/><path d="M24 13H13v38h11" fill="none" stroke="#f14d4d" stroke-width="6" stroke-linecap="square" stroke-linejoin="round"/><path d="M40 13h11v38H40" fill="none" stroke="#ff9b45" stroke-width="6" stroke-linecap="square" stroke-linejoin="round"/><path d="M32 20v16" stroke="#fff8ef" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="45" r="3.2" fill="#fff8ef"/></svg>\n';
  const api={palettes,shapes,markerSvg,logoSvg};root.EvidenceBrand=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
