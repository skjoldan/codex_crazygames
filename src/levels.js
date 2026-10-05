export const SECTORS = [
 {name:'IGNITION', color:'#ffbd7a', tagline:'Learn the art of the ricochet.'},
 {name:'CHAIN REACTION',color:'#ff8980',tagline:'A little spark goes a long way.'},
 {name:'PRISM WORKS',color:'#72e1ce',tagline:'Find the angle. Multiply the chaos.'},
 {name:'HEAVY INDUSTRY',color:'#a5adff',tagline:'Bank around the steel. Break the core.'},
 {name:'CRITICAL MASS',color:'#ffd879',tagline:'Bring the whole foundry to life.'}
];
// 7 columns. Digits: core durability. X: explosive. Y: splitter. #: steel.
const specs = [
 ['First spark',1,4,12,['.......','..111..','..1X1..','..111..'],'Hit the red overload to start a chain reaction.'],
 ['Side hustle',1,4,14,['.11.11.','.1X.X1.','.11.11.'],'Use the side walls to reach more cores.'],
 ['The sandwich',2,4,14,['.12221.','.1...1.','.1.X.1.','.11111.'],'A volley can bounce inside an opening.'],
 ['Double trouble',2,4,16,['.22.22.','.2X.X2.','.22.22.','...1...'],'Red overloads blast a wide circle.'],
 ['Bank on it',2,4,16,['122.221','1X2.2X1','.......','..###..'],'Steel is indestructible. Bank around it.'],
 ['Ignition test',2,5,18,['.22222.','.2X2X2.','.22.22.','..121..'],'Put everything you have learned to work.'],
 ['Short fuse',2,4,16,['.22X22.','.2...2.','.X222X.'],'Link overloads for a huge chain reaction.'],
 ['Domino effect',2,4,16,['12X2X21','2.....2','X.....X','221.122'],'Find an opening into the reactor.'],
 ['Split decision',2,4,18,['22...22','2X...X2','22...22','..1X1..'],'Which side will you take first?'],
 ['Blast radius',2,4,18,['333.333','3X3.3X3','.......','.11X11.'],'Armored cores take more than one hit.'],
 ['Crossfire',2,5,18,['2.2X2.2','2.2.2.2','X..#..X','2.2.2.2'],'Bounce across the chamber to connect both sides.'],
 ['Meltdown',3,5,20,['23X3X32','32X.X23','23X3X32','..###..'],'A wall bank can reach behind the steel.'],
 ['Prism lesson',2,4,14,['.22222.','.22X22.','.......','...Y...'],'Mint splitters add two extra balls on impact.'],
 ['Twin engines',2,4,14,['233.332','2X2.2X2','.......','.Y...Y.'],'Split first. Shatter second.'],
 ['Inside job',2,5,16,['.33333.','.3.Y.3.','.3.X.3.','.11.11.'],'Get a volley inside the box.'],
 ['Fork in the road',3,5,16,['33X.X33','23...32','..###..','.Y...Y.'],'Use a side splitter to get past the shield.'],
 ['Prism garden',2,5,14,['2Y2.2Y2','232X232','.2.Y.2.'],'A precise shot can become a whole storm.'],
 ['Light show',3,5,16,['33X3X33','3Y3.3Y3','333.333','...Y...'],'Your biggest chain reaction yet.'],
 ['Steel city',3,5,18,['32X.X23','3#...#3','32...23','..Y#Y..'],'Steel changes the angle, not the goal.'],
 ['The vault',3,5,18,['.33333.','.3XYX3.','.3...3.','.##.##.'],'The narrow opening hides a big payoff.'],
 ['Alternating current',3,5,18,['X33#33X','.......','33#.#33','.Y...Y.'],'Work both sides of the chamber.'],
 ['Pressure valve',3,5,20,['3X3.3X3','3#3.3#3','3.3.3.3','Y.....Y'],'Use the edges. Watch the return angle.'],
 ['Steel petals',3,5,20,['.3X3X3.','.#.#.#.','.3.Y.3.','.X333X.'],'Every gap is a way through.'],
 ['Night shift',3,6,20,['3X3X3X3','3#3#3#3','3Y3.3Y3','.......'],'A perfect clear takes a little planning.'],
 ['Hot circuit',3,5,18,['4X4Y4X4','3.....3','X.#.#.X','.Y...Y.'],'The foundry is running hot.'],
 ['Cascade',3,5,20,['4X4X4X4','.3.3.3.','3Y3Y3Y3','..###..'],'A ricochet around the steel starts the cascade.'],
 ['Butterfly effect',3,6,18,['4X4.4X4','4Y4.4Y4','.#...#.','..2X2..'],'A small change of angle changes everything.'],
 ['Reactor heart',3,6,20,['.44444.','.4XYX4.','.4YXY4.','.##.##.'],'Find the heart of the reactor.'],
 ['Last line',3,6,20,['X4X4X4X','4#4#4#4','3Y3Y3Y3','.3...3.'],'This is what the practice was for.'],
 ['The perfect storm',3,6,22,['4X4Y4X4','4Y4X4Y4','4X4Y4X4','..#.#..'],'One foundry. One final, beautiful reaction.']
];
export const LEVELS = specs.map(([name,par,shots,balls,rows,tip],i)=>({id:i,name,par:[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1][i],shots,balls:i<6?balls:Math.max(8,balls-8),rows:rows.map(row=>row.replace(/[1-4]/g,n=>String(Number(n)+(i>=18?3:i>=6?1:0)))),tip,sector:Math.floor(i/6),launcher:300}));
export function seedRandom(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function dailyLevel(day=new Date().toISOString().slice(0,10)){
 let seed=0;for(const c of day)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const random=seedRandom(seed),base=LEVELS[12+Math.floor(random()*18)];
 const rows=base.rows.map(r=>random()>.5?r.split('').reverse().join(''):r);
 return {...base,id:'daily',name:'Daily reactor',rows,shots:6,par:3,balls:20,day,tip:'One reactor for everyone today. Beat your own best.',sector:4};
}
