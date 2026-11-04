'use strict';
// Independent graph observables: diffusion and degree-preserving null graphs.
// These tests do not enter World.step() or alter its RNG.
const {RNG,bfs,slope,World}=require('./core.js');
function cloneAdj(adj){return adj.map(v=>new Set(v));}
function shuffleDegreePreserving(adj,seed=1,multiplier=12){
  const copy=cloneAdj(adj),rng=new RNG(seed);const edges=[];
  for(let a=0;a<copy.length;a++)for(const b of copy[a])if(a<b)edges.push([a,b]);
  let successes=0;
  for(let z=0;z<Math.floor(multiplier*edges.length);z++){
    const i=rng.int(edges.length),j=rng.int(edges.length);if(i===j)continue;
    const [a,b]=edges[i],[c,d]=edges[j];
    if(new Set([a,b,c,d]).size!==4)continue;
    const [u,v,x,y]=rng.next()<0.5?[a,d,c,b]:[a,c,b,d];
    if(copy[u].has(v)||copy[x].has(y))continue;
    copy[a].delete(b);copy[b].delete(a);copy[c].delete(d);copy[d].delete(c);
    copy[u].add(v);copy[v].add(u);copy[x].add(y);copy[y].add(x);
    edges[i]=[Math.min(u,v),Math.max(u,v)];edges[j]=[Math.min(x,y),Math.max(x,y)];successes++;
  }
  return {adj:copy,swaps:successes};
}
function volume(adj,{samples=12,maxRadius=8}={}){
  const n=adj.length,starts=Array.from({length:Math.min(n,samples)},(_,i)=>Math.floor((i+.5)*n/Math.min(n,samples)));
  let dim=0,count=0,valid=0,meanV=Array(maxRadius).fill(0);
  for(const start of starts){const d=bfs(adj,start),xs=[],ys=[];
    for(let r=1;r<=maxRadius;r++){const v=d.filter(x=>x>=0&&x<=r).length;meanV[r-1]+=v/starts.length;if(r>=2&&v<.65*n&&v>1){xs.push(Math.log(r));ys.push(Math.log(v));}}
    const m=slope(xs,ys);if(m!==null){dim+=m;count++;}valid+=xs.length;
  }
  return {growthSlope:count?dim/count:null,meanFitRadii:valid/starts.length,ballVolume:meanV.map(x=>+x.toFixed(2))};
}
function spectral(adj,{samples=10,times=[4,8,12,16,24,32,48,64]}={}){
  const n=adj.length,starts=Array.from({length:Math.min(samples,n)},(_,i)=>Math.floor((i+.5)*n/Math.min(samples,n)));
  const maxT=Math.max(...times),returns=Array(times.length).fill(0),baseline=[];
  for(const start of starts){const d=bfs(adj,start),component=d.map((dist,i)=>dist>=0?i:-1).filter(i=>i>=0),degSum=component.reduce((sum,i)=>sum+adj[i].size,0);baseline.push(degSum?adj[start].size/degSum:1);
    let p=new Float64Array(n);p[start]=1;
    for(let t=1;t<=maxT;t++){
      const q=new Float64Array(n);
      for(let i=0;i<n;i++)if(p[i]){
        const neighbors=adj[i],deg=neighbors.size;if(!deg)q[i]+=p[i];
        else{q[i]+=p[i]*.5;const share=p[i]*.5/deg;for(const j of neighbors)q[j]+=share;}
      }
      p=q;const ix=times.indexOf(t);if(ix>=0)returns[ix]+=p[start]/starts.length;
    }
  }
  const b=baseline.reduce((x,y)=>x+y,0)/baseline.length;
  const xs=[],ys=[];
  for(let k=0;k<times.length;k++)if(times[k]>=4&&times[k]<=32&&returns[k]>2*b){xs.push(Math.log(times[k]));ys.push(Math.log(returns[k]));}
  const m=slope(xs,ys);
  return {spectralSlope:m===null?null:-2*m,spectralFitTimes:xs.length,stationaryReturn:b,returnCurve:times.map((t,i)=>[t,+returns[i].toPrecision(5)])};
}
function compare(world,seed=911){const nullGraph=shuffleDegreePreserving(world.adj,seed);return {real:{...volume(world.adj),...spectral(world.adj)},degreeNull:{...volume(nullGraph.adj),...spectral(nullGraph.adj)},nullSwaps:nullGraph.swaps};}
if(require.main===module){const n=Number(process.argv[2]||150),steps=Number(process.argv[3]||2500),seed=Number(process.argv[4]||1);const w=new World({seed,n,maxNodes:n*2});for(let i=0;i<steps;i++)w.step();console.log(JSON.stringify({seed,n,steps,world:w.snapshot(),geometry:compare(w,seed+200)},null,2));}
module.exports={shuffleDegreePreserving,volume,spectral,compare};
