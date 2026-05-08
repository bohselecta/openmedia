# Cursor Composer Kickoff — OpenMediaForge

Build OpenMediaForge according to this spec pack.

Start by reading:
- AGENTS.md
- BUILD_DIRECTIVE.txt
- docs/00_EXECUTIVE_BRIEF.md
- docs/01_PRODUCT_SPEC.md
- docs/02_GUI_AND_DESIGN_SYSTEM.md
- docs/04_ARCHITECTURE.md
- docs/14_ACCEPTANCE_CRITERIA.md
- docs/15_CURSOR_IMPLEMENTATION_TASKS.md

Then implement the MVP in phases.

The first working milestone is:

Create project → open Image Studio → select Mock Provider → select mock-image-v1 → enter prompt → submit → progress updates → output asset appears → receipt appears → verify passes.

Do not build real provider calls yet.
Do not hardcode any single compute gateway.
Do not store raw keys in job/receipt types.
Do not claim complete until all verification checks pass.
