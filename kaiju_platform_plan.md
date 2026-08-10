# 🌐 KAIJU CAD LIBRARY PLATFORM — COMPLETE BUILD PLAN
## The Official Kaiju Geometry Publishing & Discovery Platform

> **Built by Mantiz | Creator: ZaneOmotoye**
> **Hosted at the root of the Kaiju workspace** — `C:\Users\DELL\Videos\Kaiju\kaiju-platform\`
> **This platform is built LAST** — after Phases 1–9 of the LCEM app are complete.
> The AI builds the platform, then redesigns the full UI for a premium finish, and thoroughly tests the entire web app before deploying.

---

## Platform Identity

| Property | Value |
|---|---|
| **Platform Name** | Kaiju CAD Library |
| **Tagline** | *The World's Geometry* |
| **Logo** | `kaiju/Kaiju-logo.png` — the infinity-knot with Flower of Life pattern |
| **BlackWolf Logo** | `info - Copy/blackwolf.png` — ZaneOmotoye's personal brand (black wolf, amber eyes) |
| **Mantiz Logo** | `info - Copy/Mantiz-logo.png` — Mantiz company brand (blue crustacean) |
| **Loader** | Full black background, Kaiju logo animates in — morphs into a 3D-rotating wireframe version of the logo, then dissolves into the app |
| **Primary Color** | `#FFFFFF` white base, `#000000` black, `#1E6FFF` electric blue accent |
| **Aesthetic** | Clean white/black/hint-of-blue — professional, sharp, minimal, premium |
| **Font** | Outfit (headings), Inter (body) from Google Fonts |
| **Native File Format** | `.kaiju` — Kaiju's proprietary CAD format (JSON envelope wrapping voxel data + metadata) |

---

## Access Tier System

Three distinct user tiers with completely different UI experiences:

| Tier | Code | Who | UI Theme | Badge |
|---|---|---|---|---|
| 🌍 **Regular User** | — | Anyone who registers | White/black/blue — clean minimal | None |
| 🛡️ **Official (Admin)** | `@11191021` | Trusted admins granted by owner | Same base + **Official** badge on all uploads, expanded controls, different dashboard | `OFFICIAL` sleek pill badge on every model card |
| 👑 **Owner** | `@11191021z@ne` | ZaneOmotoye only | Full black command centre UI, owner-only panels, live telemetry | `OWNER` badge + all access |

---

## Secret Code Entry System — Signup Page

> **CRITICAL**: The code entry mechanism is completely invisible and covert. No user ever sees a text input, no "enter admin code" prompt, no hint it exists. Normal users complete signup without ever triggering it.

### The Click Pattern

On the **Register/Signup page**, the Kaiju logo is clickable with a secret morse-code pattern:

```
Pattern:  ██ █ ██ █
           2  1  2  1  clicks
```

- **2 clicks** → pause → **1 click** → pause → **2 clicks** → pause → **1 click**
- Must be completed within 8 seconds total
- Click speed: each click group within 600ms of each other

### Flow Diagram

```
User sees: Normal signup form + Kaiju logo (just decorative)
                         │
          User clicks logo in pattern: ██ █ ██ █
                         │
         ┌───────────────▼───────────────┐
         │  🟢 Small green dot appears    │
         │  top-right of logo            │
         │  (blinks once, stays solid)   │
         └───────────────┬───────────────┘
                         │
         An INVISIBLE input field is now active
         (opacity: 0, pointer-events: none visually,
          but keyboard focus is captured)
                         │
         User types their code BLINDLY
         (nothing appears on screen)
                         │
      ┌──────────────────┴──────────────────┐
      │                                      │
 Code CORRECT                          Code WRONG
      │                                      │
 Logo button brightens                 Green dot → RED
 pulses white glow                     Blinks 3× brighter
 blinks exactly 5 times                Fades back to dormant
 disappears from view          ←────── Can try again anytime
      │
 "OFFICIAL" text fades in
 center of screen (2 seconds, elegant)
      │
 User continues signup normally
 Account is flagged as Official/Owner
 in database
```

### Implementation Rules

```javascript
// register.js — Secret click pattern detector
const PATTERN = [2, 1, 2, 1];  // clicks per group
const TIMEOUT_MS = 8000;
const GROUP_GAP_MS = 600;

// Hidden input — CSS:
// .secret-code-input {
//   position: fixed; top: -9999px; left: -9999px;
//   opacity: 0; pointer-events: none;
//   width: 1px; height: 1px;
// }

// The logo element gets a click counter
// Pattern is validated client-side but code is validated server-side
// Server-side: hash of the code is compared — never store codes in plain JS

// Green light indicator:
// Small circle, 8px diameter, top-right of logo area
// Default: hidden (opacity: 0)
// On pattern match: opacity: 1, background: #22C55E, box-shadow: 0 0 6px #22C55E
// Stays visible until code submitted or cancelled

// Cancel conditions:
// - User presses Enter without entering code → submits signup normally
// - User continues filling form fields → pattern resets silently
// - 30 seconds of inactivity after pattern → resets, green dot fades

// On correct code:
// Logo element: filter: brightness(3), box-shadow: 0 0 40px white
// Then blink 5× (100ms on / 100ms off)
// Then opacity: 0 (logo visually vanishes from the secret button area)
// "OFFICIAL" text: fades in center screen at 28px, font-weight: 700
//    color: #1E6FFF, letter-spacing: 8px
//    duration: 2s then fades out

// On wrong code:
// Dot transitions: background: #EF4444, box-shadow: 0 0 12px #EF4444
// Blinks 3× fast (80ms each)
// Returns to green listening state (they can try again)
```

### Server-side Code Validation

```javascript
// server.js / auth.js
const ADMIN_CODE_HASH   = sha256('@11191021');       // Officials
const OWNER_CODE_HASH   = sha256('@11191021z@ne');   // Owner (ZaneOmotoye)

// POST /api/auth/register — additional field: secretCode (optional)
// If secretCode is present:
//   - Compare sha256(secretCode) to ADMIN_CODE_HASH → role = 'official'
//   - Compare sha256(secretCode) to OWNER_CODE_HASH → role = 'owner'
//   - No match → register as normal user, no error shown (silent rejection)
// Never reveal in any response whether a secret code existed
```

---

## Official Badge System

Every model card uploaded by an **Official** or **Owner** displays a sleek `OFFICIAL` badge:

```
┌───────────────────────────────┐
│  [Model Thumbnail]            │
│                    ┌────────┐ │
│                    │OFFICIAL│ │  ← Sleek pill, electric blue
│                    └────────┘ │     #1E6FFF, white text, 10px radius
│  Model Name                   │     subtle glow: 0 0 8px #1E6FFFAA
│  by ZaneOmotoye  ⬡            │
│  ❤ 142  ⬇ 891  👁 4.2k       │
└───────────────────────────────┘
```

- Badge: `OFFICIAL` in `Outfit` font, 11px, letter-spacing: 2px, uppercase
- Background: `#1E6FFF` with `0 0 8px rgba(30,111,255,0.5)` glow
- On Owner's models: badge says `OWNER` with gold `#F59E0B` glow instead
- Models in search results, profile grid, home grid — all show the badge consistently
- When AIDER-X returns model cards in chat — badge renders there too

---

## Three-Tier UI Specification

### UI Tier 1 — Regular User (White/Black/Blue)
```css
/* Regular user design system */
--bg-primary:    #FFFFFF;
--bg-surface:    #F8F9FB;
--bg-card:       #FFFFFF;
--accent-blue:   #1E6FFF;
--accent-dark:   #0A0A0A;
--text-primary:  #0A0A0A;
--text-secondary:#64748B;
--border:        #E2E8F0;
--shadow:        0 2px 12px rgba(0,0,0,0.08);
--glow-blue:     0 0 20px rgba(30,111,255,0.2);
```
- Clean white cards with thin blue borders on hover
- Black navbar with white logo
- Blue CTA buttons
- Minimal sidebar navigation
- Standard model grid, profile, search

### UI Tier 2 — Official Dashboard (White/Black/Blue + Enhanced)
Everything the regular user sees, PLUS:

- **Official ribbon** at top of their profile page: blue band with "✦ Official Creator"
- **Enhanced upload form**: extra fields — `Official Notes`, `Featured Request` toggle, `Pin to Homepage` request
- **Bulk upload** — drag multiple files at once (up to 20)
- **Model analytics per model** — views/downloads/likes chart on their model detail page (only they see it)
- **Official-only sidebar**: Community Reports inbox, Featured Requests status
- **Priority support chat** with AIDER-X that has faster model context loading
- All their model cards across the platform have the `OFFICIAL` blue badge

### UI Tier 3 — Owner Dashboard (Full Black Command Centre)
```css
/* Owner-only design system — completely different */
--bg-primary:    #000000;
--bg-surface:    #0A0A0A;
--bg-card:       #111111;
--accent-owner:  #F59E0B;   /* gold */
--accent-blue:   #1E6FFF;
--text-primary:  #FFFFFF;
--border:        rgba(245,158,11,0.2);   /* gold border */
--glow-gold:     0 0 30px rgba(245,158,11,0.3);
```

- Full black background, gold accents
- Owner badge: `OWNER` in gold
- Left sidebar with all admin + owner-only sections
- Live telemetry panel (see below)
- Can do everything an Official can, PLUS owner-exclusives

---

## Owner-Exclusive: Live Telemetry Dashboard

> Only accessible with code `@11191021z@ne` — completely hidden from all other tiers.

The live dashboard shows real-time platform data:

```
┌─────────────────────────────────────────────────────────────────┐
│  👑 KAIJU OWNER COMMAND CENTRE              🟢 Live            │
│─────────────────────────────────────────────────────────────────│
│  LIVE NOW                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  👥 247  │ │  📥 18   │ │  🔍 89   │ │  💬 34   │           │
│  │ Active   │ │Downloads │ │ Searches │ │ AI Chats │           │
│  │  Users   │ │ /min     │ │ /min     │ │ /min     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  USER ACTIVITY FEED                              [Filter ▾]      │
│  ● ZaneTest joined                          2s ago               │
│  ● user_4412 downloaded "Gyroid Panel.kaiju" 5s ago             │
│  ● new_engineer liked "Rover Wheel v3"      12s ago              │
│  ● aero_cad uploaded new model (Private)    23s ago              │
│                                                                   │
│  PLATFORM STATS (Live → 24h → 7d → 30d)                        │
│  Total Users: 1,847  |  Total Models: 4,291  |  Storage: 12.4GB│
│  New Users Today: 23  |  Downloads Today: 891                   │
│                                                                   │
│  OFFICIALS ONLINE                                                 │
│  ● ZaneOmotoye (You) — Owner                Online              │
│  ● [official usernames here]                                      │
│                                                                   │
│  SYSTEM HEALTH                                                    │
│  Server: ✅ OK  |  DB: ✅ OK  |  Storage: 78% used  |  API: ✅  │
└─────────────────────────────────────────────────────────────────┘
```

**Live telemetry implementation:**
- WebSocket endpoint `/ws/owner-telemetry` (requires owner JWT claim)
- Server broadcasts events every 2 seconds: active session count, recent actions
- User activity feed: server-sent events of join/upload/download/like actions
- Geographic map (future): dot map of where users are connecting from
- All data is in-memory + SQLite — no external analytics service needed

---

## Pages — Complete Specification

### Page 1: Loader / Splash
- Full `#000000` background fills 100vw × 100vh
- Kaiju infinity-knot logo fades in at center (large, ~300px)
- Logo slowly rotates and pulses with a blue glow (`#1E6FFF`)
- Logo geometry morphs/dissolves — its flower-of-life pattern ripples outward as particles
- Progress bar (thin blue line at the bottom) fills as assets load
- Transitions into Home page with a smooth upward wipe

### Page 2: Home (Model Discovery Grid)
- Sticky top navbar: Logo (small) | Search bar | Category filters | Login/Register or Avatar
- **Hero section**: "The World's Geometry" headline + animated rotating 3D model showcase (3 featured models auto-rotate in viewport strip)
- **Staff Picks / Featured** (top of grid): Models hand-picked by Officials, displayed in a wider hero card row with `OFFICIAL` badge and "Staff Pick ✦" ribbon
- **Filter bar**: All | Mechanical | Aerospace | Bio-Medical | Architecture | Electronics | Abstract | `.kaiju` Exclusive | ✦ Official Only
- **Model Grid**: Masonry-style card grid, infinite scroll
  - Each **Model Card** shows:
    - Cover image (auto-thumbnail or user-uploaded)
    - `OFFICIAL` or `OWNER` badge if applicable (top-right of card)
    - Model name + creator avatar + username
    - Format badge: `.kaiju` / `STL` / `OBJ` / `IGES`
    - Visibility badge: 🌐 Public / 🔒 Private
    - Like count, view count, download count
    - Hover: card lifts + shows mini 3D viewport that auto-rotates the model
- **Trending sidebar**: Top 10 most downloaded this week
- **Platform Announcements banner**: Dismissible blue strip at top for owner-broadcast messages
- **AIDER-X floating button**: bottom-right corner, opens chat drawer

### Page 3: Model Detail Page
- **Full-width 3D Viewport** (top half of page)
  - Toolbar: `Rotate` | `Pan` | `Zoom` | `Ghost/X-Ray` | `Wireframe` | `Solid` | `Section Cut` | `Measure`
  - Ghost/X-Ray: renders model as translucent with interior skeleton visible
  - Wireframe: shows edge topology as glowing blue lines on white
  - Expand button → opens **Fullscreen Viewer** (100vw × 100vh, no restrictions, free rotation)
  - Auto-rotate toggle
  - Reset camera button
- **Model Info Panel** (below viewport, split layout):
  - Left: Model name, `OFFICIAL` badge if applicable, description, tags, creator, upload date, version history
  - Right: **Build Plan Card** — structured card with:
    - Geometry parameters (dimensions, material, complexity)
    - Simulation results (if Kaiju-generated: FEA stress, mass, volume)
    - Manufacturing notes (print settings, material cost)
    - Generated by: Kaiju LCEM / Manual Upload
  - Image gallery (multiple views / screenshots user uploaded)
  - **Model Analytics** (visible to model owner + Officials): views/downloads/likes over time chart
- **Action buttons**: Download (format selector) | Share | Like | Bookmark | Compare | Report
- **Compare Mode**: Select 2 models → side-by-side viewport split, diff highlighted
- **AIDER-X panel** (right sidebar or drawer)
- **Discussion Threads** (not flat comments — threaded replies with upvotes)
- **Related Models**: 6-card grid of similar models
- **Official Notes** (if uploader is Official): blue highlighted note block with their expert commentary

### Page 4: Upload Page (Multi-Step Form)
**Step 1 — File Upload**
- Drag & drop zone or file picker
- Accepted formats: `.kaiju`, `.stl`, `.obj`, `.iges`, `.step`, `.3mf`, `.fbx`
- **Default format**: if AI-uploaded (Caspian), always saves as `.kaiju`
- If user uploads a non-`.kaiju` file, option to "Convert to .kaiju" appears
- File size limit: 500MB (Official: 2GB)
- Immediate preview rendered in mini viewport as soon as file is parsed
- **Bulk upload** (Official/Owner only): drag up to 20 files at once

**Step 2 — Model Details**
- Name (required)
- Description (markdown-supported rich text)
- Category (dropdown)
- Tags (multi-select + custom)
- Thumbnail upload (or auto-generate from viewport screenshot)
- Additional image gallery (up to 10 images)
- Version (semantic: 1.0.0)
- **Official Notes** (Official/Owner only): expert commentary field shown on detail page

**Step 3 — Build Plan**
- Toggle: "Auto-generate from Kaiju data" or manual entry
- Fields: Material, Dimensions (L×W×H mm), Weight (g), Print/Manufacture settings, Notes
- If Kaiju-generated: simulation results auto-populate

**Step 4 — Privacy & Publishing**
- Visibility: 🌐 Public | 🔒 Private
- License: MIT / CC-BY / Commercial / All Rights Reserved
- **Feature Request** (Official only): toggle to request model be pinned to homepage
- Platforms to share on publish: Kaiju | WhatsApp | Twitter/X | LinkedIn | Copy Link
- Preview card (shows what the model card will look like, including OFFICIAL badge if applicable)
- **Publish** button

### Page 5: User Profile Page
- **Profile Header**: Avatar | Username | Display Name | Location | Joined date
- `OFFICIAL` or `OWNER` badge prominently displayed under username (if applicable)
- **Bio Section**: Rich text bio — profession, specialization, company
- **Job/Role Chips**: e.g. "Mechanical Engineer", "CAD Designer", "Aerospace R&D"
- **Stats Bar**: Models uploaded | Total downloads | Total likes | Followers | Following
- **Achievement Badges**: earned badges displayed as chips (e.g. "First Upload", "100 Downloads", "Kaiju Official ✦")
- **Model Grid**: All public models by this user
- Follow/Unfollow button
- Edit Profile button (own profile)
- Social links: LinkedIn, GitHub, Website
- **Export History** (own profile only): list of all models you've downloaded

### Page 6: Search & Filter Results
- Full-text search across model names, descriptions, tags
- Advanced filters:
  - Format: Any | `.kaiju` | STL | OBJ | IGES
  - Creator tier: All | ✦ Official Only | 👑 Owner Only
  - Category: multi-select
  - Generated by: Kaiju LCEM / Manual
  - Sort: Newest | Most Downloaded | Most Liked | Trending | Official First
  - Date range picker
- Results as grid or list (toggle)
- "No results" state with AIDER-X suggestion

### Page 7: Login Page
- White background with floating Kaiju logo watermark (light blue tint)
- Email + Password form
- "Remember me" toggle
- Forgot password link
- Redirect to Register
- Clean blue CTA button

### Page 8: Register Page
- Username (unique, auto-validated)
- Email + Password + Confirm Password
- Display Name
- Role/Profession (dropdown: Student, Engineer, Designer, Researcher, Other)
- Accept Terms checkbox
- CAPTCHA (simple math or image)
- Kaiju logo displayed — **secretly click-pattern-enabled** (see Secret Code Entry System above)
- Auto-login after successful registration

### Page 9: Settings Page
- **Account**: Change username, email, password, delete account
- **Profile**: Edit bio, location, job title, social links, avatar upload
- **Privacy**: Default upload visibility, allow AI to index my models
- **Notifications**: granular notification toggles
- **API Access**: Generate personal API key for Caspian/Kaiju integration
- **Export History**: Download a log of all models you've downloaded
- **Referral System**: Share your referral link, track how many users you referred
- **Danger Zone**: Delete all models, delete account

### Page 10: Official Dashboard (Admin Panel — Officials + Owner)

> Accessed by Officials and Owner. UI is enhanced but not the full owner command centre.

- **My Official Stats**: Total models posted, total views across all official uploads, download rank
- **Model Management**: Feature/unfeature any public model, delete reported content
- **Community Reports**: Inbox of user-reported models with action buttons (dismiss, warn, delete)
- **Featured Requests**: Queue of requests from Officials to pin models
- **Announcement Compose**: Write platform-wide announcement (Owner only can publish)
- **User Directory**: View all registered users, their tier, join date
- **Bulk Operations**: Select multiple models → feature all, unfeature all, delete all
- **Newsletter**: Compose + preview newsletters (Owner only can send)
- **Platform Analytics** charts:
  - Users over time (line)
  - Uploads per day (bar)
  - Downloads per format (pie)
  - Most active categories
  - Geographic distribution (placeholder)
- **Deployment Panel** (Owner only): Trigger here.now redeploy, view deploy log

### Page 11: Owner Live Command Centre

> Completely separate from the Official Dashboard. Black UI. Only `@11191021z@ne` code unlocks this.

Everything from the Official Dashboard PLUS:
- **Live Telemetry** (real-time WebSocket feed — described above in detail)
- **Real-Time User Map**: Live dot map showing active user sessions by location
- **All Models** (including private): Full table of every model on the platform with owner/privacy/download data
- **Official Management**: Promote regular users to Official, revoke Official status, view list of all Officials
- **System Config**: Toggle maintenance mode, update platform-wide settings, manage feature flags
- **Raw Logs**: View server access logs, error logs, upload/download event logs
- **Database Inspector**: View SQLite table counts, run simple queries, export backups
- **Revenue Placeholder**: Section for future subscription/premium model setup

### Page 12: Feedback Page
- Two feedback forms side by side:
  - **"Kaiju LCEM App"** — rate + describe your experience with the CAD tool
  - **"Kaiju Platform"** — rate + describe your experience with this website
- Star ratings (1–5) + category tags + free-text comment
- Submit anonymously or with account
- Public feedback wall: most recent + most liked feedback shown

### Page 13: Model Request Board
- Users can post **geometry requests**: "I need a parametric spiral gear, M3, 20 teeth"
- Other users and Officials can respond with uploaded models
- Request can be marked as "Fulfilled" when a matching model is uploaded
- Officials can claim a request: "I'll build this in Kaiju LCEM"
- Upvote system: most-requested geometries float to top

### Page 14: Activity Feed / Social Timeline
- Follows Twitter/Instagram-style feed: shows actions of people you follow
  - "ZaneOmotoye uploaded **Helix Heat Exchanger v3**"
  - "official_user featured **Gyroid Panel**"
  - "cad_designer forked **Rover Wheel v2**"
- Filter: Friends | Officials Only | All Activity
- Notification bell with unread count

### Page 15: API Documentation
- Full REST API reference auto-generated from route definitions
- Interactive "Try it" buttons (basic GET endpoints)
- Authentication guide (JWT flow)
- Code samples: cURL, JavaScript fetch, Python requests

### Page 16: Changelog / Platform Updates
- Admin-curated list of platform version updates
- Markdown rendered release notes
- Subscribe to changelog via newsletter toggle

---

## AIDER-X — AI Assistant Specification

| Feature | Detail |
|---|---|
| **Name** | AIDER-X |
| **Visual** | Floating chat drawer, white glass panel, blue glow border, avatar = stylized X logo |
| **Capabilities** | Answer questions about any model on the page |
| **Model Context** | Auto-injects current model name, format, build plan, geometry params into system prompt |
| **Find Models** | "Find me a gyroid lattice under 1MB" → searches the database, returns cards in chat |
| **Download Help** | "Download this as OBJ" → triggers format conversion + download |
| **Upload Help** | Guides users through upload form step by step |
| **Similar Models** | "Show me similar designs" → semantic search by geometry tags |
| **Model Compare** | "Compare this to the previous version" → opens split viewport |
| **Request Help** | "Post a request for a spiral gear" → fills the Model Request Board form |
| **Backend** | WebSocket to Caspian AI agent (same as Kaiju LCEM) |
| **Caspian Auto-Upload** | When Caspian finishes generating a model, it can authenticate, fill form, generate build plan card, set visibility, and publish — all autonomously |

---

## .kaiju File Format Specification

```json
{
  "format": "kaiju/v1",
  "meta": {
    "name": "Helix Heat Exchanger v2",
    "creator": "ZaneOmotoye",
    "creator_tier": "owner",
    "created_at": "2026-05-26T18:00:00Z",
    "version": "2.1.0",
    "category": "Thermal Engineering",
    "tags": ["heat exchanger", "helix", "printable"],
    "license": "CC-BY"
  },
  "geometry": {
    "source": "kaiju-lcem",
    "generator": "HelixHeatX v1.0",
    "voxel_resolution_mm": 0.5,
    "bounding_box": { "x": 107, "y": 174, "z": 104 },
    "volume_cm3": 284.5,
    "surface_area_cm2": 892.3
  },
  "simulation": {
    "fea_max_stress_mpa": 145.2,
    "fea_max_displacement_mm": 0.38,
    "fea_material": "AlSi10Mg",
    "cfd_pressure_drop_pa": 12450
  },
  "build_plan": {
    "material": "AlSi10Mg Aluminium Alloy",
    "process": "DMLS / SLM",
    "print_mass_g": 756,
    "estimated_cost_usd": 142.50,
    "official_notes": "Requires support removal on IO flanges. Thread engagement verified.",
    "notes": "Standard notes visible to all users."
  },
  "mesh": {
    "encoding": "base64_gzip",
    "format": "stl_binary",
    "data": "<base64-encoded-gzipped-STL>"
  }
}
```

---

## REST API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (optional secret code in body) |
| POST | `/api/auth/login` | Get JWT token |
| POST | `/api/auth/logout` | Invalidate token |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Set new password |

### Models
| Method | Route | Description |
|---|---|---|
| GET | `/api/models` | List public models (paginated, filterable) |
| GET | `/api/models/:id` | Get single model (respects privacy) |
| POST | `/api/models` | Upload new model (auth required) |
| PUT | `/api/models/:id` | Update model metadata (owner only) |
| DELETE | `/api/models/:id` | Delete model (owner or official/admin) |
| GET | `/api/models/:id/download` | Download file in specified format |
| POST | `/api/models/:id/like` | Toggle like |
| POST | `/api/models/:id/bookmark` | Toggle bookmark |
| GET | `/api/models/:id/analytics` | Per-model analytics (owner or official) |
| GET | `/api/models/search` | Full-text + filter search |
| GET | `/api/models/trending` | Top models this week |
| GET | `/api/models/staff-picks` | Official-curated featured models |
| POST | `/api/models/:id/convert` | Convert format server-side |
| POST | `/api/models/:id/compare` | Get diff data for two model versions |
| POST | `/api/models/:id/fork` | Fork model to own account |
| POST | `/api/models/:id/feature` | Feature/unfeature model (official/owner) |
| POST | `/api/models/:id/report` | Report model |

### Users / Profiles
| Method | Route | Description |
|---|---|---|
| GET | `/api/users/:username` | Public profile |
| PUT | `/api/users/me` | Update own profile |
| GET | `/api/users/me/models` | Own models (including private) |
| GET | `/api/users/me/bookmarks` | Saved models |
| GET | `/api/users/me/export-history` | Download history |
| POST | `/api/users/:username/follow` | Follow/unfollow |
| GET | `/api/users/feed` | Activity feed from followed users |

### Officials & Owner
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/models` | ALL models including private (official+owner) |
| GET | `/api/admin/users` | All users with tier info |
| POST | `/api/admin/users/:id/promote` | Promote user to official (owner only) |
| DELETE | `/api/admin/users/:id/promote` | Revoke official status (owner only) |
| DELETE | `/api/admin/users/:id` | Ban/delete user (owner only) |
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/reports` | Reported models queue |
| POST | `/api/admin/announce` | Publish platform announcement (owner only) |
| POST | `/api/admin/deploy` | Trigger here.now redeploy (owner only) |
| GET | `/api/admin/logs` | Access server logs (owner only) |

### Telemetry (Owner Only)
| Method | Route | Description |
|---|---|---|
| WS | `/ws/owner-telemetry` | Real-time live user activity feed (owner JWT required) |
| GET | `/api/owner/live-stats` | Snapshot of live stats |

### Feedback & Community
| Method | Route | Description |
|---|---|---|
| POST | `/api/feedback` | Submit feedback (LCEM or platform) |
| GET | `/api/feedback` | Public feedback wall |
| POST | `/api/requests` | Post a geometry request |
| GET | `/api/requests` | List open geometry requests |
| POST | `/api/requests/:id/fulfill` | Mark request as fulfilled with model ID |
| POST | `/api/requests/:id/claim` | Official claims a request |

### Newsletter
| Method | Route | Description |
|---|---|---|
| POST | `/api/newsletter/subscribe` | Subscribe email |
| DELETE | `/api/newsletter/unsubscribe` | Unsubscribe |
| POST | `/api/admin/newsletter/send` | Send newsletter (owner only) |

### AIDER-X
| Method | Route | Description |
|---|---|---|
| WS | `/ws/aider-x` | WebSocket to Caspian AI agent |
| POST | `/api/aider-x/search` | AI model search |
| POST | `/api/aider-x/suggest` | AI similar model suggestions |
| POST | `/api/aider-x/compare` | AI model comparison analysis |

---

## Sharing System

| Platform | Behavior |
|---|---|
| **Kaiju LCEM** | Copies model ID to clipboard + displays "Open in Kaiju LCEM" deep-link |
| **WhatsApp** | Opens `https://wa.me/?text=Check out this CAD model: <url>` |
| **Twitter/X** | Opens `https://twitter.com/intent/tweet?text=...&url=...` |
| **LinkedIn** | Opens LinkedIn share dialog with model image + description |
| **Copy Link** | Copies direct URL to clipboard with success toast |
| **Embed** | Generates `<iframe>` embed code for the 3D viewport |
| **QR Code** | Generates QR code of the model URL for offline sharing |

---

## Privacy System

| Visibility | Who Can See |
|---|---|
| 🌐 **Public** | Everyone, including unauthenticated visitors |
| 🔒 **Private** | Only the model owner (when logged in) |
| 🛡️ **Official Override** | `@11191021` Officials can view all private models |
| 👑 **Owner Override** | `@11191021z@ne` Owner has unrestricted access to everything |

---

## Design System

```css
/* ═══════════════════════════════════════════════════ */
/* TIER 1 — Regular User (White / Black / Blue)        */
/* ═══════════════════════════════════════════════════ */
:root {
  --bg-primary:    #FFFFFF;
  --bg-surface:    #F8F9FB;
  --bg-card:       #FFFFFF;
  --accent-blue:   #1E6FFF;
  --accent-dark:   #0A0A0A;
  --text-primary:  #0A0A0A;
  --text-secondary:#64748B;
  --border:        #E2E8F0;
  --shadow:        0 2px 12px rgba(0,0,0,0.08);
  --glow-blue:     0 0 20px rgba(30,111,255,0.2);
}

.model-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
}
.model-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--glow-blue);
  border-color: var(--accent-blue);
}

/* Official Badge */
.badge-official {
  background: #1E6FFF;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 3px 8px;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(30,111,255,0.5);
  text-transform: uppercase;
}

/* Owner Badge */
.badge-owner {
  background: #F59E0B;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 3px 8px;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(245,158,11,0.5);
  text-transform: uppercase;
}

/* ═══════════════════════════════════════════════════ */
/* TIER 3 — Owner (Full Black / Gold)                  */
/* ═══════════════════════════════════════════════════ */
[data-theme="owner"] {
  --bg-primary:    #000000;
  --bg-surface:    #0A0A0A;
  --bg-card:       #111111;
  --accent-owner:  #F59E0B;
  --accent-blue:   #1E6FFF;
  --text-primary:  #FFFFFF;
  --border:        rgba(245,158,11,0.2);
  --glow-gold:     0 0 30px rgba(245,158,11,0.3);
}
```

---

## Secret Code Entry — Green Light CSS

```css
.logo-secret-trigger {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.secret-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  box-shadow: 0 0 6px #22C55E;
  opacity: 0;
  transition: opacity 0.3s;
}

.secret-indicator.active {
  opacity: 1;
  animation: pulse-green 1.5s infinite;
}

.secret-indicator.error {
  background: #EF4444;
  box-shadow: 0 0 12px #EF4444;
  animation: blink-red 0.16s 3;
}

.secret-code-input {
  position: fixed;
  top: -9999px;
  left: -9999px;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
}

.official-reveal-text {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 8px;
  color: #1E6FFF;
  opacity: 0;
  pointer-events: none;
  z-index: 9999;
  text-transform: uppercase;
  animation: official-appear 2s ease forwards;
}

@keyframes official-appear {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 6px #22C55E; }
  50%       { box-shadow: 0 0 14px #22C55E; }
}

@keyframes blink-red {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

---

## Directory Structure

```
C:\Users\DELL\Videos\Kaiju\kaiju-platform\
├── index.html                        ← Entry point (loader + router)
├── index.css                         ← Global design system (all 3 tiers)
├── server.js                         ← Express REST API + WebSocket server
├── database.js                       ← SQLite init + queries
├── auth.js                           ← JWT middleware + tier validation
├── package.json
├── .env                              ← API keys, JWT secret, code hashes
│
├── pages/
│   ├── home.js                       ← Landing / model grid
│   ├── model-detail.js               ← Model page + viewport
│   ├── upload.js                     ← Upload page
│   ├── profile.js                    ← User profile page
│   ├── search.js                     ← Search + filter
│   ├── login.js                      ← Login page
│   ├── register.js                   ← Register page (secret click system)
│   ├── settings.js                   ← Account settings
│   ├── official-dashboard.js         ← Official + Owner admin panel
│   ├── owner-command-centre.js       ← Owner-only telemetry dashboard
│   ├── feedback.js                   ← Feedback / reviews
│   ├── requests.js                   ← Model Request Board
│   ├── feed.js                       ← Social activity feed
│   ├── api-docs.js                   ← API documentation
│   └── changelog.js                  ← Platform updates log
│
├── components/
│   ├── loader.js                     ← Animated logo loader
│   ├── navbar.js                     ← Top nav (tier-aware)
│   ├── model-card.js                 ← Card with OFFICIAL/OWNER badge
│   ├── viewport.js                   ← Three.js 3D viewer
│   ├── aider-x.js                    ← AIDER-X chat panel
│   ├── share-modal.js                ← Share modal
│   ├── upload-form.js                ← Multi-step upload
│   ├── build-plan-card.js            ← Build plan display
│   ├── secret-entry.js               ← Click pattern detector + hidden input
│   ├── live-telemetry.js             ← Owner real-time dashboard
│   ├── announcement-banner.js        ← Platform announcement strip
│   ├── compare-viewport.js           ← Side-by-side model comparison
│   ├── discussion-thread.js          ← Threaded comments
│   ├── request-card.js               ← Model request card
│   ├── newsletter.js                 ← Newsletter signup
│   ├── feedback-widget.js            ← Feedback form
│   └── footer.js                     ← Mantiz/BlackWolf footer
│
├── services/
│   ├── api-client.js
│   ├── auth-service.js               ← Login/register/tier management
│   ├── model-service.js
│   ├── aider-x-service.js
│   ├── share-service.js
│   ├── telemetry-service.js          ← Owner WebSocket telemetry
│   └── herenow-service.js
│
├── utils/
│   ├── kaiju-format.js
│   ├── format-converter.js
│   ├── router.js
│   ├── toast.js
│   └── secret-pattern.js             ← Click pattern matcher logic
│
├── uploads/
├── thumbnails/
└── assets/
    ├── kaiju-logo.png                ← from kaiju/Kaiju-logo.png
    ├── blackwolf.png                 ← from info - Copy/blackwolf.png
    └── mantiz-logo.png               ← from info - Copy/Mantiz-logo.png
```

---

## Caspian AI Auto-Upload Integration

```python
# In kaiju/ai_bridge/ai_orchestrator.py
async def handle_publish_to_platform(data: dict) -> dict:
    """
    1. Wraps geometry in .kaiju format with full metadata
    2. Authenticates with KAIJU_PLATFORM_API_KEY
    3. Uploads with default visibility (public unless specified)
    4. Auto-populates build plan from simulation results
    5. Returns platform URL
    """
```

Commands:
- `"Upload my heat exchanger as public"` → auto-publishes as `.kaiju`
- `"Upload this privately"` → private flag set
- `"Give it the repo link"` → AI fetches from repo, converts, publishes

---

## here.now Deployment

```bash
# ~/.herenow/credentials
# e940627e2906129761c2446b977e56970681dc5b704a48d4fceec6e4e3dde0b0

# Live URL: https://kaiju-cad-library.here.now/
```

Incremental deploys: file hashes compared, only changed files re-uploaded.

---

## Testing Requirements

| Test | What to Check |
|---|---|
| **Auth flow** | Register, login, logout, token refresh, wrong password, duplicate username |
| **Secret entry — correct Official code** | Pattern → green dot → type code → 5 blinks → OFFICIAL text appears |
| **Secret entry — correct Owner code** | Same but OWNER text, gold blink |
| **Secret entry — wrong code** | Red dot blinks, can retry, no error message shown |
| **Secret entry — cancel** | Press Enter without code → normal signup completes |
| **OFFICIAL badge** | Badge appears on all models from Official/Owner users |
| **Upload flow** | All 7 formats, .kaiju conversion, build plan auto-generation |
| **Bulk upload** | Official can upload 20 files at once |
| **3D Viewer** | Solid, wireframe, ghost, fullscreen, controls |
| **Model comparison** | Two models load side-by-side, diff renders |
| **AIDER-X** | Chat, model context, search, download, compare |
| **Privacy** | Private models invisible to others, official/owner override works |
| **Sharing** | All platforms open correctly, embed valid, QR generates |
| **Caspian publish** | AI publishes end-to-end with correct metadata + badge |
| **Owner telemetry** | Live stats update in real time, activity feed streams |
| **Official dashboard** | Feature/unfeature, reports queue, announcements |
| **Owner command centre** | All models visible, promote/revoke officials, system config |
| **UI tier switching** | Regular user sees white/blue, Owner sees black/gold |
| **Request board** | Post, claim, fulfill flow works |
| **Activity feed** | Shows followed user actions in real time |
| **Search filters** | Official-only filter returns only Official/Owner models |
| **Profile + badges** | Achievement badges display, export history loads |
| **Responsive** | All pages correct at 375px / 768px / 1440px |
| **Performance** | Lighthouse > 85 |
| **here.now deploy** | Platform deploys, live URL accessible |

---

## Build Order for the AI

| Sub-Phase | Task |
|---|---|
| **10.1** | Project scaffold: `kaiju-platform/`, `package.json`, `server.js`, `.env`, SQLite init |
| **10.2** | Design system: `index.css` — all 3 tier themes, tokens, typography, card styles |
| **10.3** | Core components: loader, navbar, footer, toast, router |
| **10.4** | Auth system: register/login/JWT + **tier system** (regular/official/owner roles in DB) |
| **10.5** | Secret entry system: `secret-pattern.js`, `secret-entry.js` — click detector, hidden input, green/red light, blink animations |
| **10.6** | Model upload: multi-step form, `.kaiju` parser, format conversion, thumbnail generation + OFFICIAL badge logic |
| **10.7** | 3D Viewport: Three.js, solid/wireframe/ghost/fullscreen + compare mode |
| **10.8** | Home page: model grid, cards with badges, staff picks row, announcement banner |
| **10.9** | Model detail page: viewport + build plan card + official notes + discussion threads + analytics chart |
| **10.10** | AIDER-X: WebSocket to Caspian, chat UI, search, download, compare assist |
| **10.11** | User profiles, follow, activity feed, export history |
| **10.12** | Search & filter (tier filter, official-first sort) |
| **10.13** | Sharing system: all platforms + embed + QR |
| **10.14** | Privacy system + tier-gated access control |
| **10.15** | Official Dashboard: model management, reports queue, featured requests, analytics, announcements |
| **10.16** | Owner Command Centre: black/gold UI, live telemetry WebSocket, all-models table, official management, system config |
| **10.17** | Model Request Board + bulk upload (Officials) |
| **10.18** | Caspian auto-upload in `ai_orchestrator.py` |
| **10.19** | Feedback page + newsletter system |
| **10.20** | here.now deployment pipeline |
| **10.21** | **Full UI redesign** — premium finish across all 3 tiers, animations, mobile responsive |
| **10.22** | **Complete test suite** — every test case above |
| **10.23** | **Deploy** — push to here.now, verify live URL |

---

## Additional Features (All Included)

- **Version History & Diff Viewer** — Each model tracks versions, users can compare them visually
- **Collections / Playlists** — Group models into named collections
- **Model Forking** — Fork a model to your account, edit and republish
- **Embed Widget** — 3D viewport `<iframe>` embeddable anywhere
- **QR Code** — Per-model QR for offline sharing
- **Model Comparison** — Side-by-side split viewport for 2 models
- **Discussion Threads** — Threaded replies with upvotes (not flat comments)
- **Model Request Board** — Post/claim/fulfill geometry requests
- **Activity Feed** — Social timeline of followed users' actions
- **Platform Announcements** — Owner broadcasts a banner to all users
- **Staff Picks** — Official-curated featured model row on homepage
- **Bulk Upload** — Officials upload up to 20 models at once
- **Per-Model Analytics** — Charts of views/downloads/likes for model owners + Officials
- **Reported Content Queue** — Officials review + action reported models
- **Export History** — Users track all models they've downloaded
- **Referral System** — Share your referral link, track sign-ups
- **Achievement Badges** — Earned badges: "First Upload", "100 Downloads", "Kaiju Official ✦"
- **Badge System** — `OFFICIAL` (blue) and `OWNER` (gold) on every model card
- **Notification System** — In-app bell for likes, comments, follows, downloads, announcements
- **Dark/Light Theme** — Default white/black/blue, toggle available
- **Keyboard Shortcuts** — `U`=upload, `S`=search, `A`=AIDER-X, `Esc`=close panels
- **PWA** — Installable on desktop/mobile with offline model viewing
- **Model Report System** — Flag inappropriate content
- **Multi-language Ready** — i18n keys from day one
- **API Documentation Page** — Full REST API reference with try-it buttons
- **Changelog / Updates Page** — Platform release history
- **Premium Tier Placeholder** — Reserved section in settings for future subscription model

---

## Footer — Mantiz & ZaneOmotoye Branding

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Kaiju Logo]          Kaiju CAD Library                                 │
│  The World's Geometry                                                    │
│                                                                          │
│  Platform  ·  Upload  ·  Search  ·  API Docs  ·  Feedback               │
│                                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                                          │
│  [BlackWolf]  ZaneOmotoye          [Mantiz Logo]  Mantiz                 │
│  Creator & Founder                 Creative Development & Branding       │
│  📧 zaneomotoye1@gmail.com         📱 +234 7036732988                   │
│                                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  📬 Newsletter — Stay updated on Kaiju releases & new models             │
│  [Email input_________________________] [Subscribe]                      │
│                                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  © 2026 Mantiz · Built with Kaiju LCEM · All rights reserved            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Logo file paths for the AI to use (copy all three to `kaiju-platform/assets/`):**
- `kaiju-platform/assets/kaiju-logo.png` ← from `kaiju/Kaiju-logo.png`
- `kaiju-platform/assets/blackwolf.png` ← from `info - Copy/blackwolf.png`
- `kaiju-platform/assets/mantiz-logo.png` ← from `info - Copy/Mantiz-logo.png`

**Contact details:**
- 📧 Email: zaneomotoye1@gmail.com
- 📱 Phone: +234 7036732988
- **Creator:** ZaneOmotoye — Creator & Founder
- **Company:** Mantiz — Creative Development & Branding
