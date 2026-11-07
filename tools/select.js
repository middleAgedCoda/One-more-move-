const fs=require('fs'),{canon}=require('./analyze');
let pool=[],seen=new Set();for(const f of fs.readdirSync('.').filter(f=>/^pool_/.test(f)))for(const a of JSON.parse(fs.readFileSync(f))){const k=canon(a.rows);if(seen.has(k))continue;seen.add(k);pool.push(a)}
const hist={};pool.forEach(a=>hist[a.E]=(hist[a.E]||0)+1);console.log('unique',pool.length,'E histogram',JSON.stringify(hist));
const sc=a=>a.E*2+a.bad+a.dead*1.5+(a.counter?2:0)+(a.naiveFails?2:0)+a.pairs*1.5+a.obs*.5+a.echoMatches;
pool.forEach(a=>a.score=sc(a));
const B={
 b1:a=>a.obs>=1&&a.pairs<=2&&a.E>=4&&a.E<=5&&a.R*a.C<=16&&a.dead<=1,
 b2:a=>a.pairs===2&&a.E>=5&&a.E<=6&&a.echoMatches>0&&a.counter&&a.dead<=1,
 b3:a=>a.pairs>=2&&a.E>=6&&a.E<=7&&a.naiveFails&&a.dead<=1,
 b4:a=>a.E>=7&&a.E<=8&&a.naiveFails&&a.dead<=2,
 b5:a=>a.E>=8&&a.naiveFails&&a.counter&&a.dead<=2};
for(const[k,f]of Object.entries(B))console.log(k,pool.filter(f).length);
fs.writeFileSync('pool_all.json',JSON.stringify(pool));
