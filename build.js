// Bundles engine.js + levels.js + index.src.html into one self-contained index.html (engine stays a separate module in source).
const fs=require('fs'),wrap=(n,f)=>`const ${n}=(()=>{const module={exports:{}};${fs.readFileSync(f,'utf8')}\nreturn module.exports})();`;
fs.writeFileSync('index.html',fs.readFileSync('index.src.html','utf8').replace('/*ENGINE*/',()=>wrap('ENG','engine.js')).replace('/*LEVELS*/',()=>wrap('LEVELS','levels.js')));
// guard against the --c collision bug: --c is the cell size only, never a colour
const out=fs.readFileSync('index.html','utf8');if(/--c\s*:\s*#/.test(out))throw new Error('BUILD FAIL: --c used as a colour (collides with cell-size var)');
