const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true});
 try{
  const page=await browser.newPage();
  async function png(svg,size,file,height=size){const url=await page.evaluate(async({svg,size,height})=>{const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await img.decode();const canvas=document.createElement('canvas');canvas.width=size;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0,size,height);return canvas.toDataURL('image/png');},{svg,size,height});fs.writeFileSync(file,Buffer.from(url.split(',')[1],'base64'));}
  const logo=fs.readFileSync('extension/icons/icon.svg','utf8');
  for(const size of [16,32,48,128])await png(logo,size,`extension/icons/icon-${size}.png`);
  await png(logo,256,'docs/assets/icon-256.png');
  for(const lang of ['en','zh-CN'])await png(fs.readFileSync(`docs/assets/social-${lang}.svg`,'utf8'),1200,`docs/assets/social-${lang}.png`,630);
  console.log('Rendered 5 icon PNGs and 2 social previews from vector sources.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
