import {dependency} from './dependencies.mjs';import {mkdir,writeFile} from 'node:fs/promises';import {Renderer,rounded} from '../src/render.js';import {makeState,shoot,step,STEP} from '../src/engine.js';import {LEVELS,seedRandom} from '../src/levels.js';
const {createCanvas,GlobalFonts}=dependency('@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','Foundry');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Arial');
const random=seedRandom(62819);globalThis.window={devicePixelRatio:1};
function wrap(canvas){canvas.getBoundingClientRect=()=>({width:canvas.width,height:canvas.height,left:0,top:0});return canvas;}
function text(c,txt,x,y,size,color='#f8ecd5',align='left'){c.font=`900 ${size}px Foundry, Arial`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(txt,x,y);}
export function cover(width,height){
 const cv=createCanvas(width,height),c=cv.getContext('2d');const portrait=height>=width,unit=Math.min(width/800,height/800);c.scale(unit,unit);const w=width/unit,h=height/unit;
 const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#1d4047');bg.addColorStop(.6,'#122c39');bg.addColorStop(1,'#0a1a28');c.fillStyle=bg;c.fillRect(0,0,w,h);
 c.strokeStyle='#6aa29116';c.lineWidth=2;for(let i=-h;i<w;i+=52){c.beginPath();c.moveTo(i,0);c.lineTo(i+h,h);c.stroke();}
 const gx=portrait?w*.5:w*.74,gy=portrait?h*.66:h*.5;
 const glow=c.createRadialGradient(gx,gy,0,gx,gy,520);glow.addColorStop(0,'#73efbf35');glow.addColorStop(1,'#73efbf00');c.fillStyle=glow;c.fillRect(0,0,w,h);
 // Native game block art, composed into an original promotional scene.
 c.save();c.translate(gx,gy);c.rotate(-.17);const render=Object.create(Renderer.prototype);render.c=c;
 const positions=[[-172,-195,'core',3],[-86,-195,'core',2],[0,-195,'bomb',1],[86,-195,'core',3],[172,-195,'core',4],[-172,-109,'core',2],[-86,-109,'split',1],[86,-109,'core',2],[172,-109,'core',3],[-172,-23,'steel',999],[172,-23,'bomb',1],[86,63,'split',1],[172,63,'core',2]];
 for(const [x,y,type,hp] of positions)render.drawBlock({x,y,w:76,h:74,type,hp,flash:0},1);
 c.restore();
 // A deliberate bankshot trail leads the eye into the shattering reactor.
 const path=portrait?[[w*.2,h*.88],[w*.94,h*.69],[w*.57,h*.56]]:[[w*.4,h*.86],[w*.96,h*.68],[w*.76,h*.48]];
 c.lineCap='round';c.lineJoin='round';for(const [lineWidth,color] of [[30,'#77edcc10'],[18,'#77edcc20'],[8,'#9dffe4'],[3,'#effff2']]){c.strokeStyle=color;c.lineWidth=lineWidth;c.beginPath();path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 const [ex,ey]=path.at(-1);c.strokeStyle='#ffcd9290';c.lineWidth=3;c.beginPath();c.arc(ex,ey,57,0,Math.PI*2);c.stroke();
 for(let i=0;i<42;i++){const a=random()*Math.PI*2,r=30+random()*140;c.save();c.translate(ex+Math.cos(a)*r,ey+Math.sin(a)*r);c.rotate(a);c.fillStyle=['#ffbe79','#ff8a7c','#9ff8d6'][i%3];const size=3+random()*10;c.fillRect(-size/2,-size/2,size,size*1.5);c.restore();}
 c.shadowColor='#a3ffe1';c.shadowBlur=30;c.fillStyle='#dffff1';c.beginPath();c.arc(ex,ey,18,0,Math.PI*2);c.fill();c.shadowBlur=0;
 // Only the game's title appears on covers, as required by CrazyGames.
 const tx=portrait?w/2:65,ty=portrait?135:255,align=portrait?'center':'left',size=portrait?83:90;
 c.save();c.translate(tx,ty);c.transform(1,0,-.06,1,0,0);c.font=`900 ${size}px Foundry, Arial`;c.textAlign=align;c.textBaseline='middle';c.lineJoin='round';c.lineWidth=12;c.strokeStyle='#0c2230';c.strokeText('RICOCHET',0,0);c.strokeText('FOUNDRY',0,size*1.06);text(c,'RICOCHET',0,0,size,'#f5e8ce',align);text(c,'FOUNDRY',0,size*1.06,size,'#ffbe79',align);c.restore();
 return cv;
}
await mkdir('submission/covers',{recursive:true});for(const [name,w,h] of [['landscape',1920,1080],['portrait',800,1200],['square',800,800]]){const cv=cover(w,h);await writeFile(`submission/covers/${name}-${w}x${h}.png`,cv.toBuffer('image/png'));}
// A direct-render proof image, clearly separated from browser screenshots.
const cv=wrap(createCanvas(600,720)),render=new Renderer(cv),state=makeState(LEVELS[17]);shoot(state,-1.88);for(let i=0;i<160;i++){step(state,STEP);for(const e of state.events)render.effects(e);state.events=[];if(i%2===0)render.draw(state,-1.88,1/60);}render.draw(state,-1.88,1/60);await mkdir('submission/render-previews',{recursive:true});await writeFile('submission/render-previews/game-render.png',cv.toBuffer('image/png'));
console.log('Created all three covers and a direct game-render preview.');
