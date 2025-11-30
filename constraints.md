# Posting Allocator Constraints

All constraints below are implemented in `server/services/posting_allocator.py`. Items marked “Hard” must hold in every solution; “Soft” items are traded off in the objective with penalties or bonuses.

## Linking, Inputs, and Pre-conditions

- Variable binding: For each resident/posting, block-level vars, selection flags, and run-count vars are tied together (`Σ blocks = run_count × required_block_duration`; `selected ⇔ run_count ≥ 1`).
- Pins: Explicit pinned rows and current-year resident-history rows fix `x[mcr][posting][block] = 1`.
- Leaves: Normalised (deduped) leaves force `OFF` in those blocks and reserve capacity when a leave specifies a posting code.
- Career progression: Stage per block advances only on worked blocks (leave blocks pause the counter); this drives stage-aware rules (CCR, GM caps, SR window). Flags capture whether stages 1/2 actually finish within the AY so stage-completion rules can switch between hard and soft forms.

## Hard Constraints

1. HC1 — Exclusivity per block: Exactly one posting or `OFF` per resident per block; leave blocks are forced to `OFF`.
2. HC2 — Posting capacity: Per-block headcount ≤ `max_residents` minus any slots reserved for leave.
3. HC3 — Consecutive runs: Each posting honours `required_block_duration` using an automaton (no fragmented runs).
4. HC4 — CCR availability by stage: CCR forbidden in stage 1. If CCR already done, or no stage ≥2 blocks exist, zero CCR this year. Otherwise: exactly one run when stage 3 blocks exist; at most one run when only stage 2 blocks exist.
5. HC5 — Core caps (per resident): Do not exceed base core requirements; if already met historically, block further assignments of that base. Extra guard: GM cannot be completed to 6 blocks unless a CCR is present (capped at 5 otherwise).
6. HC6 — Elective repetition: At most one variant of an elective base; if a base elective is already completed historically, all variants of that base are disallowed.
7. HC7a — MICU/RCCM institution consistency: Cannot select MICU and RCCM from different institutions.
8. HC7b — MICU/RCCM contiguity: MICU/RCCM blocks must form one contiguous run and cannot span Dec→Jan.
9. HC8 — Dec→Jan guardrail: No posting may have runs in both Dec (block 6) and Jan (block 7).
10. HC9 — GRM start months: GRM may only start on odd blocks (even-block GRM must continue from the prior block).
11. HC10 — Quarter starts for 3-block runs: Postings of duration 3 may only start on blocks 1, 4, 7, or 10; other blocks must be continuations.
12. HC11 — Stage-1 GM cap: Max three GM blocks in stage 1 (historical GM counts toward the cap).
13. HC12 — ED↔GRM contiguity: If ED or GRM are present, all ED+GRM blocks must form one contiguous run.
14. HC13 — ED↔GRM↔GM contiguity: If ED, GRM, and GM all appear, their combined blocks must form one contiguous run.
15. HC14 — (Disabled) Guardrail that would force 1 ED and 1 GRM when neither is done historically.
16. HC15 — MICU/RCCM by stage: Stage 1 may optionally deliver pack #1 (1 MICU, 2 RCCM). If pack #1 not done historically, stage 1+2 together must deliver pack #1 when stage 2 finishes within the AY; if stage 2 does not finish this year the pack becomes a soft penalty instead. If pack #1 is already done and stage 2 blocks exist, stage 2 may optionally deliver pack #2 (2 MICU, 1 RCCM). Stage 3 assigns exactly the remaining MICU and RCCM blocks needed to reach three each after history.
17. HC16 — Balancing within halves: For every posting except GM/ED/GRM, resident counts per block are equal within blocks 1–6 and within blocks 7–12 (leave-reserved slots are treated as occupied).

## Soft Constraints and Objective Terms

- Elective requirements:
  - Stage 2: If stage 2 finishes this AY, must have ≥1 elective completed to date (history + current year). If stage 2 continues into next AY, missing this minimum is allowed with a penalty; if elective prefs exist, a second elective (history + current year) earns a bonus.
  - Stage 3: Aim for five total electives; a slack var (`*_elective_req_unmet`) incurs `elective_shortfall_penalty` when short.
- MICU/RCCM pack (stage 2 incomplete): When stage 2 does not finish in the AY and pack #1 is still outstanding, missing the 1 MICU / 2 RCCM combination is allowed with a `core_shortfall_penalty` slack.
- Core requirements (stage 3): For each unmet core base, enforce equality to the requirement unless a slack var (`{base}_req_unmet`) is paid, incurring `core_shortfall_penalty`.
- CCR timing bonus: Bonus for completing CCR during stage 2 and nowhere else (when not yet done).
- SR preference constraints and bonuses:
  - SR prefs are normalised to bases with available variants. If any SR-pref posting is selected, exactly one variant must be marked as the chosen SR.
  - Chosen SR is forbidden outside career blocks 19–30; if no historical SR in blocks 19–24, the chosen SR must fall in blocks 25–30 (when such blocks exist).
  - Rank-weighted SR preference bonus (uses the `preference` weight), plus an extra bonus for placing the chosen SR in blocks 19–24.
  - Elective postings chosen as the SR do not receive elective preference bonuses to avoid double-counting.
- Preference bonus: Rank-weighted (via `preference` weight) for elective preferences when the posting is selected and not chosen as SR.
- Seniority bonus: Per-block bonus scaled by stage value and the `seniority` weight.
- Core prioritisation bonus: Fixed bonus for selecting any core posting.
- ED/GRM/GM bonuses:
  - Pair bonus when both ED and GRM are selected.
  - Three-GM bonus when exactly three GM blocks exist alongside at least one ED and one GRM.
  - Half-year bundle bonus when ED, GRM, and GM all appear but stay within the same half-year.
- GM@KTPH bonus: Bonus for `GM (KTPH)` blocks in stage 1.
- OFF penalty: Strong penalty (`OFF` not on leave) to discourage unused blocks.
- Objective: Maximise the sum of bonuses minus penalties above (weights primarily driven by `weightages` plus a few fixed constants noted inline).
