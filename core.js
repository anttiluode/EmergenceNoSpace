'use strict';
// EmergenceNoSpace: no coordinates occur anywhere in the physical model.
class RNG {
  constructor(seed=1) { this.state=seed>>>0; }
  next() { let t=this.state=(this.state+0x6D2B79F5)>>>0; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
  int(n) { return Math.floor(this.next()*n); }
  pick(a) { return a[this.int(a.length)]; }
}
const key=(a,b)=>a<b?a+":"+b:b+":"+a;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class World {
  constructor({seed=1,n=120,maxNodes=260,mode='evolve',degree=4,mutation=0.12}={}) {
    if(!['fixed','rewire','evolve'].includes(mode)) throw Error('unknown mode');
    if(n<8||maxNodes<n||degree<2) throw Error('invalid size');
    this.rng=new RNG(seed); this.mode=mode; this.maxNodes=maxNodes; this.mutation=mutation;
    this.tick=0; this.births=0; this.construction=0; this.removals=0;
    this.nodes=Array.from({length:n},(_,i)=>({id:i,mass:0.75+0.5*this.rng.next(),genes:[0.4+0.4*this.rng.next(),0.4+0.4*this.rng.next(),0.4+0.4*this.rng.next()]}));
    this.adj=this.nodes.map(()=>new Set()); this.edges=new Map();
    // Random recursive spanning tree + random chords: connected, no spatial lattice.
    for(let i=1;i<n;i++) this.link(i,this.rng.int(i),1,false);
    let tries=0;
    while(this.edges.size<Math.floor(n*degree/2) && tries++<n*n*10) {
      const a=this.rng.int(n), b=this.rng.int(n);
      if(a!==b && this.adj[a].size<degree+3 && this.adj[b].size<degree+3) this.link(a,b,1,false);
    }
    this.pumps=Array.from({length:Math.max(2,Math.floor(n/30))},()=>{
      const a=this.rng.int(n); let b=this.rng.int(n-1); if(b>=a)b++;
      return [a,b];
    });
    this.initialMass=this.totalMass();
  }
  link(a,b,w=1,charge=true) {
    if(a===b||this.adj[a].has(b))return false;
    const bond=0.012;
    if(charge && (this.nodes[a].mass<bond||this.nodes[b].mass<bond))return false;
    if(charge){this.nodes[a].mass-=bond/2;this.nodes[b].mass-=bond/2;this.construction++;}
    this.adj[a].add(b);this.adj[b].add(a);
    this.edges.set(key(a,b),{a,b,w,bond:charge?bond:0,usage:0,age:0}); return true;
  }
  unlink(e) {
    if(!this.edges.has(key(e.a,e.b)))return;
    this.nodes[e.a].mass+=e.bond/2;this.nodes[e.b].mass+=e.bond/2;
    this.adj[e.a].delete(e.b);this.adj[e.b].delete(e.a);
    this.edges.delete(key(e.a,e.b));this.removals++;
  }
  totalMass(){return this.nodes.reduce((s,n)=>s+n.mass,0)+Array.from(this.edges.values()).reduce((s,e)=>s+e.bond,0);}
  step() {
    const r=this.rng, N=this.nodes.length;
    // Paired environmental forcing transfers mass; total mass is unchanged.
    for(const [a,b] of this.pumps) { const q=Math.min(0.13,this.nodes[a].mass*0.22);this.nodes[a].mass-=q;this.nodes[b].mass+=q; }
    // Edge fluxes are simultaneous and source-limited to prevent negative mass.
    const requested=new Float64Array(N), transfers=[];
    for(const e of this.edges.values()) {
      const diff=this.nodes[e.a].mass-this.nodes[e.b].mass;
      const flux=0.085*e.w*diff;
      const src=flux>=0?e.a:e.b, dst=flux>=0?e.b:e.a, amt=Math.abs(flux);
      requested[src]+=amt;transfers.push([e,src,dst,amt]);
    }
    const scale=Array.from(requested,(q,i)=>q>0?Math.min(1,0.35*this.nodes[i].mass/q):1);
    const delta=new Float64Array(N);
    for(const [e,src,dst,amt] of transfers) {
      const q=amt*scale[src];delta[src]-=q;delta[dst]+=q;
      e.usage=0.94*e.usage+0.06*q; e.age++;
    }
    for(let i=0;i<N;i++)this.nodes[i].mass+=delta[i];
    if(this.mode!=='fixed') {
      // Hebbian-ish flow reinforcement with upkeep. Graph changes are not targeted at 3D.
      for(const e of Array.from(this.edges.values())) {
        const g=(this.nodes[e.a].genes[1]+this.nodes[e.b].genes[1])*0.5;
        e.w=clamp(e.w+0.017*g*(e.usage-0.024),0.06,1.8);
        if(e.age>90&&e.w<0.19&&this.adj[e.a].size>2&&this.adj[e.b].size>2)this.unlink(e);
      }
      // Two-hop local proposals; no access to x/y/z or nonlocal node searches.
      for(let k=0;k<Math.max(1,Math.floor(N/9));k++) {
        const a=r.int(N);if(this.adj[a].size>=9||!this.adj[a].size)continue;
        const b=r.pick(Array.from(this.adj[a]));if(!this.adj[b].size)continue;
        const c=r.pick(Array.from(this.adj[b]));
        if(c===a||this.adj[a].has(c)||this.adj[c].size>=9)continue;
        const grad=Math.abs(this.nodes[a].mass-this.nodes[c].mass);
        const p=0.015*(0.3+grad)*this.nodes[a].genes[2];
        if(r.next()<p)this.link(a,c,0.5,true);
      }
    }
    if(this.mode==='evolve'&&this.nodes.length<this.maxNodes) {
      // Buds inherit genes with mutation; replication spends the parent's mass.
      const attempts=Math.max(1,Math.floor(N/25));
      for(let k=0;k<attempts&&this.nodes.length<this.maxNodes;k++) {
        const a=r.int(N),parent=this.nodes[a];
        if(parent.mass<1.15||r.next()>0.055*parent.genes[0])continue;
        const mass=parent.mass*0.35;parent.mass-=mass;
        const id=this.nodes.length;
        const genes=parent.genes.map(g=>clamp(g+this.mutation*(r.next()+r.next()+r.next()-1.5),0.08,1.8));
        this.nodes.push({id,mass,genes});this.adj.push(new Set());
        this.link(id,a,0.85,true);
        const neighbors=Array.from(this.adj[a]).filter(j=>j!==id);
        if(neighbors.length)this.link(id,r.pick(neighbors),0.65,true);
        this.births++;
      }
    }
    this.tick++;
    return this;
  }
  snapshot(){return {tick:this.tick,nodes:this.nodes.length,edges:this.edges.size,births:this.births,removals:this.removals,massDrift:this.totalMass()-this.initialMass,...diagnostics(this)};}
}
function bfs(adj,start){const d=new Int32Array(adj.length).fill(-1);d[start]=0;const q=[start];for(let h=0;h<q.length;h++)for(const v of adj[q[h]])if(d[v]<0){d[v]=d[q[h]]+1;q.push(v);}return d;}
function slope(xs,ys){const n=xs.length;if(n<2)return null;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let a=0,b=0;for(let i=0;i<n;i++){a+=(xs[i]-mx)*(ys[i]-my);b+=(xs[i]-mx)**2;}return b>1e-12?a/b:null;}
function diagnostics(world,{samples=12,maxRadius=6}={}){
  const n=world.nodes.length,adj=world.adj;
  const chosen=Array.from({length:Math.min(samples,n)},(_,i)=>Math.floor((i+0.5)*n/Math.min(samples,n)));
  const balls=Array(maxRadius).fill(0),slopes=[],spans=[],reach=[];let giant=0;
  for(const s of chosen){
    const d=bfs(adj,s);const found=d.filter(x=>x>=0).length;giant=Math.max(giant,found);
    const xs=[],ys=[];
    for(let rad=1;rad<=maxRadius;rad++){
      const count=d.filter(v=>v>=0&&v<=rad).length;balls[rad-1]+=count/chosen.length;
      if(rad>=2&&count<n*0.65&&count>1){xs.push(Math.log(rad));ys.push(Math.log(count));}
    }
    spans.push(xs.length);reach.push(d.reduce((m,v)=>v>=0?Math.max(m,v):m,0));const fit=slope(xs,ys);if(fit!==null)slopes.push(fit);
  }
  let triangles=0,wedges=0;
  for(let i=0;i<n;i++){
    const a=Array.from(adj[i]);wedges+=a.length*(a.length-1)/2;
    for(let j=0;j<a.length;j++)for(let k=j+1;k<a.length;k++)if(adj[a[j]].has(a[k]))triangles++;
  }
  const pressure=world.pumps.reduce((s,[a,b])=>s+Math.abs(world.nodes[a].mass-world.nodes[b].mass),0)/world.pumps.length;
  return {giantSample:giant/n,meanDegree:2*world.edges.size/n,clustering:wedges?triangles/wedges:0,ballVolume:balls.map(x=>+x.toFixed(2)),growthDimension:slopes.length?slopes.reduce((a,b)=>a+b,0)/slopes.length:null,dimensionFits:slopes.length,meanFitRadii:spans.reduce((a,b)=>a+b,0)/spans.length,meanEccentricity:reach.reduce((a,b)=>a+b,0)/reach.length,geometryEvidence:spans.filter(x=>x>=4).length>=Math.ceil(chosen.length*0.75)?"candidate-only":"insufficient-scale",pumpImbalance:pressure};
}
const API={RNG,World,bfs,diagnostics,slope};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof globalThis!=='undefined')globalThis.NoSpace=API;
