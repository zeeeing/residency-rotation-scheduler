# Posting Allocator Constraints

All constraints below are implemented in [`server/services/posting_allocator.py`](./server/services/posting_allocator.py).

- “Hard” constraints must hold in every solution.
- “Soft” constraints are traded off in the objective with penalties or bonuses.

## Glossary

- **CCR**: Cross-Cluster Rotation
- **SR**: Senior Residency

Postings include:

- **GM**: General Medicine
- **GRM**: Geriatric Medicine
- **MICU**: Medical ICU
- **RCCM**: Respiratory Critical Care Medicine
- **ED**: Emergency Department
- **CVM**: Cardiovascular Medicine
- **Endocrine**: Endocrinology
- **Gastro**: Gastroenterology
- **MedComm**: Medical Community
- **Haemato**: Haematology
- **ID**: Infectious Diseases
- **Med Onco**: Medical Oncology
- **PMD**: Palliative Medicine
- **RAI**: Rheumatology and Immunology

## Overview of posting assignment

The solver assigns exactly one thing per resident per block (a posting or OFF), while respecting:

- What is already fixed (history, pins, leave)
- Career stage progression (what a resident is allowed to do)
- Posting structure rules (block lengths, contiguity, start months)
- Programme requirements (cores, electives, ICU packs)
- Optimisation preferences (electives, SR, seniority, bundles)

## Linking, Inputs, and Pre-conditions

#### Variable binding

Refer to `# CREATE DECISION VARIABLES` section of the code in [`server/services/posting_allocator.py`](./server/services/posting_allocator.py).

- For each resident, each posting assignment is represented at 3 levels:
  - Block-level variables
    - In dictionary format: `x[mcr][posting][block]`
    - If resident `mcr` is assigned to posting `p` in block `b`, then `x[mcr][posting][block]=1`.
  - Selection flags
    - Whether the posting is selected
    - If posting `p` is selected at least once for the resident (run-level selection), then `selection_flags[mcr][p]=1`.
  - Run-count
    - Run: 1 continuous posting assignment whose length is fixed by `required_block_duration`
    - CCR with `required_block_duration = 3` → 3 consecutive blocks in 1 run
    - `run_count` = How many times the resident undertakes that posting as a full, valid rotation
- These are tied together
  - For each posting, `Σ blocks = run_count × required_block_duration`: Must assign full, valid runs (no partial runs or extra blocks)
  - `selected ⇔ run_count ≥ 1`:

#### Pins

Refer to `# APPLY PINNED ASSIGNMENTS (IF ANY)` section of the code in [`server/services/posting_allocator.py`](./server/services/posting_allocator.py).

- Explicit pinned rows and current-year resident-history rows fix `x[mcr][posting][block] = 1`.
- If a resident already has a known posting (because the user pinned it or because it already happened this year), the solver is forced to assign that exact posting in that block.

#### Leaves

- Leaves are normalised (deduped) (`normalised_leaves`) so duplicates are removed.
- Leaves force `OFF` in those blocks.
- If a leave specifies a posting code, it reserves capacity. That capacity is removed from the posting pool.
- Leaves block residents and consume capacity, preventing over-booking

#### Career progression

- 3 stages
  - Stage 1: `blocks_completed < 12`
  - Stage 2: `12 <= blocks_completed < 24`
  - Stage 3: `blocks_completed >= 24`
- Stage per block advances only on worked blocks (leave blocks pause the counter)
- This drives stage-aware rules (CCR, GM caps, SR window), eg HC11, HC15

## Hard Constraints

Refer to `# DEFINE HARD CONSTRAINTS` section of the code in [`server/services/posting_allocator.py`](./server/services/posting_allocator.py).

#### HC1 — Exclusivity per block

- For each resident, each block must have exactly one of:
  - A posting; or
  - `OFF`. Leave blocks are forced to `OFF`.
    - `off_or_leave[mcr][b] == 1`
- `[x[mcr][p][b] for p in posting_codes] + [off_or_leave[mcr][b]] = 1`

#### HC2 — Posting capacity

- Per-block headcount ≤ `max_residents` minus any slots reserved for leave.
- `available_capacity = max_residents - leave_reserved_slots`
- `sum(x[r["mcr"]][p][b] for r in residents) <= available_capacity`

#### HC3 — Consecutive runs

- Each posting honours `required_block_duration` using an automaton (no fragmented runs).
- Postings with multi-block durations must have consecutive blocks and exactly match the required length.

#### HC4 — CCR availability by stage

- CCR is forbidden (0 CCR this year):
  - in stage 1
  - if CCR already done
  - if no stage ≥2 blocks exist
- Otherwise:
  - Exactly one run when stage 3 blocks exist.
  - At most one run when only stage 2 blocks exist.

#### HC5 — Core caps (per resident)

- Do not exceed base core requirements.
- If already met historically, block further assignments of that base.
- Extra GM guard:
  - GM cannot be completed to 6 blocks unless a CCR is present.
  - Without CCR, GM is capped at 5 blocks.

#### HC6 — Elective repetition

- At most one variant of an elective base.
- If a base elective is already completed historically, all variants of that base are disallowed.
- Example of variants: `GM (NUH)`, `GM (SGH)`, `GM (CGH)`, `GM (SKH)`, `GM (WH)`

#### HC7a — MICU/RCCM institution consistency

- Cannot select MICU and RCCM from different institutions.
- If MICU and RCCM are both assigned, they must come from the same institution.

#### HC7b — MICU/RCCM contiguity

- MICU/RCCM blocks must form one contiguous run and cannot span Dec→Jan.

#### HC8 — Dec→Jan guardrail

- No posting may have runs in both Dec (block 6) and Jan (block 7).

#### HC9 — GRM start months

- GRM may only start on odd blocks
- Even-block GRM must continue from the prior block

#### HC10 — Quarter starts for 3-block runs

- Postings of duration 3 may only start on blocks 1, 4, 7, or 10.
- Other blocks must be continuations.

#### HC11 — Stage-1 GM cap

- Max three GM blocks in stage 1.
- Historical GM counts toward the cap.

#### HC12 — ED↔GRM contiguity

- If ED or GRM are present, all ED+GRM blocks must form one contiguous run.

#### HC13 — ED↔GRM↔GM contiguity

- If ED, GRM, and GM all appear, their combined blocks must form one contiguous run.

#### HC14 — (Disabled) Guardrail for ED and GRM

- Force 1 ED and 1 GRM when neither is done historically.

#### HC15 — MICU/RCCM by stage

- Stage 1 may optionally deliver pack #1 (1 MICU, 2 RCCM).
- If pack #1 not done historically, stage 1+2 together must deliver pack #1.
- If pack #1 is already done and stage 2 blocks exist, stage 2 may optionally deliver pack #2 (2 MICU, 1 RCCM).
- Stage 3 assigns exactly the remaining MICU and RCCM blocks needed to reach three each after history.
  - 3 MICU + 3 RCCM total (including history)

#### HC16 — Balancing within halves and balancing deviation per posting 
- Within blocks 1-6 and within blocks 7-12, the user can optionally input how much imbalance is allowed between the maximum and minimum number of residents assigned across 6 blocks. 
  - 0 <= (max - min) <= deviation
  - GRM (TTSH) and MedComm (TTSH) share the same balancing deviation and quota.
    - GRM (TTSH) and MedComm (TTSH) are treated as a single balancing group.
    - Balancing is enforced on the sum of individual assignments across the group.
- Else, by default (no input on the balancing deviation), the imbalance is 0. Resident counts per block are equal within blocks 1–6 and within blocks 7–12 (leave-reserved slots are treated as occupied).
- `balancing_deviations`

## Soft Constraints and Objective Terms

Refer to `# DEFINE SOFT CONSTRAINTS WITH PENALTIES` section of the code in [`server/services/posting_allocator.py`](./server/services/posting_allocator.py).

#### SC1 - Elective requirements

- Stage 2
  - Must have ≥1 elective completed to date (history + current year).
  - If elective prefs exist, a second elective (history + current year) earns a bonus (`s2_elective_bonus_terms`).
  - Shortfall uses the same `elective_shortfall_penalty` weight (s2 elective shortfall).
- Stage 3
  - Aim for five total electives.
  - A slack var (`*_elective_req_unmet`) incurs `elective_shortfall_penalty` when short (s3 elective shortfall).

#### SC2 - Core requirements (stage 3)

- For each unmet core base, enforce equality to the requirement unless a slack var (`{base}_req_unmet`) is paid, incurring `core_shortfall_penalty`.

#### SC3 - CCR timing bonus

- Bonus for completing CCR during stage 2 and nowhere else (when not yet done). Related to HC4.
- `ccr_stage2_bonus_terms`

#### SC4 - SR preference constraints and bonuses

- SR prefs are normalised to bases with available variants (deduped). Bases with any completed blocks by the resident are removed. If the planning year includes career blocks 28–30, elective SR bases must also appear in elective preferences or they are removed.
- Exactly one SR base is chosen per resident; a "none" option is allowed but strongly penalised to keep it as a fallback.
- Chosen SR does not require assignment. If chosen, postings of that base are forbidden outside career blocks 19–30 (except GM, which requires at least three blocks in 19–30).
- Rank-weighted SR preference bonus (uses the `preference` weight), plus an extra bonus for placing the chosen SR in blocks 19–24.
- Elective postings whose base is chosen as SR do not receive elective preference bonuses to avoid double-counting.

#### Bonuses and penalties (objective terms)

- Preference bonus: rank-weighted (via `preference` weight) for elective preferences when the posting is selected and not chosen as SR.
- SR bonuses: rank-weighted SR choice bonus (via `preference` weight), 19–24 window bonus, and a strong fixed bonus for having a chosen SR (`sr_choice_bonus_terms`).
- Seniority bonus: per-block bonus scaled by stage value and the `seniority` weight.
- Core prioritisation bonus: fixed bonus for selecting any core posting.
- ED/GRM/GM bonuses: pair bonus for ED+GRM, three-GM bonus when exactly three GM blocks exist with ED+GRM, and a half-year bundle bonus when ED/GRM/GM stay within one half-year.
- GM@KTPH bonus: bonus for `GM (KTPH)` blocks in stage 1 (related to HC11).
- MICU/RCCM pack shortfall penalty: uses the `core_shortfall_penalty` weight when pack #1 is not completed during stage 2 and stage 2 does not finish in the current AY.
- OFF penalty: strong penalty (`OFF` not on leave) to discourage unused blocks.

#### Objective

- Maximise the sum of bonuses minus penalties above (weights primarily driven by `weightages` plus a few fixed constants noted inline).
