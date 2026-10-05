import {W,H,LEFT,RIGHT,TOP,FLOOR,trajectory} from './engine.js';
const COLORS={core:['#f3ca91','#ffb776','#efa361','#e394a0'],bomb:'#ff8279',split:'#78ddca',steel:'#39515d'};
export function rounded(c,x,y,w,h,r=8){c.beginPath();c.roundRect(x,y,w,h,r);}
function label(c,text,x,y,size,color,weight='bold',align='center'){c.fillStyle=color;c.font=`${weight} ${size}px Arial`;c.textAlign=align;c.textBaseline='middle';c.fillText(text,x,y);}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.particles=[];this.rings=[];this.words=[];this.time=0;this.shake=0;this.scale=1;this.ox=0;this.oy=0;this.motion=true;this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.scale=Math.min(r.width/W,r.height/H)*dpr;this.ox=(this.canvas.width-W*this.scale)/2;this.oy=(this.canvas.height-H*this.scale)/2;}
 point(clientX,clientY){const r=this.canvas.getBoundingClientRect(),dpr=this.canvas.width/r.width;return {x:((clientX-r.left)*dpr-this.ox)/this.scale,y:((clientY-r.top)*dpr-this.oy)/this.scale};}
 screenPoint(x,y){const r=this.canvas.getBoundingClientRect(),dpr=this.canvas.width/r.width;return {x:r.left+(this.ox+x*this.scale)/dpr,y:r.top+(this.oy+y*this.scale)/dpr};}
 effects(e){
 if(e.type==='break'){const color=e.kind==='bomb'?COLORS.bomb:e.kind==='split'?COLORS.split:COLORS.core[1];for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,s=50+Math.random()*160;this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45+Math.random()*.35,max:.8,size:2+Math.random()*5,color});}if(e.combo===3||e.combo===6||e.combo===10||e.combo===15||e.combo%10===0)this.words.push({x:e.x,y:e.y,text:e.combo+' CHAIN',life:1.1,color});this.shake=Math.max(this.shake,2);}
 if(e.type==='blast'){this.rings.push({x:e.x,y:e.y,r:10,life:.5,color:COLORS.bomb,maxR:113});this.shake=6;}
 if(e.type==='split')this.rings.push({x:e.x,y:e.y,r:5,life:.4,color:COLORS.split,maxR:55});
 if(e.type==='win'){for(let i=0;i<100;i++){const a=Math.random()*Math.PI*2,s=100+Math.random()*250;this.particles.push({x:300,y:260,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:1+Math.random(),max:2,size:3+Math.random()*6,color:[COLORS.core[1],COLORS.split,COLORS.bomb][i%3]});}}
 }
 drawBlock(b,time=0){const c=this.c,{x,y,w,h}=b;const fill=COLORS[b.type]==null?COLORS.core[Math.min(3,b.hp-1)]:COLORS[b.type];
 c.fillStyle='#060f1666';rounded(c,x,y+7,w,h,11);c.fill();
 c.fillStyle=b.type==='core'?COLORS.core[Math.min(3,b.hp-1)]:fill;rounded(c,x,y,w,h,10);c.fill();
 c.fillStyle=b.type==='steel'?'#4e6875':'#ffffff35';rounded(c,x+3,y+3,w-6,5,3);c.fill();
 c.fillStyle='#0c1d2630';rounded(c,x+3,y+h-8,w-6,5,3);c.fill();
 if(b.type==='core'){
  c.strokeStyle='#664b3830';c.lineWidth=1.3;rounded(c,x+10,y+11,w-20,h-23,5);c.stroke();
  label(c,String(b.hp),x+w/2,y+h/2,25,'#634b39');
  for(let j=0;j<b.hp;j++){c.fillStyle='#62483380';c.beginPath();c.arc(x+w/2+(j-(b.hp-1)/2)*7,y+h-14,1.6,0,Math.PI*2);c.fill();}
 }else if(b.type==='bomb'){
  const cx=x+w/2,cy=y+h/2;c.strokeStyle='#713e3d';c.lineWidth=2;c.beginPath();c.arc(cx,cy,15,0,Math.PI*2);c.stroke();c.fillStyle='#713e3d';c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6-Math.PI/2,r=i%2===0?11:5;c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}c.closePath();c.fill();c.fillStyle='#fff3cf';c.beginPath();c.arc(cx,cy,3+Math.sin(time*3)*.7,0,Math.PI*2);c.fill();
 }else if(b.type==='split'){
  c.strokeStyle='#245950';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(x+w/2,y+h-17);c.lineTo(x+w/2,y+h/2);c.lineTo(x+19,y+18);c.moveTo(x+w/2,y+h/2);c.lineTo(x+w-19,y+18);c.stroke();for(const xx of [x+19,x+w-19]){c.fillStyle='#e1fff0';c.beginPath();c.arc(xx,y+17,3,0,Math.PI*2);c.fill();}
 }else{
  c.strokeStyle='#172d37';c.lineWidth=4;c.beginPath();c.moveTo(x+20,y+21);c.lineTo(x+w-20,y+h-21);c.moveTo(x+w-20,y+21);c.lineTo(x+20,y+h-21);c.stroke();c.fillStyle='#92aab5';for(const xx of [x+10,x+w-10])for(const yy of [y+12,y+h-12]){c.beginPath();c.arc(xx,yy,2,0,Math.PI*2);c.fill();}
 }
 if(b.flash>0){c.globalAlpha=b.flash/.16*.7;c.fillStyle='#fff';rounded(c,x,y,w,h,10);c.fill();c.globalAlpha=1;}
 }
 draw(s,angle,dt,aiming=false){const c=this.c;this.time+=dt;const t=this.time;
 c.setTransform(1,0,0,1,0,0);c.fillStyle='#11232c';c.fillRect(0,0,this.canvas.width,this.canvas.height);c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);
 c.save();if(this.motion&&this.shake>.2)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);this.shake*=Math.exp(-dt*12);
 const bg=c.createLinearGradient(0,0,600,720);bg.addColorStop(0,'#19333d');bg.addColorStop(1,'#122630');c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.fillStyle='#61889424';for(let x=48;x<580;x+=24)for(let y=48;y<650;y+=24){c.beginPath();c.arc(x,y,1,0,Math.PI*2);c.fill();}
 c.strokeStyle='#39535e';c.lineWidth=2;rounded(c,LEFT-10,TOP-12,RIGHT-LEFT+20,FLOOR-TOP+24,13);c.stroke();
 c.strokeStyle='#75d8c341';c.lineWidth=3;c.beginPath();c.moveTo(LEFT-4,TOP+60);c.lineTo(LEFT-4,TOP+4);c.lineTo(LEFT+50,TOP+4);c.moveTo(RIGHT+4,TOP+60);c.lineTo(RIGHT+4,TOP+4);c.lineTo(RIGHT-50,TOP+4);c.stroke();
 label(c,'R F   /   ENERGY CONTAINMENT',300,62,9,'#78969b','normal');
 c.strokeStyle='#69858c';c.lineWidth=1;c.setLineDash([3,8]);c.beginPath();c.moveTo(LEFT,FLOOR+15);c.lineTo(RIGHT,FLOOR+15);c.stroke();c.setLineDash([]);
 for(let x=60;x<560;x+=24){c.fillStyle='#5e76864a';c.beginPath();c.moveTo(x,688);c.lineTo(x+7,681);c.lineTo(x+10,684);c.lineTo(x+3,691);c.fill();}
 for(const b of s.blocks)if(b.alive)this.drawBlock(b,t);
 if(s.phase==='aim'){
  const points=trajectory(s,angle);c.strokeStyle=aiming?'#abffeb':'#77dfcc88';c.lineWidth=2;c.setLineDash([3,10]);c.lineDashOffset=-t*14;c.beginPath();points.forEach((p,i)=>i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y));c.stroke();c.setLineDash([]);
  const end=points.at(-1);c.strokeStyle='#a4f9df';c.lineWidth=1;c.beginPath();c.arc(end.x,end.y,5,0,Math.PI*2);c.stroke();
  if(s.used===0){label(c,'AIM FOR A CHAIN REACTION',300,562,10,'#7e9ca3','normal');}
 }
 for(const b of s.balls){
  if(this.motion){b.trail.push({x:b.x,y:b.y});if(b.trail.length>7)b.trail.shift();c.strokeStyle='#80e7d27a';c.lineWidth=5;c.lineCap='round';c.beginPath();b.trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
  c.fillStyle='#81e7cc';c.beginPath();c.arc(b.x,b.y,8,0,Math.PI*2);c.fill();c.fillStyle='#f6fff1';c.beginPath();c.arc(b.x,b.y,4.5,0,Math.PI*2);c.fill();
 }
 c.save();c.translate(s.launcher,FLOOR);c.fillStyle='#091923';c.beginPath();c.ellipse(0,6,29,13,0,0,Math.PI*2);c.fill();c.fillStyle='#2f525c';c.beginPath();c.arc(0,0,24,0,Math.PI*2);c.fill();c.strokeStyle='#81e7cd';c.lineWidth=2;c.beginPath();c.arc(0,0,20,0,Math.PI*2);c.stroke();c.rotate(angle+Math.PI/2);c.fillStyle='#78ddca';rounded(c,-8,-32,16,30,5);c.fill();c.fillStyle='#d0fff0';rounded(c,-4,-30,8,8,2);c.fill();c.fillStyle='#a2f0d9';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.fillStyle='#30504f';c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.fill();c.restore();
 for(const r of this.rings){r.life-=dt;r.r+=(r.maxR/ .45)*dt;c.globalAlpha=Math.max(0,r.life*1.6);c.strokeStyle=r.color;c.lineWidth=4;c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.stroke();}c.globalAlpha=1;this.rings=this.rings.filter(r=>r.life>0);
 for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;c.globalAlpha=Math.max(0,p.life/p.max);c.fillStyle=p.color;if(this.motion){c.save();c.translate(p.x,p.y);c.rotate(p.life*4);c.fillRect(-p.size/2,-p.size/2,p.size,p.size);c.restore();}}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0).slice(-350);
 for(const w of this.words){w.life-=dt;w.y-=25*dt;c.globalAlpha=Math.max(0,Math.min(1,w.life*2));c.strokeStyle='#122630';c.lineWidth=5;c.font='bold 17px Arial';c.textAlign='center';c.strokeText(w.text,w.x,w.y);label(c,w.text,w.x,w.y,17,w.color);}c.globalAlpha=1;this.words=this.words.filter(w=>w.life>0);
 if(s.phase==='flight'){const progress=Math.min(1,s.shotTime/8.6);c.fillStyle='#39565f';rounded(c,235,701,130,3,2);c.fill();c.fillStyle='#78ddca';rounded(c,235,701,130*progress,3,2);c.fill();}
 c.restore();
 }
}
