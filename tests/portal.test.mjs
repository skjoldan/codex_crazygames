import test from 'node:test';import assert from 'node:assert/strict';import {Portal} from '../src/portal.js';
function storage(initial={}){const map=new Map(Object.entries(initial));return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};}
const KEY='ricochet-foundry-v1';
test('invalid local saves recover to a new campaign',()=>{globalThis.localStorage=storage({[KEY]:'{bad json'});const p=new Portal();assert.deepEqual(p.load().stars,Array(30).fill(0));});
test('progress merge never loses earned stars; cloud settings win',()=>{globalThis.localStorage=storage({[KEY]:JSON.stringify({version:1,stars:[3,2,0],sound:true})});const p=new Portal();p.sdk={data:storage({[KEY]:JSON.stringify({version:1,stars:[1,3,2],sound:false})})};const loaded=p.load();assert.deepEqual(loaded.stars.slice(0,3),[3,3,2]);assert.equal(loaded.sound,false);});
test('storage denied does not break loading or saving',()=>{globalThis.localStorage={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};const p=new Portal();const save=p.load();assert.doesNotThrow(()=>p.save(save));});
test('SDK gameplay notifications are balanced and idempotent',()=>{const log=[],p=new Portal();p.sdk={game:{gameplayStart:()=>log.push('start'),gameplayStop:()=>log.push('stop')}};p.start();p.start();p.stop();p.stop();p.start();assert.deepEqual(log,['start','stop','start']);});
