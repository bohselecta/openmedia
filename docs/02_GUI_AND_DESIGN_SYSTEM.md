# 02 — GUI and Design System

## Design thesis

OpenMediaForge should look like a serious creative instrument: a cinematic media console, a reference board, and a creator dashboard fused into one elegant workstation.

It is for influencer creators and video artists, but it must not look like a toy. The visual direction should feel expensive, sharp, calm, and alive.

## Mood words

- cinematic
- precise
- dark glass
- graphite
- champagne metal
- soft electric accents
- editorial
- high-end creator tool
- workstation
- film lab
- command desk
- reference wall

## Avoid

- generic SaaS dashboard styling
- rainbow AI gradients as the main identity
- toy icons
- huge marketing fluff inside the app
- crypto dashboard aesthetics
- overstuffed glassmorphism
- fake terminal hacker styling
- cute mascot energy

## Visual system

### Base colors

```css
--bg: #070708;
--panel: #101113;
--panel-elevated: #16171a;
--panel-glass: rgba(20, 21, 24, 0.72);
--line: rgba(255,255,255,0.08);
--line-strong: rgba(255,255,255,0.16);
--text: #f4f1ea;
--text-muted: rgba(244,241,234,0.62);
--text-faint: rgba(244,241,234,0.38);
--accent-lime: #c8ff5f;
--accent-cyan: #7dd7ff;
--accent-amber: #f2b35d;
--accent-rose: #ff7a90;
--accent-violet: #a78bfa;
--success: #85f0a3;
--warning: #ffd166;
--danger: #ff5d73;
```

### Surface grammar

- Main background: black/graphite, subtle radial depth.
- Sidebar: slightly raised matte black with thin hairline borders.
- Cards: dark graphite, rounded 20–28px, soft inner highlight.
- Asset cards: thumbnail-first, label chip, role chip, rights chip.
- Job cards: progress ribbons, provider badge, model badge.
- Receipts: compact ledger cards with export affordance.
- Provider cards: trust/status visual language.
- KeyRail cards: redacted credential, limits, revoke/test buttons.

### Typography

Use a modern sans stack. If installing fonts is not desired, use:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Use typography like an editorial tool:

- Hero: 56–72px, tight tracking, strong line-height.
- Page title: 28–36px.
- Section title: 16–20px.
- Body: 14–16px.
- Metadata: 11–12px uppercase or semibold.

### Motion

Use motion sparingly:

- panel entrance: 120–180ms
- job progress: smooth width interpolation
- hover: 80–120ms
- drag/drop: clear, tactile overlays
- no endless decorative animation

## App shell

### Desktop layout

```txt
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: project switcher · provider status · queue · keys   │
├───────────────┬───────────────────────────┬─────────────────┤
│ Left Rail     │ Main Studio Canvas        │ Inspector        │
│ Dashboard     │ Prompt / assets / output  │ Provider/model   │
│ Studio        │ Queue strips              │ Asset map        │
│ Projects      │ Result grid               │ Receipt preview  │
│ Assets        │                           │                 │
│ Queue         │                           │                 │
│ Receipts      │                           │                 │
│ Providers     │                           │                 │
│ Keys          │                           │                 │
└───────────────┴───────────────────────────┴─────────────────┘
```

### Top bar

Must always show:

- current project
- active provider
- active key/credential status, redacted
- queue count
- local/cloud mode badge
- quick command search later

### Left rail

Use icon + label. Make it feel like a tool, not a website menu.

Suggested nav:

- Forge
- Studio
- Projects
- Assets
- Queue
- Receipts
- Providers
- Keys
- Settings

### Main canvas

The main canvas changes by studio mode but always has:

- mode header
- prompt/input area
- reference strip
- job/result area
- receipt or repair affordance

### Inspector

Right-side contextual panel:

- selected provider
- selected model
- estimated cost
- key authority
- reference budget
- selected asset details
- job logs
- receipt preview

## Landing page

Landing page should feel like a premium launch page but not overbuilt.

Hero copy:

> **The open command desk for AI media work.**
>
> Plan shots, label references, run providers, track jobs, and keep receipts — across your own models, keys, and creative tools.

Primary CTA:

> Open the Studio

Secondary CTA:

> View the Mock Demo

Sections:

1. The problem: AI media is scattered.
2. The studio: projects, assets, jobs, receipts.
3. Provider adapters: local, BYOK, cloud later.
4. Asset Map: references become usable production context.
5. KeyRail: bring your own keys without losing trust.
6. Receipts: know what made what.
7. Roadmap: local-first now, compute later.

## Studio page visual details

### Image Studio

- Left: prompt composer and reference drop zone.
- Center: output grid with large current result.
- Right: provider/model inspector.
- Bottom: active job strip and recent variants.

### Video Studio

MVP placeholder but styled seriously:

- shot prompt
- input/start frame
- duration/aspect ratio
- clip cards
- honest "provider adapter required" state

### Storyboard

- shot cards
- timeline strips
- reference chips
- copy/export runbook controls

### Assets

- masonry/grid toggle
- filters by role/kind/project/rights/provider
- large thumbnail cards
- copy stable label
- usage count

### Receipts

Ledger-like but beautiful:

- job id
- provider/model
- task
- prompt preview
- input/output chips
- cost
- network destination
- created date
- export JSON button

## Component style rules

### ProviderBadge

States:

- Mock — striped or dotted badge, clearly test/demo.
- Local — green/graphite badge.
- BYOK — key icon, amber/cyan badge.
- Hosted — cloud badge.
- Disabled — grey badge.

### KeyStatusBadge

States:

- No key required
- Connected
- Needs key
- Dev vault
- Revoked
- Invalid
- Limit reached

### AssetCard

Required fields:

- thumbnail or type icon
- label
- role
- priority
- rights status
- project
- copy label button
- selected state

### JobCard

Required fields:

- task
- provider
- model
- progress
- created time
- status
- cancel/retry/receipt actions

## Mobile/responsive

Mobile is not the primary v1 surface, but it must not break.

- Collapse left rail into bottom nav or menu.
- Hide inspector behind a details drawer.
- Keep Image Studio usable.
- Do not attempt full workflow graph on mobile in v1.

## Demo seed visual concept

Create demo project:

**Glass Room Broadcast**

Description:
A creator films a stylized micro-music-video concept inside a dark glass studio with reflective floors, a chrome microphone, amber key light, and hand-labeled reference boards.

Assets:
- @LeadIdentity
- @GlassRoomLocation
- @ChromeMicProp
- @AmberPalette
- @CameraPushMotion

Mock output cards should feel premium, not blank. Use CSS-generated placeholder panels if real images are unavailable.
