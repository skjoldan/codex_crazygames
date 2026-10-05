import {dependency} from './dependencies.mjs';import assert from 'node:assert/strict';import {mkdir,writeFile,readFile} from 'node:fs/promises';import {spawn} from 'node:child_process';import {once} from 'node:events';
const {chromium}=dependency('playwright'),base='http://127.0.0.1:4174';
const server=spawn(process.execPath,['scripts/serve.mjs','--dist'],{env:{...process.env,PORT:'4174'},stdio:['ignore','pipe','inherit']});await once(server.stdout,'data');
let browser;const report={checks:[],errors:[],viewports:[],sdk:[]};await mkdir('submission/screenshots',{recursive:true});
try{
 browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}});const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(base+'/?qa=1');await page.waitForFunction(()=>window.__qa?.state);
 assert.equal(await page.locator('#chamber-title').textContent(),'First spark');
 await page.screenshot({path:'submission/screenshots/01-first-play-desktop.png'});
 // Real mouse input: center aim is the guided tutorial solution.
 let p=await page.evaluate(()=>window.__qa.point(300,300));await page.mouse.click(p.x,p.y);
 await page.waitForFunction(()=>document.querySelector('#modal-title')?.textContent==='Beautifully done.',{},{timeout:15000});
 assert.equal(await page.evaluate(()=>window.__qa.progress.stars[0]),3);report.checks.push('Mouse onboarding to first victory');
 await page.screenshot({path:'submission/screenshots/02-victory-desktop.png'});
 await page.locator('#result-next').click();assert.equal(await page.locator('#chamber-title').textContent(),'Side hustle');
 // Keyboard aim/fire, pause freezes physics, resume, rewind and restart.
 await page.locator('#game').focus();await page.keyboard.press('Space');await page.keyboard.press('KeyP');
 const paused=await page.evaluate(()=>window.__qa.state.shotTime);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__qa.state.shotTime),paused);
 await page.locator('#resume-btn').click();await page.waitForFunction(()=>window.__qa.state.phase!=='flight',{},{timeout:15000});
 await page.locator('#undo-btn').click();assert.equal(await page.evaluate(()=>window.__qa.state.used),0);report.checks.push('Keyboard fire / pause / resume / rewind');
 await page.locator('#sound-btn').click();await page.reload();await page.waitForFunction(()=>window.__qa?.state);assert.equal(await page.locator('#chamber-title').textContent(),'Side hustle');assert.equal(await page.evaluate(()=>window.__qa.progress.sound),false);report.checks.push('Progress and mute survive reload');
 await page.locator('#levels-btn').click();assert.equal(await page.locator('[data-level="2"]').isEnabled(),false);await page.locator('#menu-daily').click();assert.equal(await page.locator('#chamber-title').textContent(),'Daily reactor');report.checks.push('Campaign locks / daily reactor access');
 // Full campaign routes use the same live engine. This section accelerates QA only, not videos.
 const solutions=JSON.parse(await readFile('docs/level-solutions.json','utf8'));
 for(const solution of solutions.filter(x=>typeof x.id==='number')){
  await page.evaluate(i=>window.__qa.load(i),solution.id);
  for(const angle of solution.angles)await page.evaluate(a=>{window.__qa.shoot(a);window.__qa.advance(10);},angle);
  assert.equal(await page.evaluate(()=>window.__qa.state.phase),'won',solution.name);
 }
 report.checks.push('30 campaign victories through the browser runtime');
 // Pointer cancellation must not consume a volley.
 await page.evaluate(()=>window.__qa.load(0));p=await page.evaluate(()=>window.__qa.point(280,400));await page.mouse.move(p.x,p.y);await page.mouse.down();await page.dispatchEvent('#game','pointercancel',{pointerId:1});await page.mouse.up();assert.equal(await page.evaluate(()=>window.__qa.state.used),0);report.checks.push('Cancelled pointer does not fire');
 // A genuine loss state can always be retried.
 await page.evaluate(()=>{window.__qa.load(3);for(let i=0;i<4;i++){window.__qa.shoot(-Math.PI/2);window.__qa.advance(10);}});
 await page.waitForFunction(()=>document.querySelector('#modal-title')?.textContent==='Almost there.');await page.locator('#result-next').click();assert.equal(await page.evaluate(()=>window.__qa.state.used),0);report.checks.push('Loss / retry loop');
 for(const [width,height] of [[1280,720],[907,510],[821,462],[800,450],[390,844],[360,640],[800,1200]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>window.__qa.load(17));await page.waitForTimeout(80);
  const bounds=await page.evaluate(()=>{const ids=['game','pause-btn','retry-btn','levels-btn','chamber-title'];return ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};});});
  for(const r of bounds){assert.ok(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,`${width}x${height}: ${r.id} off screen`);assert.ok(r.w>0&&r.h>0);}
  await page.screenshot({path:`submission/screenshots/layout-${width}x${height}.png`});report.viewports.push({width,height,bounds});
 }
 // Real touch input in mobile mode.
 const touchCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const mobile=await touchCtx.newPage();mobile.on('pageerror',e=>report.errors.push(e.message));await mobile.goto(base+'/?qa=1');await mobile.waitForFunction(()=>window.__qa?.state);p=await mobile.evaluate(()=>window.__qa.point(300,300));await mobile.touchscreen.tap(p.x,p.y);await mobile.waitForFunction(()=>window.__qa.state.phase==='won',{},{timeout:15000});report.checks.push('Mobile touch to victory');await touchCtx.close();
 // SDK v3 contract test: production adapter loads the script, awaits init, then reports state.
 const sdk=await ctx.newPage();await sdk.route('https://sdk.crazygames.com/**',route=>route.fulfill({contentType:'text/javascript',body:`window.sdkEvents=[];window.CrazyGames={SDK:{init:async()=>{await new Promise(r=>setTimeout(r,50));window.sdkEvents.push('init');},game:Object.fromEntries(['loadingStart','loadingStop','gameplayStart','gameplayStop','happytime','reportGameCompletedPercentage'].map(k=>[k,(...args)=>window.sdkEvents.push(k)])),data:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}}};`}));
 await sdk.goto(base+'/?qa=1&sdk=1');await sdk.waitForFunction(()=>window.__qa?.state);await sdk.locator('#pause-btn').click();await sdk.locator('#resume-btn').click();report.sdk=await sdk.evaluate(()=>window.sdkEvents);assert.deepEqual(report.sdk.slice(0,4),['init','loadingStart','loadingStop','gameplayStart']);assert.deepEqual(report.sdk.slice(-2),['gameplayStop','gameplayStart']);report.checks.push('SDK init ordering, start/stop and resume (mocked SDK)');
 // Standalone HTML is also syntax-checked by the build; serve it for the input smoke test.
 const solo=await ctx.newPage();await solo.route('**/standalone.html*',async route=>route.fulfill({contentType:'text/html',body:await readFile('submission/play-ricochet-foundry.html','utf8')}));await solo.goto(base+'/standalone.html?qa=1');await solo.waitForFunction(()=>window.__qa?.state);await solo.evaluate(()=>window.__qa.load(0));const sp=await solo.evaluate(()=>window.__qa.point(300,300));await solo.mouse.click(sp.x,sp.y);await solo.waitForFunction(()=>window.__qa.state.phase==='won',{},{timeout:15000});report.checks.push('Self-contained HTML input-to-victory smoke test');
 assert.equal(report.errors.length,0,report.errors.join('\n'));report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;throw error;}finally{await writeFile('docs/browser-test-report.json',JSON.stringify(report,null,2));await browser?.close();server.kill();console.log(JSON.stringify(report,null,2));}
