# RestorationOS Project Blueprint

**Status:** Source of truth for all future product and engineering decisions  
**Audience:** Founders, product, engineering, and future teammates  
**Companion detail:** [DIGITAL_TWIN_ARCHITECTURE.md](./DIGITAL_TWIN_ARCHITECTURE.md)

This blueprint consolidates official product documentation into one coherent vision. Where any prior note, scaffold README, or implementation detail conflicts with this file, **this file wins**. The Digital Twin — with the Building as source of truth — remains the center of RestorationOS.

---

# Part I — Documentation Audit

## Scope of review

| Location | Role |
|----------|------|
| `docs/DIGITAL_TWIN_ARCHITECTURE.md` | Only official product architecture document in `docs/` |
| `README.md` (repo root) | Create Next App scaffold — **not** product documentation |
| `AGENTS.md` / `CLAUDE.md` | Tooling notes for agents — **not** product documentation |

There are no other markdown files inside `docs/` today. The audit below is therefore an internal consistency and completeness review of the Digital Twin architecture document, plus gaps that must be resolved so the platform can scale for five years without fragmenting.

---

## 1. Contradictions (and how this blueprint resolves them)

### 1.1 “Everything belongs to a room” vs Building-level Drying Log

**Tension:** Design principles require field evidence to be room-scoped, while the Drying Log is described as belonging to the Building.

**Resolution:**  
The Drying Log is a **rollup narrative**, not a second home for orphan facts. Every reading, equipment change, and drying note that feeds the log remains room-scoped (and wall-anchored when known). The Building Drying Log is how those room facts are read together over time. No moisture value, photo, or equipment placement may exist only on the Building with no room.

### 1.2 Photos / moisture “contained by Room” and “anchored by Wall”

**Tension:** Both Room and Wall appear to own the same evidence types.

**Resolution (attachment rule):**  
- **Required:** evidence belongs to a **Room**.  
- **Optional precision:** evidence may be **anchored** to a **Wall** (or future surface/assembly) inside that room.  
Wall never replaces Room as the owner. Wall increases precision; Room remains the home.

### 1.3 Estimate in the workflow but absent from Core Objects

**Tension:** The workflow ends in Estimate, but Estimate is not listed as a core object (only mentioned under derived outputs).

**Resolution:**  
Estimate is a **derived artifact**, not twin truth. It is named explicitly in this blueprint’s object map under Derived Artifacts so the workflow and the catalog stay aligned — without elevating Estimate to the same tier as Building or Room.

### 1.4 Notes and Timeline Events used, never defined

**Tension:** Relationships and principles depend on Notes and Timeline Events; Core Objects omit them.

**Resolution:**  
Both are first-class **twin support objects** in this blueprint (still not inventing new product features — only naming concepts the architecture already relies on).

### 1.5 Floor and Wall in the model, thin in the workflow diagram

**Tension:** Spatial hierarchy includes Floor and Wall; the top workflow arrow jumps Building → Rooms and never shows Floor/Wall.

**Resolution:**  
Workflow step “Rooms” means **structure the twin**: Floors → Rooms → Walls as inspection deepens. The arrow stays simple for storytelling; structuring always includes the full spatial hierarchy when known.

---

## 2. Duplicate ideas (consolidated here)

These ideas appear multiple times in `DIGITAL_TWIN_ARCHITECTURE.md`. This blueprint states each once as governing law:

| Idea | Stated once as |
|------|----------------|
| Building is source of truth; estimate is derived | Philosophy |
| Evidence before paperwork | Philosophy + Evidence rule |
| Room as primary work unit | Domain model + Attachment rule |
| Traceability / history / room timelines | Design principles |
| AI suggests; humans + evidence decide | AI posture |
| Closing slogan restating philosophy | Kept only as the north-star line at the end |

Detail and examples remain in `DIGITAL_TWIN_ARCHITECTURE.md`. This file is the compressed constitution.

---

## 3. Missing concepts (implied already — named for scale)

These are **not new features**. They are concepts the architecture already uses or requires to stay consistent:

| Concept | Why it must be named |
|---------|----------------------|
| **Estimate** (derived) | Appears in workflow; must sit clearly below Scope |
| **Note** | Referenced throughout; needs a home in the catalog |
| **Timeline Event** | Required by “every action creates history” and room timelines |
| **Attachment rule** (Room required, Wall optional) | Prevents dual-ownership bugs for five years |
| **Truth vs Derived layers** | Keeps estimate/report from polluting the twin |
| **Organization / User as platform envelope** | Scale, tenancy, and audit require an explicit outer boundary |

Still intentionally out of scope for this blueprint (to avoid inventing product): concrete schemas, rate databases, carrier integrations, mobile offline packs, and specific UI IA.

---

## 4. Scale improvements (next five years — no new feature invention)

1. **Treat this blueprint as the product constitution**; keep `DIGITAL_TWIN_ARCHITECTURE.md` as the expanded domain essay. Do not fork a third philosophy doc.  
2. **Enforce the Truth vs Derived boundary** in every epic: if a change makes Estimate or Report rewrite Building facts, reject it.  
3. **Enforce the attachment rule** in every evidence epic: Room required; Wall optional precision.  
4. **Scale the twin by room**, not by document type — dashboards and AI should aggregate room timelines, not invent building-only facts.  
5. **Keep Organization as the tenancy boundary** so multi-branch and permissions grow without splitting the twin model.  
6. **Prefer additive precision** (add Wall anchors, richer timelines) over parallel systems (side spreadsheets, shadow scopes).  
7. **AI only attaches hypotheses to Rooms/Walls with cited evidence** — never silent writes into twin truth.  
8. **When docs disagree, update the blueprint first**, then align the architecture companion — never the other way around with silent drift.

---

# Part II — Product Vision

## What RestorationOS is

RestorationOS is a **Digital Twin platform for property restoration**.

Contractors capture the real building — its floors, rooms, walls, photos, moisture, equipment, and work history — and from that living twin they derive scope, estimate, and reports.

It is not an estimating tool with photos bolted on.  
It is a twin of the job site, with paperwork as output.

## North-star sentence

**The Building is the source of truth. The estimate is generated from the building. The building is never generated from the estimate.**

---

# Part III — Philosophy

*(Preserved from official architecture — not rewritten.)*

The Building is the source of truth.

RestorationOS exists to capture reality: what the property is, what was damaged, what was measured, what was done, and what changed over time. That living record is the Digital Twin of the building.

The estimate is a derived artifact. It is generated **from** the building — from rooms, walls, photos, moisture readings, equipment placements, drying progress, and documented scope. The building is **never** reverse-engineered from an estimate, spreadsheet, or carrier worksheet.

| Wrong model | RestorationOS model |
|-------------|---------------------|
| Estimate defines the job | Building defines the job |
| Docs chase paperwork | Twin captures evidence first |
| Scope is negotiated abstractly | Scope is grounded in rooms and materials |
| History is email threads | History is the twin timeline |

If a piece of information cannot be attached to the building (or to a room / wall within it), it does not belong as a first-class fact in RestorationOS. Paperwork may summarize the twin; it must not redefine it.

---

# Part IV — Layered Domain Model

Objects fall into three layers. Only the Twin Truth layer may define reality.

## Layer A — Platform envelope

| Object | Role |
|--------|------|
| **Organization** | Contractor company (tenancy, users, settings). Owns Losses. |
| **User** | Person who acts on a Loss; every action is attributable. |

## Layer B — Twin truth (Digital Twin)

| Object | Role |
|--------|------|
| **Loss** | Job / claim container. Operational wrapper for the engagement. |
| **Building** | Root of the Digital Twin. Source of truth for the property. |
| **Floor** | Level within the Building; organizes Rooms spatially. |
| **Room** | Primary work unit. Home of field evidence and work. |
| **Wall** | Surface/assembly inside a Room; optional precision anchor. |
| **Photo** | Visual evidence (time + place). |
| **Moisture Reading** | Measured moisture (time + place). |
| **Equipment** | Mitigation gear in service, placed in a Room. |
| **Note** | Written observation tied to Room (optionally Wall). |
| **Timeline Event** | Historical record of a meaningful change or action on the twin. |
| **Drying Log** | Rollup narrative of drying over time, composed from room-scoped facts. |
| **Scope Item** | Unit of work concluded from twin evidence (still evidence-backed). |

## Layer C — Derived artifacts (outputs)

| Object | Role |
|--------|------|
| **Estimate** | Financial projection of Scope Items + rate/commercial logic. Never parents the Building. |
| **Report** | Point-in-time communication view of the twin for an audience. Never a second source of truth. |

### Attachment rule (non-negotiable)

1. Field evidence and field work **belong to a Room**.  
2. They **may** be anchored to a **Wall** (or future surface) for precision.  
3. Building-level views **aggregate** room facts; they do not own orphan evidence.  
4. The Drying Log **rolls up** room-scoped drying facts; it does not replace room ownership.

---

# Part V — Relationships

Conceptual composition only — no IDs, no SQL.

```
Organization
    has many Users
    has many Losses

Loss
    contains Building          ← twin root

Building
    contains Floors
    offers Drying Log (rollup)
    produces Scope Items, Estimate, Reports (derived path)

Floor
    contains Rooms

Room
    contains Walls
    contains Photos
    contains Moisture Readings
    contains Equipment
    contains Notes
    contains Timeline Events
    contributes Scope Items
    contributes Drying Log entries
    owns a Room Timeline

Wall
    anchors Photos
    anchors Moisture Readings
    anchors Notes
    anchors Timeline Events
    may relate to Equipment effects on that assembly
```

### Traceability chain

```
Organization → Loss → Building → Floor → Room → (optional) Wall
                                                ↓
                    Photo / Moisture / Note / Equipment / Timeline Event
                                                ↓
                              Scope Item → Estimate → Report
```

Direction of truth is always **down the twin, then out to derived artifacts** — never Estimate → Building.

---

# Part VI — Digital Twin Workflow

Linear in intent, iterative in practice. Loops are allowed; reversing the direction of truth is not.

```
Create Loss
    ↓
Building
    ↓
Rooms          ← includes Floors → Rooms → Walls as structure deepens
    ↓
Photos
    ↓
Moisture
    ↓
Equipment
    ↓
Scope
    ↓
Estimate       ← derived
    ↓
Report         ← derived
```

1. **Create Loss** — Job identity, customer, claim/engagement context.  
2. **Building** — Twin root established; Digital Twin begins.  
3. **Rooms** — Spatial skeleton: floors, rooms, then walls as inspection allows.  
4. **Photos** — Evidence on rooms (wall-anchored when known).  
5. **Moisture** — Readings with place and time.  
6. **Equipment** — Placement and changes feed room timelines and the drying rollup.  
7. **Scope** — Conclusions from evidence, not from a blank estimate form.  
8. **Estimate** — Price the scope; follow the building when scope changes.  
9. **Report** — Publish views of the twin; regenerate when the twin updates.

**Iteration rule:** New evidence updates the Building twin first. Scope, Estimate, and Report follow.

---

# Part VII — Design Principles

Non-negotiable for product and engineering:

1. **The Building is always the source of truth.**  
2. **Everything (field evidence / field work) belongs to a Room.**  
3. **Wall is optional precision, never a substitute for Room ownership.**  
4. **Everything is traceable** to twin origin and User/Organization action.  
5. **Nothing should exist without evidence** (or an explicit, documented exception).  
6. **Every action creates history** (Timeline Events / append-only intent).  
7. **Every room has its own timeline**; building timelines compose from rooms.  
8. **Derived artifacts never rewrite twin truth.**

---

# Part VIII — Future AI (conceptual posture)

AI accelerates capture, organization, and insight. It remains subordinate to the Building.

Capabilities already named in official architecture (conceptual only):

- Damage Detection  
- Room Classification  
- Drying Progress  
- Scope Suggestions  
- Timeline Replay  
- Wall Healing Visualization  
- Photo Organization  
- Risk Detection  

**AI law:** Models suggest; evidence and humans decide. No AI feature may invent building facts without an evidence trail and confirmation path onto Room (and optional Wall).

---

# Part IX — How to use these documents

| Document | Purpose |
|----------|---------|
| **`docs/PROJECT_BLUEPRINT.md`** (this file) | Constitution and source of truth for vision, layers, rules, and workflow |
| **`docs/DIGITAL_TWIN_ARCHITECTURE.md`** | Expanded domain essay: richer explanations of objects, AI, and principles |

### Governance

- New epics must state which **layer** they touch (Platform / Twin Truth / Derived).  
- Features that attach evidence must follow the **attachment rule**.  
- Features that produce Estimate or Report must declare they are **derived**.  
- Do not create parallel “shadow” truth (side scopes, side moisture sheets) that bypass the twin.  
- When unclear, re-read the north-star sentence and choose the Building.

---

# Closing

RestorationOS is a Digital Twin platform for restoration contractors.

Capture the Building.  
Accumulate evidence in Rooms.  
Derive Scope.  
Then Estimate and Report.

Five years from now, the same sentence must still be true:

**The Building is the source of truth. The estimate is generated from the building.**
