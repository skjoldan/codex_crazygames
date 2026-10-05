import {dependency} from './dependencies.mjs';import {spawn,execFileSync} from 'node:child_process';import {once} from 'node:events';import {readFile,mkdir} from 'node:fs/promises';
const {chromium}=dependency('playwright');const server=spawn(process.execPath,['scripts/serve.mjs','--dist'],{env:{...process.env,PORT:'4175'},stdio:['ignore','pipe','inherit']});await once(server.stdout,'data');const browser=await chromium.launch({headless:true});
const solutions=JSON.parse(await readFile('docs/level-solutions.json','utf8'));await mkdir('submission/videos',{recursive:true});await mkdir('.tmp/recordings',{recursive:true});
try{for(const [name,width,height,cover] of [['landscape',1920,1080,'1920x1080'],['portrait',1080,1620,'800x1200']]){
 const ctx=await browser.newContext({viewport:{width,height},recordVideo:{dir:'.tmp/recordings',size:{width,height}}});const page=await ctx.newPage();await page.goto('http://127.0.0.1:4175/?qa=1');await page.waitForFunction(()=>window.__qa?.state);await page.addStyleTag({content:'*{cursor:none!important}#toast,#tutorial{display:none!important}'});
 await page.evaluate(()=>{window.__qa.progress.sound=false;window.__qa.load(17);});await page.waitForTimeout(1200);
 for(const id of [17,24,29]){await page.evaluate(i=>window.__qa.load(i),id);await page.waitForTimeout(700);await page.evaluate(a=>window.__qa.shoot(a),solutions[id].angles[0]);await page.waitForTimeout(5300);}
 await page.waitForTimeout(800);const video=page.video();await ctx.close();const path=await video.path();
 // Real-time browser footage; replace the opening frame with the matching cover.
 execFileSync('ffmpeg',['-y','-loop','1','-framerate','30','-t','0.033333','-i',`submission/covers/${name}-${cover}.png`,'-i',path,'-filter_complex',`[0:v]scale=${width}:${height},setsar=1,format=yuv420p[c];[1:v]trim=start=1:end=19,setpts=PTS-STARTPTS,fps=30,scale=${width}:${height},setsar=1,format=yuv420p[g];[c][g]concat=n=2:v=1:a=0[v]`,'-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart',`submission/videos/${name}-preview.mp4`],{stdio:'ignore'});
 console.log(`${name} real-time browser preview recorded.`);
 }}finally{await browser.close();server.kill();}
