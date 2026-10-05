export class Sound {
 constructor(){this.ctx=null;this.enabled=true;this.last=0;this.master=null;}
 unlock(){try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.24;this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')this.ctx.resume().catch(()=>{});}catch{}}
 tone(freq,duration=.12,type='sine',volume=.4,delay=0,end=null){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.007);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.01);}
 play(name,combo=0){if(!this.enabled)return;const t=this.ctx?.currentTime??0;
 if(name==='hit'||name==='break'){if(t-this.last<.035)return;this.last=t;this.tone(330*Math.pow(1.05946,Math.min(combo,24)),.15,'triangle',.35);}
 if(name==='launch')this.tone(240,.15,'triangle',.6,0,90);
 if(name==='blast'){this.tone(95,.32,'sawtooth',.24,0,35);this.tone(180,.2,'sine',.5);}
 if(name==='split'){this.tone(620,.18,'sine',.3);this.tone(930,.2,'sine',.3,.08);}
 if(name==='win')[0,4,7,12].forEach((n,i)=>this.tone(440*2**(n/12),.5,'triangle',.45,i*.1));
 if(name==='lose'){this.tone(220,.3,'triangle',.35);this.tone(164,.4,'triangle',.3,.2);}
 if(name==='ui')this.tone(500,.06,'sine',.2);
 }
 silence(on){if(this.master&&this.ctx)this.master.gain.setTargetAtTime(on?0:.24,this.ctx.currentTime,.03);}
}
