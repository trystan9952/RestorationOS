# RestorationOS Digital Twin Architecture

This document is the long-term technical design guide for RestorationOS. It defines the product philosophy, core domain objects, relationships, workflow, future AI capabilities, and design principles that should govern development for the next five years.

It is intentionally schema-agnostic: no SQL, no table definitions, no migrations, and no implementation details. Storage, APIs, and UI may change. The Digital Twin model described here should not.

---

# RestorationOS Philosophy

**The Building is the source of truth.**

RestorationOS exists to capture reality: what the property is, what was damaged, what was measured, what was done, and what changed over time. That living record is the Digital Twin of the building.

The estimate is a derived artifact. It is generated **from** the building — from rooms, walls, photos, moisture readings, equipment placements, drying progress, and documented scope. The building is **never** reverse-engineered from an estimate, spreadsheet, or carrier worksheet.

This inversion is the product’s core advantage:

| Wrong model | RestorationOS model |
|-------------|---------------------|
| Estimate defines the job | Building defines the job |
| Docs chase paperwork | Twin captures evidence first |
| Scope is negotiated abstractly | Scope is grounded in rooms and materials |
| History is email threads | History is the twin timeline |

If a piece of information cannot be attached to the building (or to a room / wall within it), it does not belong as a first-class fact in RestorationOS. Paperwork may summarize the twin; it must not redefine it.

---

# Core Objects

These objects form the Digital Twin domain. Names are conceptual. Persistence format is decided later.

## Loss

A **Loss** is the restoration job: a claim event or work engagement for a specific property and customer context. It is the operational container for everything that happens on that job — intake, inspection, mitigation, drying, scope, estimate, and reporting.

A Loss answers: *What job are we working? For whom? Under what claim or engagement?*

## Building

A **Building** is the physical property being restored. It is the root of the Digital Twin. Address, occupancy context, construction character, and the structural hierarchy (floors → rooms → walls) all live here.

The Building is never optional once a Loss is active. Without a Building, there is no twin.

## Floor

A **Floor** is a vertical level within the Building (e.g., basement, first floor, second floor). Floors organize rooms spatially so the twin mirrors how contractors and adjusters walk the property.

## Room

A **Room** is the primary work unit inside the Digital Twin. Almost all field evidence and operational activity belongs to a Room: photos, moisture, equipment, notes, timeline events, and scope.

Rooms are where restoration work becomes concrete.

## Wall

A **Wall** (and, by extension, other room surfaces/assemblies as the model matures) is a material face or assembly within a Room. Walls hold localized damage evidence: photos of that surface, moisture readings on that material, and notes specific to that assembly.

Walls give the twin spatial precision beyond “something happened in the kitchen.”

## Photo

A **Photo** is visual evidence. Photos document conditions before, during, and after work. They must be attributable — ideally to a Room, and when possible to a Wall or other precise location — with time context so the twin can be replayed.

Photos are evidence, not decoration.

## Moisture Reading

A **Moisture Reading** is a measured moisture value tied to a place and time (Room and preferably Wall/material). Readings are the quantitative backbone of drying decisions and progress.

A reading without location and time is incomplete.

## Equipment

**Equipment** is mitigation gear placed in service (air movers, dehumidifiers, air scrubbers, etc.). Equipment belongs to a Room (or a clearly defined placement context) and participates in the drying story of that space.

## Drying Log

A **Drying Log** is the chronological record of drying conditions and actions: psychrometrics, equipment changes, readings over time, and daily mitigation notes. It turns scattered readings and equipment moves into a coherent drying narrative for the Building and its Rooms.

## Scope Item

A **Scope Item** is a unit of proposed or approved work derived from twin evidence (e.g., tear-out of a wet wall, clean and dry, apply antimicrobial). Scope Items must be traceable back to rooms, materials, photos, and readings that justify them.

Scope is a conclusion. Evidence is the premise.

## Report

A **Report** is a generated communication artifact (status report, drying report, final documentation package). Reports are projections of the twin for a specific audience and moment. They do not become a second source of truth.

## User

A **User** is a person who acts in RestorationOS: technician, project manager, estimator, admin. Users perform actions that create history on the twin.

## Organization

An **Organization** is the contractor company (or multi-branch entity) that owns jobs, users, and operational settings. Losses and their twins belong to an Organization. Multi-tenancy, permissions, and branding hang from this object.

---

# Relationships

Relationships below are conceptual ownership and association rules. They define how the twin is composed — not foreign keys or IDs.

## Organizational context

```
Organization
    has many Users
    has many Losses
```

Users act on Losses within their Organization. A Loss always belongs to exactly one Organization.

## Job → Twin root

```
Loss
    contains Building
```

One active Building per Loss is the default mental model for restoration jobs. The Loss is the job wrapper; the Building is the twin root.

## Spatial hierarchy

```
Building
    contains Floors

Floor
    contains Rooms

Room
    contains Walls
```

This hierarchy mirrors the property. Navigation, documentation, and AI features should respect it.

## What a Room contains

```
Room
    contains Walls
    contains Photos
    contains Moisture Readings
    contains Equipment
    contains Notes
    contains Timeline Events
    contributes Scope Items
    contributes Drying Log entries
```

**Everything belongs to a Room** whenever it is field evidence or field work. Building-level summaries may roll up room data; they should not orphan facts without a room home.

## What a Wall contains / anchors

```
Wall
    anchors Photos (of that surface)
    anchors Moisture Readings (on that material)
    anchors Notes (specific to that assembly)
    anchors Timeline Events (work on that surface)
    may relate to Equipment effects (airflow / drying of that assembly)
```

Walls refine room-level truth. When precision is unavailable, evidence may remain at Room level — with the expectation that precision improves over the life of the twin.

## Derived and communicative objects

```
Loss / Building
    produces Scope Items (from room evidence)
    produces Estimates (from Scope Items + rate logic — outside core twin truth)
    produces Reports (snapshots of twin state)

Drying Log
    aggregates Moisture Readings, Equipment changes, and drying Notes over time
    belongs to the Building and is navigable by Room
```

## Traceability chain (conceptual)

```
Organization → Loss → Building → Floor → Room → Wall
                                              ↓
                         Photo / Moisture / Note / Equipment / Event
                                              ↓
                                    Scope Item → Estimate → Report
```

Nothing in that chain should jump levels without a clear reason. Estimates and reports sit at the end as outputs, never as parents of building truth.

---

# Digital Twin Workflow

The end-to-end workflow is linear in intent and iterative in practice. Teams may loop (more photos, more readings, revised scope), but the **direction of truth** always flows from the building outward.

```
Create Loss
    ↓
Building
    ↓
Rooms
    ↓
Photos
    ↓
Moisture
    ↓
Equipment
    ↓
Scope
    ↓
Estimate
    ↓
Report
```

## 1. Create Loss

Capture job identity: customer, property reference, insurance/claim context, intake notes. The Loss opens the operational container.

## 2. Building

Establish the Building as the twin root. Confirm address and property context. The Digital Twin begins here — not when the estimate is typed.

## 3. Rooms

Structure the Building into Floors and Rooms (and Walls as inspection deepens). The room map is the skeleton of the twin.

## 4. Photos

Document conditions with photos tied to Rooms (and Walls when known). Photos create visual evidence and timeline anchors.

## 5. Moisture

Record Moisture Readings with location and time. Establish wet standards, affected materials, and drying goals.

## 6. Equipment

Place and track Equipment in Rooms. Equipment state changes become part of the Drying Log and room timelines.

## 7. Scope

Derive Scope Items from evidence: what must be cleaned, dried, removed, or replaced — justified by photos, readings, and notes. Scope is assembled from the twin, not invented beside it.

## 8. Estimate

Generate pricing from Scope Items and company/rate logic. The estimate is a financial projection of twin-derived scope. If scope changes because the building changed, the estimate follows — never the reverse.

## 9. Report

Publish Reports for carriers, customers, and internal stakeholders. Reports are views of the twin at a point in time, including drying progress and documentation packages.

### Iteration

At any step, new evidence (additional photos, readings, discovered rooms) updates the Building. Downstream scope, estimate, and reports are refreshed from that updated truth.

---

# Future AI Features

AI in RestorationOS should accelerate capture, organization, and insight — while remaining subordinate to the Building as source of truth. Models suggest; evidence and humans decide. No AI feature may invent building facts without an evidence trail.

## Damage Detection

Analyze photos to highlight likely damaged areas, materials, and severity cues. Suggestions attach to Rooms/Walls as hypotheses until confirmed.

## Room Classification

Infer room type and characteristics from photos and layout context (kitchen, basement finish level, etc.) to speed structuring of the twin.

## Drying Progress

Interpret Moisture Readings, Equipment placement, and Drying Log trends to estimate progress toward dry standards and flag stalled rooms.

## Scope Suggestions

Propose Scope Items grounded in confirmed evidence patterns (e.g., category/class of water, material, readings). Every suggestion must cite the photos/readings that motivated it.

## Timeline Replay

Reconstruct a Room’s or Building’s story over time: first photo → peak wet → equipment changes → drying curve → completion. Useful for training, disputes, and customer communication.

## Wall Healing Visualization

Visualize a Wall’s journey from damaged/wet to restored using photos and readings over time — a “healing” narrative for adjusters and owners.

## Photo Organization

Auto-group, de-duplicate, and suggest Room/Wall assignment for photo batches so evidence lands in the right place in the twin with minimal manual sorting.

## Risk Detection

Surface risks early: elevated moisture after claimed dry, missing documentation for scoped work, equipment imbalances, mold-friendly conditions, incomplete room coverage. Risks are alerts tied to twin gaps, not free-floating scores.

---

# Design Principles

These principles are non-negotiable for RestorationOS product and engineering decisions.

## The Building is always the source of truth

All workflows, AI features, estimates, and reports defer to the Building twin. If paperwork and twin disagree, the twin is corrected from reality — paperwork is regenerated.

## Everything belongs to a room

Field evidence and field work are room-scoped. Building-level dashboards are aggregations, not dumping grounds for unscoped facts.

## Everything is traceable

Photos, readings, equipment moves, scope lines, and estimate lines must be traceable to their origin in the twin and to the User/Organization action that created them.

## Nothing should exist without evidence

Scope and estimate lines that cannot point to evidence (photo, reading, note, or explicit documented exception) are suspect. The product should make unsupported claims hard to sustain.

## Every action creates history

Creates, updates, placements, removals, and status changes append to history. Silent mutation of the twin is not allowed. The past remains queryable.

## Every room has its own timeline

Each Room accumulates a timeline of photos, readings, equipment, notes, and work events. Building timelines compose from room timelines. Replay and accountability start at the room.

---

## Closing

RestorationOS is not an estimating shell with photos attached. It is a Digital Twin platform for restoration: capture the Building, accumulate evidence in Rooms, derive Scope, then Estimate and Report.

Build every feature — present and future — so that five years from now the same sentence still holds:

**The Building is the source of truth. The estimate is generated from the building.**
