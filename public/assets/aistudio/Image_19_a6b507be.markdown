---
name: EcoTech Mobility Marketplace
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  metric-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  metric-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a high-trust, peer-to-peer infrastructure aesthetic balancing residential hospitality with technical precision. It addresses community hosts monetizing private charging points and EV drivers navigating urban and highway charging across India.

### Design Movement: Modern Technical Naturalism
A blend of clean corporate utility, tactile eco-tech elements, and modern mobility interfaces. The interface relies on generous whitespace, high legibility under harsh sunlight conditions (outdoor/in-car use), crisp data hierarchy, and structural cards that instill confidence in transactional safety, power ratings, and hardware compatibility.

### Tone & Emotional Impact
- **Trustworthy & Dependable:** High visual stability through structured layouts, transparent billing breakdowns, and host verification markers.
- **Eco-Forward & Modern:** Fresh foliage undertones combined with crisp digital signals, avoiding cliché leaf graphics in favor of clean emerald architecture.
- **Warm & Regionally Rooted:** Subtle warm amber cues signaling Indian hospitality, community availability, and festive vitality without compromising modern tech credibility.

## Colors

The system uses an open, daylight-readable palette built on cool off-white foundations, anchored by purposeful chromatic accents:

- **Primary (`#059669` - Emerald Green):** Represents sustainable power, verified charger statuses, completed transactions, and primary conversion actions.
- **Secondary (`#2563EB` - Electric Blue):** Reserved for dynamic utility: live map pins, geofencing indicators, active charging sessions, cable/plug status toggles, and telematics feedback.
- **Tertiary (`#D97706` - Warm Saffron/Amber):** Cultural warmth indicating slot scarcity, reservation urgency, pending host approvals, high-demand surge indicators, and star ratings.
- **Neutral Surface & Structure (`#F8FAFC` to `#0F172A`):** Pure slate-tinted scale. Backgrounds leverage `#F8FAFC` to minimize outdoor glare, with crisp `#E2E8F0` structural boundaries and deep `#0F172A` slate for legible text.

### Color Rules
- Never use Electric Blue for non-interactive state indicators to preserve its mental model as an interactive map/system signal.
- Monetary figures (₹) and energy metrics (kW, kWh) should be rendered in high-contrast neutral slate (`#0F172A`), reserving Emerald Green strictly for positive deltas, savings, or verified pricing confirmation.

## Typography

The typographic hierarchy couples **Plus Jakarta Sans** for welcoming, confident display and section headings with **Inter** for dense transactional reading, technical data tables, and telemetry metrics.

### Tabular Numbers & Technical Legibility
- All numeric displays involving currency (`₹`), energy flow (`kW`, `kWh`), charging duration (`hh:mm`), and percentage indicators must enforce CSS `font-variant-numeric: tabular-nums` to eliminate jitter during real-time telemetry updates.
- Use `metric-lg` and `metric-md` for pricing per unit, total power, and available charging bays.

## Layout & Spacing

The layout is built around an 8pt architectural rhythm to support simultaneous mobile discovery (in-hand/driver dashboard) and wide-canvas desktop host consoles.

### Grid & Canvas Structure
- **Mobile (< 768px):** 4-column fluid layout with `1rem` margins and `1rem` gutters. Map views remain edge-to-edge with bottom sheets snapping to peek (15%), half (50%), and full (90%) screen height.
- **Desktop (≥ 1024px):** 12-column layout max-width pinned at `1280px` with `2rem` outer margin and `1.5rem` gutters. Split screens (6 cols map, 6 cols charger listings) maintain balanced navigation.
- Component-level spacing uses `space-xs` (4px) for inline metadata pills, `space-sm` (8px) for list item padding, and `space-md` (16px) for standard internal card padding.

## Elevation & Depth

Visual hierarchy uses crisp, atmospheric depth appropriate for daylight environments.

### Architectural Tiers
- **Tier 0 (Base Canvas):** `#F8FAFC`.
- **Tier 1 (Resting Cards & Dividers):** `#FFFFFF` surfaces bounded by single-pixel low-contrast borders in `#E2E8F0`. No ambient blur when resting to maximize clarity.
- **Tier 2 (Floating Action Elements & Map Overlays):** `#FFFFFF` with an atmospheric drop: `0px 4px 16px -2px rgba(15, 23, 42, 0.08), 0px 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Tier 3 (Active Modals, Booking Drawers & Toast Notifications):** Elevation `0px 12px 32px -4px rgba(15, 23, 42, 0.14)`.

### Ghost Outlines & Micro-borders
All elevated surfaces use an internal subtle border inset (`1px solid rgba(226, 232, 240, 0.8)`) to maintain contrast on bright outdoor mobile screens.

## Shapes

The design system uses level 2 (Rounded) geometry:
- Standard cards, interactive tiles, and modal bodies utilize `0.5rem` (8px) to `1rem` (16px) radius for a modern, friendly consumer-app aesthetic.
- Pills and tags utilize full curved caps (`9999px`) to visually separate status markers and plug types from square structural data containers.
- Inputs, action buttons, and segmented selection chips use `0.5rem` (8px) corner radius.

## Components

### Buttons
- **Primary:** Filled Emerald Green (`#059669`) with white text, font weight 600. Hover state scales background to `#047857`. Focus ring: 2px offset with `#059669`.
- **Secondary / Action:** Electric Blue (`#2563EB`) filled or 1.5px outline with transparent background for map directions, live connect commands, and Bluetooth pairing actions.
- **Tertiary / Subdued:** Ghost button on `#F1F5F9`, slate text (`#334155`), for filters and cancel flows.

### Chips & Badges
- **Pill Badges:** Fully rounded caps (`9999px`), `space-xs` vertical padding, `space-sm` horizontal padding.
  - *Available / Ready:* Soft emerald background (`#ECFDF5`), emerald text (`#047857`).
  - *Occupied / In Session:* Soft blue background (`#EFF6FF`), blue text (`#1D4ED8`).
  - *Fast Charging / High Demand:* Soft amber background (`#FFFBEB`), amber text (`#B45309`).
- **Filter Chips:** 8px rounded rectangle, 1px border (`#E2E8F0`). Selected state shifts border and typography to `#059669` with 10% emerald background tint.

### Charger Listing & Telemetry Cards
- **Card Anatomy:** White surface (`#FFFFFF`), 12px corner radius, 1px perimeter border (`#E2E8F0`).
- **Data Display:** Structured split row:
  - Left: Connector graphic pill (Type 2, CCS2, 15A Socket) + Host name with verification tick.
  - Right: Big-num pricing: `₹18.50` / kWh in `metric-md` tabular text.
  - Bottom strip: Real-time availability indicator pill, distance in kilometers, and speed badge (`7.4 kW AC` or `25 kW DC`).

### Input Fields & Selectors
- Background: `#FFFFFF`. Border: 1px `#CBD5E1`. Roundedness: 8px.
- Focus: Border shifts to `#2563EB` with `0 0 0 3px rgba(37, 99, 235, 0.15)`.
- Numeric Input: Fixed right-aligned unit indicator (`kW`, `hrs`, `₹`) anchored in muted slate (`#64748B`).

### Checkboxes & Radio Controls
- Circular radio / 6px rounded checkbox. Unchecked: 1.5px border `#94A3B8`. Checked: solid `#059669` fill with white checkmark/dot icon.