const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
let browser,context,page;
const base='https://ledger.test/Academic-Misconduct-Marker/';
test.beforeEach(async()=>{
 browser=await chromium.launch({channel:'chromium',headless:true});context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('https://ledger.test/**',route=>{
  const relative=new URL(route.request().url()).pathname.replace('/Academic-Misconduct-Marker/','')||'index.html';
  const name=relative.endsWith('/')?relative+'index.html':relative;
  if(name.includes('..')||!fs.existsSync(path.resolve('docs',name)))return route.fulfill({status:404,body:'Not found'});
  const types={html:'text/html',css:'text/css',js:'text/javascript',svg:'image/svg+xml',json:'application/json',png:'image/png'};
  return route.fulfill({contentType:types[name.split('.').pop()],body:fs.readFileSync(path.resolve('docs',name))});
 });page=await context.newPage();
});
test.afterEach(async()=>{await context?.close();await browser?.close();});
test('ledger loads, composes filters, excludes corrected entries, and links evidence',async()=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await expect(page.locator('.paper')).toHaveCount(19);
 await page.getByLabel('Search papers or authors').fill('Sixun Dong');await expect(page.locator('.paper')).toHaveCount(19);
 await page.getByLabel('Finding type').selectOption('reporting_error');await page.getByLabel('Search papers or authors').fill('LogicIF');await expect(page.locator('.paper')).toHaveCount(1);
 await expect(page.locator('.finding')).toHaveCount(1);await expect(page.getByRole('heading',{name:'Reason for flagging'})).toBeVisible();await expect(page.getByRole('heading',{name:'Correction context'})).toHaveCount(0);
 await expect(page.locator('.paper .score')).toHaveAttribute('aria-label','Review priority: 3 of 8 points');
 await expect(page.locator('.record-links a').first()).toHaveAttribute('href',/\/papers\/2508.09125.md$/);
 await page.getByLabel('Search papers or authors').fill('does not exist');await expect(page.getByText('No papers match these filters.')).toBeVisible();
 await page.getByRole('button',{name:'Clear filters'}).click();await expect(page.locator('.paper')).toHaveCount(19);expect(errors).toEqual([]);
});
test('weights update scores, reset, and do not persist across reloads',async()=>{
 await page.goto(base);await expect(page.locator('.paper')).toHaveCount(19);await page.locator('.weight-panel summary').click();
 await page.getByLabel('Reporting inconsistency',{exact:true}).fill('0');await page.getByLabel('Reporting inconsistency',{exact:true}).blur();
 await expect(page.locator('#paper-2506\\.24124 .score')).toHaveAttribute('aria-label','Review priority: 2 of 5 points');
 await expect(page.locator('#score-mode')).toHaveText('Custom weights · this tab');
 await page.getByRole('button',{name:'Reset weights'}).click();await expect(page.locator('#paper-2506\\.24124 .score')).toHaveAttribute('aria-label','Review priority: 5 of 8 points');
 await page.getByLabel('Reporting inconsistency',{exact:true}).fill('0');await page.getByLabel('Reporting inconsistency',{exact:true}).blur();
 await page.reload();await expect(page.locator('#score-mode')).toHaveText('Default weights');
});
test('paper permalinks open the record; mobile layout has no horizontal overflow',async()=>{
 await page.goto(base+'#paper-2506.24124');await expect(page.locator('#paper-2506\\.24124 details')).toHaveAttribute('open','');
 await page.goto(base);await expect(page.locator('.paper')).toHaveCount(19);await page.getByLabel('Search papers or authors').fill('2506.24124');await page.locator('.paper').scrollIntoViewIfNeeded();await page.screenshot({path:test.info().outputPath('website-desktop.png')});
 await page.setViewportSize({width:390,height:844});await expect(page.locator('.paper')).toHaveCount(1);await page.locator('.paper summary').scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath('website-mobile.png')});
});
test('failed snapshot fetch gives a readable repository fallback',async()=>{
 await context.route('**/data.json*',r=>r.fulfill({status:503,body:'Unavailable'}));await page.goto(base);
 await expect(page.getByRole('status')).toContainText('could not be loaded');await expect(page.getByRole('link',{name:'Read the evidence on GitHub'})).toBeVisible();
});


test('only active-issue papers are listed and their evidence is visible without expanding',async()=>{
 await page.goto(base);await expect(page.locator('.paper')).toHaveCount(19);
 await expect(page.locator('.paper details[open]')).toHaveCount(19);
 await expect(page.locator('.finding')).toHaveCount(33);
 await expect(page.locator('#status option[value="corrected"]')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Reason for flagging',exact:true})).toHaveCount(33);
 await expect(page.locator('#status option[value="no_confirmed_issue"]')).toHaveCount(0);
 await expect(page.locator('#status option[value="needs_clarification"]')).toHaveCount(0);
 for(const id of ['2505.15076','2508.15760']){await page.locator('#search').fill(id);await expect(page.locator('.paper')).toHaveCount(0);}
 await page.locator('#search').fill('2506.24124');await expect(page.getByText(/0.063 \+ 0.074/)).toBeVisible();
 await expect(page.getByRole('link',{name:'Author response',exact:false}).first()).toHaveAttribute('href','https://github.com/Ironieser/TimesCLIP/issues/1');
});


test('Chinese route translates evidence, searches original titles and switches paper anchors',async()=>{
 const z=require('../../locales/ui.zh-CN.json'),translation=require('../../evidence-database/locales/zh-CN.json');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'zh/#paper-2506.24124');await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
 await expect(page.locator('.paper')).toHaveCount(19);
 await expect(page.locator('#paper-2506\\.24124 h3')).toHaveText(require('../../evidence-database/database.json').papers.find(p=>p.id==='2506.24124').title);
 await expect(page.getByRole('heading',{name:z.sections['Reason for flagging'],exact:true})).toHaveCount(33);
 await page.locator('#search').fill('Teaching Time Series');await expect(page.locator('.paper')).toHaveCount(1);
 await page.locator('#search').fill(require('../../evidence-database/database.json').papers.find(p=>p.id==='2508.18264').title);await expect(page.locator('.paper')).toHaveCount(1);
 await page.locator('.weight-panel summary').click();await page.getByLabel(z.labels.reporting_error,{exact:true}).fill('0');await page.getByLabel(z.labels.reporting_error,{exact:true}).blur();
 await expect(page.locator('#score-mode')).toHaveText(z.strings.customWeights);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#language-switch').click();await expect(page).toHaveURL(base+'#paper-2506.24124');await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('heading',{name:'Reason for flagging',exact:true})).toHaveCount(33);expect(errors).toEqual([]);
});


test('published pages bypass unversioned cached scripts and omit scoring prose',async()=>{
 const requests=[];
 page.on('request',request=>{const url=new URL(request.url());if(/\.(js|css|json)$/.test(url.pathname))requests.push(url);});
 await context.route(/\.(js|css|json)$/,route=>route.fulfill({status:500,body:'Stale unversioned cache entry'}));
 for(const route of [base,base+'zh/']){
  await page.goto(route);
  await expect(page.locator('.paper')).toHaveCount(19);
  await expect(page.locator('.breakdown')).toHaveCount(0);
 }
 expect(requests.length).toBeGreaterThan(0);
 expect(requests.every(url=>/^[a-f0-9]{16}$/.test(url.searchParams.get('v')||''))).toBe(true);
});
