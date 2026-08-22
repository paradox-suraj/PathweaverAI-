# PathWeaver AI Platform - Design Specification

## 1. Design System

### Color Palette

**Primary (Deep Indigo/Violet)**
- Primary-50: `#F5F3FF`
- Primary-500: `#8B5CF6` (Main Brand)
- Primary-600: `#7C3AED`
- Primary-900: `#4C1D95`
- Gradient: `linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)`

**Secondary (Emerald/Teal)**
- Secondary-50: `#ECFDF5`
- Secondary-500: `#10B981`
- Secondary-900: `#064E3B`

**Accent (Amber/Gold)**
- Accent-50: `#FFFBEB`
- Accent-500: `#F59E0B`
- Accent-900: `#78350F`

**Neutral (Dark Mode Default - Slate Grays)**
- Background: `#09090B` (Very dark slate/black)
- Surface-1: `#18181B` (Slightly lighter slate)
- Surface-2: `#27272A` (Hover states, borders)
- Text-Primary: `#FAFAFA`
- Text-Secondary: `#A1A1AA`
- Text-Muted: `#71717A`

**Semantic**
- Error: `#EF4444`
- Success: `#10B981`
- Warning: `#F59E0B`
- Info: `#3B82F6`

### Typography

**Font Families**
- Headings: `Plus Jakarta Sans`, sans-serif
- Body: `Inter`, sans-serif
- Monospace: `JetBrains Mono`, monospace

**Scale**
- xs: 12px / 16px line-height
- sm: 14px / 20px
- base: 16px / 24px
- lg: 18px / 28px
- xl: 20px / 28px
- 2xl: 24px / 32px
- 3xl: 30px / 36px
- 4xl: 36px / 40px

**Weights**
- Regular: 400
- Medium: 500
- SemiBold: 600
- Bold: 700
- ExtraBold: 800

### Spacing
4px base grid system
- sp-1: 4px
- sp-2: 8px
- sp-3: 12px
- sp-4: 16px
- sp-5: 20px
- sp-6: 24px
- sp-8: 32px
- sp-10: 40px
- sp-12: 48px
- sp-16: 64px
- sp-20: 80px
- sp-24: 96px

### Border Radius
- sm: 6px
- md: 8px
- lg: 12px
- xl: 16px
- 2xl: 24px
- full: 9999px

### Shadows
- subtle: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- default: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- medium: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- large: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- glow-primary: `0 0 15px 2px rgba(139, 92, 246, 0.3)`

### Glassmorphism
- Surface-Glass: `rgba(24, 24, 27, 0.6)`
- Backdrop-Blur: `12px`
- Border: `1px solid rgba(255, 255, 255, 0.08)`


## 2. Component Library Specs

### Navigation
- **Sidebar (collapsible)**: Glassmorphism surface, 280px width (expanded) or 64px (collapsed). Contains primary navigation icons with text labels, active state uses Primary-500 tint and vertical left border. User profile at bottom.
- **Top bar**: Glass surface, 64px height. Contains breadcrumbs, global search input, streak indicator (fire icon with count), and notification bell.
- **Breadcrumbs**: Text-Secondary, separated by Chevron Right icons. Current page in Text-Primary.

### Cards
- **Course card**: Aspect ratio 16:9 thumbnail top, content bottom. lg border radius, default shadow. Contains course title, progress bar, time estimate, and 'Continue' primary button on hover.
- **Resource card**: Horizontal layout layout, thumbnail left, text right. Play icon overlay on hover. Used for YouTube videos or PDFs.
- **Schedule card**: Vertical layout with time block left, course context right. Left border colored based on course topic.
- **Stats card**: Minimal card, subtle background. Large number (3xl, Primary-500) with small descriptive text below.

### Buttons
- **Primary**: Gradient background (`Primary-500` to `Primary-600`), Text-Primary, md border-radius, glow-primary shadow on hover.
- **Secondary**: Surface-2 background, border `rgba(255,255,255,0.1)`, Text-Primary. Hover: slightly lighter background.
- **Ghost**: Transparent background, Text-Secondary. Hover: Surface-2 background, Text-Primary.
- **Icon**: Square button (sp-10), md border-radius. Surface-2 background.
- **Floating Action**: Circular (sp-16), gradient background, large shadow, fixed position bottom right.

### Forms
- **Input**: Background `rgba(0,0,0,0.2)`, border `rgba(255,255,255,0.1)`, md border-radius. Focus state: border Primary-500, glow shadow.
- **Select**: Similar to input, with Chevron Down icon. Dropdown menu uses Surface-Glass.
- **Date/Time picker**: Calendar grid drop-down, primary color for selected date, hover states for days.
- **Slider**: Primary-500 track fill, Surface-2 unfilled track, white circular thumb.

### Progress
- **Progress bar**: Height 8px, full border-radius. Background Surface-2, fill Primary Gradient.
- **Circular progress**: SVG circle, track `rgba(255,255,255,0.1)`, stroke Primary-500, glowing effect.
- **Streak indicator**: Flame icon (Accent-500) followed by number.
- **Mastery gauge**: Radar or semi-circle gauge indicating skill level.

### Charts
- **Line chart**: Smooth curve (tension 0.4), gradient fill below line. Primary-500 stroke.
- **Bar chart**: Rounded tops, Surface-2 for inactive bars, Primary-500 for active/current.
- **Radar chart**: Polygon with Primary-500 stroke, translucent Primary-500 fill. Points indicated by circles.
- **Heatmap (calendar)**: GitHub-style squares. 5 shades of Primary color from empty (Surface-2) to intense (Primary-500).

### Modals
- **Base Modal**: Centered, Surface-Glass background, border `rgba(255,255,255,0.1)`, large shadow, xl border-radius. Backdrop is `rgba(0,0,0,0.5)` with blur.
- **Course creation wizard**: Modal with top step indicator, distinct content area, and bottom fixed action bar (Next/Back).
- **Quiz modal**: Large modal, centered question text (2xl), selectable answer cards, bottom 'Submit' button.

### Video Player
- **Container**: 16:9 aspect ratio, xl border-radius, hidden overflow.
- **Custom controls**: Bottom gradient overlay (black to transparent). Progress bar, play/pause, volume, timestamp, fullscreen.
- **Timestamp markers**: Small dots on progress bar indicating AI-generated chapters/notes.

### Badges
- **Achievement**: Gold/Amber background with inner glow, specific icon, small text.
- **Mastery level**: Polygon shapes (shield or gem), colored based on level (Bronze, Silver, Gold, Platinum, Diamond).
- **Priority**: Small pill shape (px-2 py-1), red for high, amber for medium, green for low.

### Avatar & Profile
- **User avatar**: Circular, image or Initials on Primary background.
- **XP bar**: Thin progress bar immediately beneath avatar.
- **Level indicator**: Small circular badge overlapping avatar bottom-right corner.

### Skeleton Loaders
- Pulsing animation (`rgba(255,255,255,0.05)` to `rgba(255,255,255,0.1)`). Rounded shapes matching the loaded component's final structure.


## 3. Screen Specifications

### 1. Onboarding / Welcome
- **Purpose**: First-time user flow with goal setting.
- **Layout**: Centered flexbox container, max-width 600px, 100vh height.
- **Components**: Large logo, Typography (3xl heading "Welcome to PathWeaver AI", Text-Secondary subtitle), Grid of 4 selectable 'Goal' cards, large Primary button "Get Started".
- **Interactions**: Cards pop up sequentially on load. Selecting a card adds a primary border and checkmark icon.
- **Responsive**: Full width on mobile with sp-4 padding.

### 2. Dashboard / Home
- **Purpose**: Daily overview with today's schedule, progress summary, active courses, streak.
- **Layout**: CSS Grid. Sidebar left. Main content area: 12-column grid. Top row (Stats): 4 cols each. Middle row: left 8 cols (Today's Plan), right 4 cols (Active Course/Streak).
- **Components**: Sidebar, Top bar, Stats cards (XP, Hours, Courses), Timeline/Schedule view, Course cards, Streak indicator card.
- **Content**: Greeting header "Good Morning, User", motivational quote. Today's timeline blocks.
- **Interactions**: Hover on schedule items expands details.
- **Responsive**: Mobile stacks all grid columns vertically. Sidebar becomes bottom tab bar or hamburger menu.

### 3. Course Creation Wizard
- **Purpose**: Multi-step form to generate a learning path.
- **Layout**: Centered modal wizard over a blurred background of the dashboard.
- **Components**: Base Modal, Progress Bar (top), Input fields, Select, Buttons (Primary/Ghost).
- **Data Displayed**: Steps: 1. Goal/Topic (Input) 2. Current Level (Select/Radio cards) 3. Deadline (Date picker) 4. Time commitment (Slider) 5. Preferences.
- **Interactions**: Sliding view transition between steps. Loading state shows AI processing animation (glowing brain or nodes).

### 4. Course Overview
- **Purpose**: Course tree, resources, progress, schedule preview.
- **Layout**: Split pane. Left (30%): Course details, progress, mastery gauge. Right (70%): Scrollable Course tree/modules list.
- **Components**: Circular progress, Typography headings, Tree view with connecting lines, Resource cards.
- **Data Displayed**: Overall completion %, next module up, list of modules with collapsible children (lessons).
- **Interactions**: Clicking a module expands/collapses with smooth height animation.

### 5. Resource Discovery
- **Purpose**: YouTube search, playlist import, PDF upload, resource cards.
- **Layout**: Top heavy search bar area, followed by a grid (auto-fill, minmax 300px) of results.
- **Components**: Large Input (Search), Filter badges, Resource cards, Ghost buttons for import.
- **Interactions**: Skeleton loaders while searching. Cards scale up 2% on hover.

### 6. Daily Schedule / Today's Plan
- **Purpose**: Timeline view of today's study sessions.
- **Layout**: Vertical timeline spanning full height, centered max-width 800px.
- **Components**: Timeline nodes, Schedule cards, Floating Action Button (to start session).
- **Data Displayed**: Chronological list of study blocks (e.g., 9:00 AM - Python Basics), breaks included. Current time indicator line (Primary-500).
- **Interactions**: Drag and drop to reorder blocks. Click to edit time.

### 7. Learning Session
- **Purpose**: Video player with side panel (notes, quiz, AI chat).
- **Layout**: Full screen flex layout. Left (70%): Video Player, large. Right (30%): Tabbed side panel.
- **Components**: Video Player, Tabs (Notes, Chat, Quiz), Chat message bubbles, Input area.
- **Data Displayed**: Current video. Side panel shows AI-generated notes synced to timestamp.
- **Interactions**: Clicking a note timestamp seeks the video. AI chat streams text.

### 8. Quiz / Assessment
- **Purpose**: AI-generated questions with feedback and scoring.
- **Layout**: Centered single question view to maintain focus. Max-width 700px.
- **Components**: Progress bar (top), large question text (2xl), vertical list of multiple-choice answer cards, Primary 'Submit' button.
- **Interactions**: Selecting an answer highlights it. On submit, card turns Success (green) or Error (red), and AI feedback block slides down below.

### 9. Analytics Dashboard
- **Purpose**: Charts, mastery radar, study heatmap, predictions.
- **Layout**: Masonry or dense Grid layout.
- **Components**: Heatmap (top full width), Line chart (study hours), Radar chart (skill mastery), Stats cards.
- **Data Displayed**: 365-day contribution graph, weekly moving average hours, skill distribution.
- **Interactions**: Tooltips on hover over chart data points. Time range filters (7d, 30d, 1y).

### 10. Calendar / Weekly Planner
- **Purpose**: Weekly grid with drag-and-drop scheduling.
- **Layout**: Standard calendar 7-column grid layout with time row headers on the left.
- **Components**: Top bar (Date range, Next/Prev week buttons), Calendar grid cells, draggable Schedule event blocks.
- **Interactions**: Drag blocks to reschedule. Resize blocks to change duration. Current day column highlighted with Surface-2 background.

### 11. Profile & Settings
- **Purpose**: User profile, preferences, notification settings.
- **Layout**: Sidebar (left) for settings categories, main content area (right) for forms.
- **Components**: Avatar uploader, Form inputs, Toggle switches (for notifications), Select dropdowns (theme, timezone).
- **Data Displayed**: User details, API keys (hidden), billing status.

### 12. Course Library
- **Purpose**: All courses grid/list with filters and sorting.
- **Layout**: Top filter bar. Below: Grid (auto-fill, minmax 280px) of Course cards.
- **Components**: Search input, Dropdown sort, Toggle (Grid/List view), Course cards.
- **Interactions**: Pagination or infinite scroll loader at bottom.

### 13. Recovery Plan
- **Purpose**: When behind schedule: visualization of rescheduled plan.
- **Layout**: Modal or overlay page. Split view: Left shows "Original Plan", Right shows "New AI Plan".
- **Components**: Warning banner at top, Side-by-side Timeline comparison, Primary button "Accept New Schedule".
- **Data Displayed**: Highlights missed sessions in red, shows how they are distributed over upcoming days in amber.

### 14. Achievement / Gamification
- **Purpose**: Badges, streaks, leaderboard, XP system.
- **Layout**: Hero section with current level/avatar. Below: Grid of unlocked and locked badges.
- **Components**: Avatar with large Level badge, XP progress bar, Achievement Badges (colored vs grayscale for locked).
- **Interactions**: Hover over locked badge shows requirement tooltip. Confetti animation triggers on this page if newly leveled up.


## 4. Animation & Interaction Specs

- **Page Transitions**: Use View Transitions API. Cross-fade background, slide up content by 20px over 300ms, ease-out cubic-bezier(0.16, 1, 0.3, 1).
- **Scroll-driven Animations**: Staggered fade-in and slide-up for list items (Course cards, Timeline events) as they enter the viewport.
- **Micro-interactions**: 
  - Buttons: scale down 0.97 on active (press).
  - Cards: scale up 1.02 on hover, shadow increases from default to large.
  - Progress updates: Number counters animate counting up, progress bars fill smoothly.
- **Loading States**: Skeleton screens for all asynchronous data. Avoid full page spinners. Use glowing pulse effect.
- **Celebration Animations**: 
  - Canvas confetti triggered from bottom corners on completing a course or passing a quiz.
  - Badge unlock: Badge scales from 0 to 1 with an elastic bounce and a glowing aura sweep.


## 5. Responsive Breakpoints

- **Mobile (320px - 768px)**
  - Sidebar hidden, use bottom navigation bar.
  - Grids collapse to 1 column.
  - Padding reduced to sp-4.
  - Typography scale slightly reduced (e.g., 4xl becomes 3xl).
- **Tablet (769px - 1024px)**
  - Sidebar collapses to icon-only (64px width).
  - Grids become 2 columns.
  - Modals take up 90% width.
- **Desktop (1025px - 1440px)**
  - Standard layout. Sidebar fully expanded (280px).
  - Grids follow 12-column layout.
- **Wide (1441px+)**
  - Content max-width constrained to 1440px and centered to prevent stretching on ultrawide monitors.
  - UI scaling can be optionally increased.

---
*Generated for Stitch AI.*
