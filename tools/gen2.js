const { analyze } = require('./analyze'); const fs = require('fs');
const seed = +process.argv[2], secs = +process.argv[3];
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = rng(seed), out = [], seen = new Set(), end = Date.now() + secs * 1000;
const cfgs = [[4,4,1,2],[4,4,2,1],[4,4,2,2],[5,4,2,2],[5,4,2,3],[5,4,3,1],[5,4,3,2],[5,5,2,3],[5,5,3,2],[5,5,3,3],[4,5,2,3],[5,4,1,3],[5,5,2,4]];
let n = 0;
while (Date.now() < end) { const [r,c,p,o] = cfgs[R()*cfgs.length|0]; const cells=[...Array(r*c).keys()];
  for(let i=cells.length-1;i>0;i--){const j=R()*(i+1)|0;[cells[i],cells[j]]=[cells[j],cells[i]]}
  const g=Array.from({length:r},()=>Array(c).fill('.')); let k=0;
  for(let q=0;q<p;q++)for(let t=0;t<2;t++){const x=cells[k++];g[x/c|0][x%c]='ABC'[q]}
  for(let q=0;q<o;q++){const x=cells[k++];g[x/c|0][x%c]='#'}
  const rows=g.map(x=>x.join('')),key=rows.join('/'); if(seen.has(key))continue; seen.add(key); n++;
  const a=analyze(rows,4,11); if(a)out.push(a); }
fs.writeFileSync(`tools/pool_${seed}.json`,JSON.stringify(out)); console.log('seed',seed,'tried',n,'kept',out.length);
