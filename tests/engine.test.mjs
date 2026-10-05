import test from 'node:test';import assert from 'node:assert/strict';
import {LEVELS,dailyLevel} from '../src/levels.js';import {makeState,shoot,step,simulate,remaining,snapshot,trajectory,starsFor,moveBall,STEP,LEFT,RIGHT,RADIUS,SPEED} from '../src/engine.js';
import solutions from '../docs/level-solutions.json' with {type:'json'};
test('every campaign chamber has a verified winning route within the volley budget',()=>{
 for(const [i,level] of LEVELS.entries()){let s=makeState(level);for(const a of solutions[i].angles)s=simulate(s,a);assert.equal(s.phase,'won',`Chamber ${i+1}`);assert.ok(s.used<=level.shots);assert.ok(s.used<=level.par,`3 stars must be attainable in chamber ${i+1}`);}
});
test('shots cannot be spammed or launched outside the playable state',()=>{const s=makeState(LEVELS[1]);assert.equal(shoot(s,-1.2),true);assert.equal(shoot(s,-1.2),false);assert.equal(s.used,1);assert.equal(s.shots,3);});
test('first shot tutorial center aim clears chamber 1',()=>{const s=simulate(makeState(LEVELS[0]),-Math.PI/2);assert.equal(remaining(s),0);assert.equal(starsFor(s,LEVELS[0]),3);});
test('empty side shots lead to a finite fail state',()=>{let s=makeState(LEVELS[3]);for(let i=0;i<LEVELS[3].shots;i++)s=simulate(s,-Math.PI/2);assert.equal(s.phase,'lost');assert.ok(remaining(s)>0);assert.equal(s.pending,0);assert.equal(s.balls.length,0);});
test('wall collision reflects velocity and keeps balls in the chamber',()=>{for(const side of ['left','right']){const s=makeState(LEVELS[0]),b={x:side==='left'?LEFT+RADIUS:RIGHT-RADIUS,y:530,vx:side==='left'?-SPEED:SPEED,vy:0,age:0};moveBall(s,b,STEP);assert.ok(b.x>=LEFT+RADIUS&&b.x<=RIGHT-RADIUS);assert.equal(Math.sign(b.vx),side==='left'?1:-1);}});
test('trajectory preview never damages or mutates the game state',()=>{const s=makeState(LEVELS[12]),before=snapshot(s);const points=trajectory(s,-1.3);assert.ok(points.length>3);assert.deepEqual(s,before);});
test('rewind snapshot is independent of later play',()=>{const s=makeState(LEVELS[1]),copy=snapshot(s);shoot(s,-1.2);for(let i=0;i<400;i++)step(s);assert.equal(copy.used,0);assert.equal(copy.shots,4);assert.equal(copy.phase,'aim');assert.ok(copy.blocks.every(b=>b.alive));});
test('fixed-step simulation produces identical results across rendering rates',()=>{
 function run(rate){const s=makeState(LEVELS[17]);shoot(s,-1.8);let accumulator=0;for(let f=0;f<rate*10;f++){accumulator+=1/rate;while(accumulator+1e-12>=STEP){step(s);accumulator-=STEP;}s.events=[];}return {blocks:s.blocks.map(b=>[b.hp,b.alive]),phase:s.phase,used:s.used};}
 assert.deepEqual(run(30),run(60));assert.deepEqual(run(60),run(144));
});
test('daily reactors are deterministic and retain their seed date',()=>{assert.deepEqual(dailyLevel('2026-10-05'),dailyLevel('2026-10-05'));assert.equal(dailyLevel('2026-10-05').day,'2026-10-05');assert.notDeepEqual(dailyLevel('2026-10-05'),dailyLevel('2026-10-06'));});
test('splitters create extra balls but respect the amplification cap',()=>{const s=makeState(LEVELS[12]);shoot(s,-Math.PI/2);for(let i=0;i<400;i++)step(s);assert.ok(s.splitCount>0);assert.ok(s.splitCount<=24);assert.ok(s.balls.length<=s.volleySize+24);});
test('all candidate shots finish without non-finite coordinates or live-ball leaks',()=>{for(const l of LEVELS){for(const a of [-2.94,-2.4,-1.57,-.7,-.2]){const s=simulate(makeState(l),a);assert.notEqual(s.phase,'flight');assert.ok(s.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));assert.equal(s.pending,0);}}});
