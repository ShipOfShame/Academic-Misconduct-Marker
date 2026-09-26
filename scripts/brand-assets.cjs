const B=require('../extension/brand.js');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const font='Arial, PingFang SC, Microsoft YaHei, sans-serif';
const logo=(x,y,size)=>B.logoSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',`<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 64 64">`);
function cover(copy,social=false){
 const w=social?1200:960,h=social?630:280;
 const x=social?70:40,y=social?70:36,size=social?112:72;
 const titleY=social?280:92;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(copy.title)}">
<title>${esc(copy.title)}</title><desc>${esc(copy.subtitle)}</desc>
<rect width="${w}" height="${h}" rx="20" fill="#faf8f4"/>
<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="19" fill="none" stroke="#e5dfd5"/>
${logo(x,y,size)}
<g font-family="${font}" fill="#211a1b">
<text x="${social?x:134}" y="${social?y+38:53}" font-size="${social?17:12}" letter-spacing="2.4" fill="#7b6c65" ${social?'transform="translate(140 0)"':''}>ARXIV / GOOGLE SCHOLAR</text>
<text x="${social?x:134}" y="${titleY}" font-size="${social?50:35}" font-weight="700">${esc(copy.title)}</text>
<text x="${social?x:134}" y="${titleY+(social?55:33)}" font-size="${social?25:17}" fill="#625550">${esc(copy.subtitle)}</text>
<path d="M${x} ${h-91}H${w-x}" stroke="#ddd5cb"/>
<rect x="${x}" y="${h-61}" width="8" height="8" rx="2" fill="#b4232c"/>
<text x="${x+18}" y="${h-50}" font-size="${social?18:14}">${esc(copy.subject)}</text>
<rect x="${social?400:285}" y="${h-61}" width="8" height="8" rx="2" fill="#b85108"/>
<text x="${social?418:303}" y="${h-50}" font-size="${social?18:14}">${esc(copy.coauthor)}</text>
<text x="${w-x}" y="${h-50}" text-anchor="end" font-size="${social?18:13}" fill="#7b6c65">${social?'ShipOfShame / Academic-Misconduct-Marker':'MIT / CHROME EXTENSION'}</text>
</g></svg>\n`;
}
function badge(label,value,color){
 const left=label.length*7+20,right=String(value).length*8+24,w=left+right;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="24" role="img" aria-label="${esc(label)}: ${value}"><title>${esc(label)}: ${value}</title><rect width="${w}" height="24" rx="4" fill="#37302e"/><path d="M${left} 0H${w-4}q4 0 4 4v16q0 4-4 4H${left}Z" fill="${color}"/><g fill="#fff" font-family="Arial,sans-serif" font-size="11" text-anchor="middle"><text x="${left/2}" y="16">${esc(label)}</text><text x="${left+right/2}" y="16">${value}</text></g></svg>\n`;
}
module.exports=(data,zh)=>{
 const out=new Map();
 const en={title:'Academic Misconduct Marker',subtitle:'Paper records and source links in your browser.',subject:'Review subject',coauthor:'Verified coauthor'};
 for(const [lang,copy] of [['en',en],['zh-CN',zh]]){
  out.set(`docs/assets/banner-${lang}.svg`,cover(copy));
  out.set(`docs/assets/social-${lang}.svg`,cover(copy,true));
 }
 out.set('docs/assets/badge-papers.svg',badge('papers',data.papers.length,'b4232c'));
 out.set('docs/assets/badge-findings.svg',badge('open issues',data.papers.reduce((n,p)=>n+p.findings.length,0),'b85108'));
 return out;
};
