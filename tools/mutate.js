const fs=require('fs'),{analyze,canon}=require('./analyze');
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(7),secs=+process.argv[2];let pool=JSON.parse(fs.readFileSync('pool_all.json'));
const seen=new Set(pool.map(a=>canon(a.rows))),found=[],end=Date.now()+secs*1000;let tries=0;
const seeds=()=>pool.filter(a=>a.E>=6);
while(Date.now()<end){const S=seeds(),base=S[(Math.pow(R(),.5)*S.length)|0]||pool[0];const g=base.rows.map(r=>[...r]);
 const H=g.length,W=g[0].length;for(let m=0;m<1+(R()<.4);m++){const filled=[],empty=[];g.forEach((r,i)=>r.forEach((c,j)=>(c==='.'?empty:filled).push([i,j])));
  const [a,b]=filled[R()*filled.length|0],[c,d]=empty[R()*empty.length|0];g[c][d]=g[a][b];g[a][b]='.'}
 const rows=g.map(r=>r.join(''));const k=canon(rows);if(seen.has(k))continue;seen.add(k);tries++;
 const a=analyze(rows,4,12);if(a){pool.push(a);found.push(a)}}
fs.writeFileSync('pool_mut.json',JSON.stringify(found));
const h={};found.forEach(a=>h[a.E]=(h[a.E]||0)+1);console.log('tries',tries,'kept',found.length,JSON.stringify(h));
