const fs=require('fs');let pool=[...JSON.parse(fs.readFileSync('pool_all.json')),...JSON.parse(fs.readFileSync('pool_mut.json'))];
const {canon}=require('./analyze');const seen=new Set();pool=pool.filter(a=>{const k=canon(a.rows);if(seen.has(k))return false;seen.add(k);return true});
const sc=a=>a.E*2+a.bad+a.dead*1.5+(a.counter?2:0)+(a.naiveFails?2:0)+a.pairs*1.5+a.obs*.5+a.echoMatches;pool.forEach(a=>a.score=sc(a));
const bands=[
 [a=>a.obs>=1&&a.pairs<=2&&a.E>=4&&a.E<=5&&a.R*a.C<=16&&a.dead<=1&&a.nOpt===1],
 [a=>a.E>=5&&a.E<=6&&a.pairs>=2&&(a.echoMatches>0||a.counter)&&a.dead<=1&&a.nOpt===1],
 [a=>a.pairs>=2&&a.E>=6&&a.E<=7&&a.naiveFails&&a.dead<=1],
 [a=>a.E===7&&a.naiveFails&&a.dead<=2&&a.pairs>=2],
 [a=>a.E>=7&&a.naiveFails&&a.counter&&a.dead<=2&&a.pairs>=2]];
const used=new Set(),picked=[];
bands.forEach((f,bi)=>{const c=pool.filter(f[0]).filter(a=>!used.has(canon(a.rows))).sort((x,y)=>x.score-y.score);
 const n=c.length;const take=[];for(let i=0;i<5;i++)take.push(c[Math.min(n-1,Math.round((i+.5)*n/5-.5))]);
 const u=[...new Set(take)];for(const a of c){if(u.length>=5)break;if(!u.includes(a))u.push(a)}
 u.sort((x,y)=>x.score-y.score).forEach(a=>{used.add(canon(a.rows));picked.push(a)});console.log('band',bi+6,'candidates',n)});
const cur=require('../levels.js').slice(0,5);
const out=[...cur,...picked.map((a,i)=>({id:6+i,rows:a.rows,solution:a.sol}))];
fs.writeFileSync('../levels.js',`'use strict';\n// Campaign: levels 1-5 teach; 6-30 are solver-curated. Legend: '.' empty, '#' obstacle, letters = tile colours (2 each).\n// Every level is checked by test.js: solvable, recorded solution wins and is optimal.\nmodule.exports = [\n${out.map(l=>`  { id: ${l.id}, rows: ${JSON.stringify(l.rows)}, solution: '${l.solution}' }`).join(',\n')}\n];\n`);
console.log('id size pairs obs E sol | bad dead naive counter echoM nOpt');
picked.forEach((a,i)=>console.log(String(6+i).padStart(2),a.R+'x'+a.C,a.pairs,a.obs,a.E,a.sol.padEnd(9),'|',a.bad,a.dead,a.naiveFails?'Y':'n',a.counter?'Y':'n',a.echoMatches,a.nOpt));
