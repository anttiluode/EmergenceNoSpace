# Emergence No Space

**Can a coordinate-free, resource-conserving, locally adaptive network grow an effective low-dimensional geometry?**

This is an experimental artificial-life toy, **not** a simulation of spacetime or evidence that a three-dimensional universe has emerged.

The graph has **no x/y/z coordinates**. Nodes hold resource and inherited local coupling/plasticity/budding parameters; links hold conductance and a flow-memory trace. Paired pumps redistribute resource. Edge flux responds to gradients. Two-hop local encounters may build links, and old unused links can weaken and be removed. In the evolve condition, resource-rich nodes can bud, giving resource and slightly mutated rule parameters to their children.

## Run it now

**Open [index.html](index.html) directly in your browser.** No dependencies, backend, internet, build step, or GPU required. Physical states and graph topology have no coordinate fields. The 2D visual layout is computed separately and NEVER feeds back into the physical simulation.

Click a node to cut one of its edges. Press **P** after selecting it to transfer resource from another node; the transfer conserves total mass. Switch between the fixed, rewiring and inheritable-rule conditions, pause, step and export measurements.

For reproducible experiments, install Node.js 18+:

~~~sh
node tests/test.js
node experiment.js --seeds 5 --steps 3000 --n 120 --interval 250 --output results.json
~~~

No npm packages needed. This is not a GPU-based 3D cellular simulation; it is a deliberately transparent graph-first investigation.

## Mechanism: the supplied rules

1. **Initialization.** Random recursive spanning tree followed by random chords, roughly four links per element. The seed graph is connected and unembedded, not a ring, 2D lattice, or 3D lattice.
2. **Paired forcing.** Each fixed source/destination pump pair transfers up to 0.13 resource per tick. Resource is moved, not created.
3. **Flux.** A link (i,j) proposes q = 0.085 * w_ij * (m_i - m_j). Synchronous per-node rescaling caps outgoing transfers at 35% of a source node's present resource, so masses cannot become negative.
4. **Conductance adaptation.** Each link tracks a local exponential average of its absolute flux. A conductance update depends on that trace and the endpoint genes; weak old links can be pruned when endpoints keep at least two alternative links.
5. **Local growth.** A node samples a neighbor and that neighbor's neighbor. It may propose a new edge based on a local mass difference and its exploration gene, if both endpoints have free capacity. New bonds reserve a small amount of resource, returned upon pruning. No dimension-3 objective or global topology optimizer exists.
6. **Inheritance.** Only in the evolve condition, sufficiently resource-rich nodes may bud: offspring inherit mutated genes and receive a share of the parent's resource. They form one or two local links. There is no mortality, reproductive competition or demonstrated natural selection yet; this is heritable growth rather than an evolved ecosystem.

The conserved accounting total includes free node resource PLUS resource locked in created bonds. Construction costs and finite node capacity constrain growth. Pumps are external forcing; nodes cannot choose where the pumps connect.

## Three matched control conditions

| Condition | Resource flow | Link changes | Budding / mutation |
|---|---|---|---|
| fixed | yes | none | none |
| rewire | yes | local flux reinforcement, pruning, two-hop closure | none |
| evolve | yes | same as rewire | yes |

Initial graph and pump locations are seed-matched. The modes can consume different random numbers after their trajectories diverge. Additional edges make transport easier even without intelligence: compare pump imbalance **alongside link count and bond costs**, not as proof of learning.

## Geometry measurements and the false-positive trap

The dashboard exports shortest-path radius-ball volumes, an approximate log-log **growth slope**, sampled connected-component coverage, local clustering, mean degree, pump imbalance, number of unsaturated fit radii, and numerical mass drift.

An apparent growth slope near **3 does not mean the network formed 3D space**. Even a random finite graph with rapid exponential neighborhood growth can return a near-three slope when fitted over only two or three unsaturated graph radii. The viewer warns if the diagnostic has insufficient scales.

Real evidence would require larger graphs, robust fits over substantial scale intervals, comparison against size- and degree-matched null graphs, a stable spectral dimension from diffusion return probabilities, and checks that local propagating signals behave consistently with the inferred dimension. These experiments are not yet implemented or completed. The first smoke run illustrates the false-positive problem (see [docs/smoke.md](docs/smoke.md)).

## Five research gates

- **G0 — physical consistency:** No coordinates in the physics, deterministic replay, nonnegative resource, numerical conservation, and working fixed-topology baseline.
- **G1 — topology changes:** Do local rules create repeatable graph motifs across fresh seeds? Compare matched controls and account for added edges.
- **G2 — effective geometry:** Do ball volumes exhibit a stable, statistically supported power law over adequate unsaturated scales? A near-three scalar alone is a fail.
- **G3 — independent diffusion:** Does random-walk return probability imply a compatible spectral dimension, with finite-size null controls?
- **G4 — functional consequence:** Do emergent structures improve held-out signal routing, retention, or damage recovery under equal resource and edge budgets?

Only G0 is implemented as an engineering test. The other gates are open research questions, not achievements.

## Files

- [core.js](core.js) — identical coordinate-free graph dynamics used in browser, test suite, and CLI.
- [index.html](index.html) — offline graph viewer with interactive damage, controls, and export. Layout never influences physics.
- [experiment.js](experiment.js) — seed-matched trajectories and JSON export.
- [tests/test.js](tests/test.js) — conservation, replay, frozen topology, dimension-reference sanity checks.
- [docs/smoke.md](docs/smoke.md) — exploratory local measurements and caveats.
- [.github/workflows/test.yml](.github/workflows/test.yml) — basic CI smoke check.

## What this is and isn't

Inspired by [Emergence](https://github.com/anttiluode/Emergence) and [EmergenceAstra](https://github.com/anttiluode/EmergenceAstra), adaptive networks, emergent-geometry proposals, and finite-size scaling in statistical physics. Not an implementation of Quantum Graphity, Flow-Lenia, general relativity or a trained AI. No thinking, open-ended evolution or emergent 3D space has been established. We deliberately kept the visualization separate from the physics so a beautiful picture is not mistaken for a discovery.
