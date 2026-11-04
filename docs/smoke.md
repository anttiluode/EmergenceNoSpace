# Exploratory smoke test: NOT evidence of emergent 3D

Ran locally with Node.js using the three matching conditions, seeds 1–3, 120 starting nodes, 2,500 ticks, measurement every 500 ticks. An unembedded random initial graph had about 240 edges.

| Mode | Nodes after 2,500 | Edges | Clustering | Apparent growth slope | Mean usable fit radii | Pump imbalance |
|---|---:|---:|---:|---:|---:|---:|
| Fixed graph | 120 | 240.0 | 0.023 | 2.754 | 2.17 | 1.337 |
| Rewire | 120 | 293.7 | 0.136 | 2.853 | 1.67 | 0.701 |
| Rewire + inheritance | 152 | 355.7 | 0.158 | 2.585 | 2.33 | 0.626 |

**Critical warning:** the fixed random graph starts with an apparent exponent near 3 despite having no intentionally embedded 3D geometry; fits use fewer than three unsaturated radii on average. That is a finite-size trap, not the discovery of space. Both adaptive modes use more edges than the fixed graph, so they can lower pump imbalance by adding transport capacity. The growing condition has mutated inherited numerical rules but no mortality or demonstrated natural-selection improvement.

This is a three-seed engineering smoke run, not a preregistered scientific result. Unit tests check deterministic replay, conservation including bond reservations, absence of physical coordinates, and static topology in the fixed control. No confidence intervals or broad robustness claims.
