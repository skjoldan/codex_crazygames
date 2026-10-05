// CrazyGames SDK v3. No ads in the Basic Launch build.
const KEY='ricochet-foundry-v1';
export class Portal {
 constructor(){this.sdk=null;this.active=false;this.memory=null;this.available=false;}
 async init(){
  // Local play is offline-first. Use ?sdk=1 for the CrazyGames local SDK test tool.
  const local=['localhost','127.0.0.1',''].includes(location.hostname);
  if(local&&!new URLSearchParams(location.search).has('sdk'))return;
  try {
   await Promise.race([new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';s.onload=resolve;s.onerror=reject;document.head.append(s);}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SDK load timeout')),3500))]);
   const sdk=window.CrazyGames?.SDK;if(!sdk)return;
   await Promise.race([sdk.init(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SDK init timeout')),3500))]);
   this.sdk=sdk;this.available=true;this.call('loadingStart');
  }catch{ /* Standalone play remains available if the SDK cannot load. */ }
 }
 call(name,...args){try{this.sdk?.game?.[name]?.(...args);}catch{/* Portal failures never interrupt play. */}}
 ready(){this.call('loadingStop');}
 start(){if(!this.active){this.active=true;this.call('gameplayStart');}}
 stop(){if(this.active){this.active=false;this.call('gameplayStop');}}
 load(){
  let local=null,cloud=null;try{local=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
  try{cloud=JSON.parse(this.sdk?.data?.getItem(KEY)||'null');}catch{}
  const valid=x=>x&&x.version===1&&Array.isArray(x.stars);
  const result=valid(cloud)?cloud:valid(local)?local:{version:1,stars:Array(30).fill(0),sound:true,motion:true,tutorial:false,daily:{}};
  result.stars=Array.from({length:30},(_,i)=>Math.max(0,Math.min(3,Number(result.stars[i])||0),valid(local)?Math.max(0,Math.min(3,Number(local.stars[i])||0)):0));
  result.daily=result.daily&&typeof result.daily==='object'?result.daily:{};
  result.sound=result.sound!==false;result.motion=result.motion!==false;return result;
 }
 save(data){this.memory=data;const value=JSON.stringify(data);try{localStorage.setItem(KEY,value);}catch{}try{this.sdk?.data?.setItem(KEY,value);}catch{}}
}
