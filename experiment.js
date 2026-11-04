'use strict';
const fs=require('node:fs');
const {World}=require('./core.js');
function args(argv){const o={seeds:5,steps:3000,n:120,interval:250,output:''};for(let i=0;i<argv.length;i++)if(argv[i].startsWith('--')){const k=argv[i].slice(2);o[k]=argv[++i];}for(const k of ['seeds','steps','n','interval'])o[k]=Number(o[k]);return o;}
function run(opts){const rows=[];for(const mode of ['fixed','rewire','evolve'])for(let seed=1;seed<=opts.seeds;seed++){
  const w=new World({seed,n:opts.n,mode,maxNodes:opts.n*2});
  for(let t=0;t<=opts.steps;t++){
    if(t%opts.interval===0||t===opts.steps)rows.push({mode,seed,...w.snapshot()});
    if(t<opts.steps)w.step();
  }
}return rows;}
if(require.main===module){const o=args(process.argv.slice(2));const rows=run(o);const out=JSON.stringify({config:o,rows},null,2);
  if(o.output){fs.writeFileSync(o.output,out);console.log('Saved '+o.output);}else console.log(out);
  for(const mode of ['fixed','rewire','evolve']){const last=rows.filter(x=>x.mode===mode&&x.tick===o.steps);const mean=k=>last.reduce((s,r)=>s+(r[k]??0),0)/last.length;console.error(mode+': N '+mean('nodes').toFixed(1)+', edges '+mean('edges').toFixed(1)+', d_growth '+mean('growthDimension').toFixed(2)+', imbalance '+mean('pumpImbalance').toFixed(3));}
}
module.exports={run};
