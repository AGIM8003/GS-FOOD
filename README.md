# GS FOOD

GS FOOD is a multi-component product root for the Food Guide program.

## Current State

- State: active-build
- Root role: multi-component product root
- Authoritative blueprint: `GS-FOOD3.md`

## What Is Authoritative Here

`GS-FOOD3.md` is the current master blueprint for the Food Guide App program and should be treated as the governing product document until the implementation structure is normalized further.

## Root Map

- `GS-FOOD3.md`: master blueprint and program handoff baseline
- `food_guide_app/`: application-related implementation area
- `server/`: backend or service-side work area
- `stitch_pantry_planner_ui/`: UI/front-end area
- `mobilenet.zip`: packaged binary/model artifact that should remain explicitly documented if retained

## Working Rule

- Use the blueprint as the product authority.
- Treat this root as a coordinated program root, not a single flat app.
- Keep binary artifacts documented and review whether they belong in a generated/artifacts location instead.

## Cleanup Need

This root needs a later structure pass to separate source, generated artifacts, and component-level ownership more clearly.
