export const W=600,H=720,LEFT=26,RIGHT=574,TOP=30,FLOOR=652,RADIUS=5,SPEED=670,STEP=1/120;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function makeState(level){
 const blocks=[];level.rows.forEach((row,r)=>[...row].forEach((c,col)=>{
  if(c==='.')return;const type=c==='#'?'steel':c==='X'?'bomb':c==='Y'?'split':'core';
  blocks.push({id:blocks.length,x:50+col*72,y:108+r*76,w:66,h:64,hp:type==='steel'?999:type==='core'?Number(c):1,type,alive:true,flash:0});
 }));
 return {blocks,balls:[],pending:0,spawnClock:0,clock:0,shots:level.shots,used:0,volleySize:level.balls,launcher:level.launcher??300,angle:-Math.PI/2,phase:'aim',events:[],combo:0,maxCombo:0,totalDestroyed:0,splitCount:0,shotTime:0};
}
export function remaining(s){return s.blocks.filter(b=>b.alive&&b.type!=='steel').length;}
export function shoot(s,angle){if(s.phase!=='aim'||s.shots<=0)return false;s.angle=clamp(angle,-Math.PI+.18,-.18);s.shots--;s.used++;s.pending=s.volleySize;s.spawnClock=0;s.shotTime=0;s.combo=0;s.splitCount=0;s.phase='flight';s.events.push({type:'launch',x:s.launcher,y:FLOOR});return true;}
export function snapshot(s){return structuredClone(s);}
function event(s,type,b,extra={}){s.events.push({type,x:b.x+b.w/2,y:b.y+b.h/2,...extra});}
function damage(s,b,amount=1,ball=null){
 if(!b.alive||b.type==='steel')return;
 b.hp-=amount;b.flash=.16;
 if(b.hp>0){event(s,'hit',b);return;}
 b.alive=false;s.combo++;s.totalDestroyed++;s.maxCombo=Math.max(s.maxCombo,s.combo);
 event(s,'break',b,{kind:b.type,combo:s.combo});
 if(b.type==='bomb'){
  event(s,'blast',b);const bx=b.x+b.w/2,by=b.y+b.h/2;
  for(const other of s.blocks)if(other.alive&&other.type!=='steel'&&Math.hypot(other.x+other.w/2-bx,other.y+other.h/2-by)<113)damage(s,other,2,ball);
 } else if(b.type==='split'&&ball&&s.splitCount<24){
  for(const off of [-.44,.44]){const a=Math.atan2(ball.vy,ball.vx)+off;s.balls.push({x:ball.x,y:ball.y,vx:Math.cos(a)*SPEED,vy:Math.sin(a)*SPEED,age:ball.age,trail:[],last:b.id,cool:.06});s.splitCount++;}
  event(s,'split',b);
 }
}
export function moveBall(s,ball,dt,preview=false){
 let px=ball.x,py=ball.y;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.age+=dt;ball.cool=Math.max(0,(ball.cool||0)-dt);
 let bounce=false;
 if(ball.x<LEFT+RADIUS){ball.x=LEFT+RADIUS;ball.vx=Math.abs(ball.vx);bounce=true;}
 if(ball.x>RIGHT-RADIUS){ball.x=RIGHT-RADIUS;ball.vx=-Math.abs(ball.vx);bounce=true;}
 if(ball.y<TOP+RADIUS){ball.y=TOP+RADIUS;ball.vy=Math.abs(ball.vy);bounce=true;}
 for(const b of s.blocks){
  if(!b.alive||(b.id===ball.last&&ball.cool>0))continue;
  // Swept-size substeps limit movement to < radius; expanded AABB for stable arcade rebounds.
  if(ball.x>b.x-RADIUS&&ball.x<b.x+b.w+RADIUS&&ball.y>b.y-RADIUS&&ball.y<b.y+b.h+RADIUS){
   if(py>=b.y+b.h+RADIUS-.01){ball.y=b.y+b.h+RADIUS;ball.vy=Math.abs(ball.vy);}
   else if(py<=b.y-RADIUS+.01){ball.y=b.y-RADIUS;ball.vy=-Math.abs(ball.vy);}
   else if(px<=b.x-RADIUS+.01){ball.x=b.x-RADIUS;ball.vx=-Math.abs(ball.vx);}
   else if(px>=b.x+b.w+RADIUS-.01){ball.x=b.x+b.w+RADIUS;ball.vx=Math.abs(ball.vx);}
   else {ball.vy=-ball.vy;ball.y=ball.vy>0?b.y+b.h+RADIUS:b.y-RADIUS;}
   ball.last=b.id;ball.cool=.025;bounce=true;
   if(!preview){if(b.type==='steel')event(s,'steel',b);else damage(s,b,1,ball);}break;
  }
 }
 if(bounce&&!preview)s.events.push({type:'bounce',x:ball.x,y:ball.y});
 return {out:ball.y>FLOOR+16||ball.age>7,bounce};
}
export function step(s,dt=STEP){
 s.clock+=dt;for(const b of s.blocks)b.flash=Math.max(0,b.flash-dt);
 if(s.phase!=='flight')return;
 s.shotTime+=dt;s.spawnClock-=dt;
 if(s.pending>0&&s.spawnClock<=0){s.balls.push({x:s.launcher,y:FLOOR,vx:Math.cos(s.angle)*SPEED,vy:Math.sin(s.angle)*SPEED,age:0,trail:[],last:-1,cool:0});s.pending--;s.spawnClock+=.075;}
 for(let i=s.balls.length-1;i>=0;i--){const ball=s.balls[i];if(moveBall(s,ball,dt).out)s.balls.splice(i,1);}
 if(remaining(s)===0){s.phase='won';s.balls=[];s.pending=0;s.events.push({type:'win'});}
 else if(s.pending===0&&s.balls.length===0){s.phase=s.shots>0?'aim':'lost';s.events.push({type:s.phase==='lost'?'lose':'ready'});}
}
export function simulate(s,angle){const copy=snapshot(s);copy.events=[];shoot(copy,angle);for(let i=0;i<1600&&copy.phase==='flight';i++){step(copy);copy.events=[];}return copy;}
export function trajectory(s,angle){
 const b={x:s.launcher,y:FLOOR,vx:Math.cos(angle)*SPEED,vy:Math.sin(angle)*SPEED,age:0,trail:[],last:-1,cool:0};
 const points=[{x:b.x,y:b.y}],length=1050;let distance=0,bounces=0;
 for(let i=0;i<420;i++){const r=moveBall(s,b,STEP,true);distance+=SPEED*STEP;if(i%3===0||r.bounce)points.push({x:b.x,y:b.y});if(r.bounce)bounces++;if(r.out||distance>length||bounces>=3)break;}return points;
}
export function starsFor(s,level){return s.phase==='won'?(s.used<=level.par?3:s.used<=level.par+1?2:1):0;}
