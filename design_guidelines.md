# Trader Time Organizer - Design Guidelines

## Design Approach

**Selected Framework**: Design System Approach (Linear + Apple HIG Fusion)

**Rationale**: As a precision-focused productivity tool for traders managing global time zones, this application prioritizes clarity, efficiency, and information density over visual storytelling. Drawing inspiration from Linear's clean interface and Apple's content-first philosophy ensures the time data remains the hero while maintaining professional polish.

**Core Principles**:
- Precision First: Every element serves the trader's need for accurate time management
- Minimal Distraction: Clean layouts that don't compete with critical time information
- Scannable Hierarchy: Quick visual parsing of UTC vs local time, alarms, and schedules
- Professional Authority: Trading platform aesthetic meets modern productivity tool

---

## Typography System

**Font Stack**: 
- Primary: Inter (via Google Fonts CDN) - Clean, highly legible for data-dense interfaces
- Monospace: JetBrains Mono (for time displays) - Ensures consistent digit width for scanning

**Hierarchy**:
- Page Titles: text-3xl, font-bold (Home, Calendar, Settings headers)
- Section Headers: text-xl, font-semibold 
- Time Displays: text-2xl, font-mono, font-medium (critical UTC/local times)
- Body Text: text-base, font-normal
- Labels/Meta: text-sm, font-medium
- Captions: text-xs, font-normal

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 8, 12, and 16 consistently
- Micro spacing (gaps, padding within cards): p-4, gap-2
- Component spacing: p-8, gap-4
- Section spacing: py-12, px-8
- Page margins: max-w-7xl mx-auto px-4

**Grid Strategy**:
- Mobile: Single column, full-width components
- Tablet (md:): 2-column for settings, side-by-side rulers
- Desktop (lg:): 3-column dashboard layout for Home, max-w-prose for Settings

**Container Strategy**:
- Full-width time rulers: w-full with controlled inner max-w-6xl
- Forms/Settings: max-w-2xl centered
- Calendar view: max-w-7xl for month grid visibility

---

## Component Library

### Navigation
- Top app bar: Horizontal navigation with logo left, links right
- Links: Home, Calendar, Settings with active state indication (underline weight)
- Mobile: Hamburger menu with slide-out drawer

### Time Display Components
**UTC Ruler** (placeholder for Phase 2):
- Horizontal strip spanning full width
- Monospace typography for hour markers
- Current time indicator (vertical line/marker)
- 24-hour format with clear AM/PM delineation

**Local Time Ruler** (placeholder for Phase 3):
- Similar to UTC ruler but offset
- Clear relationship indicator to UTC ruler (connecting line)
- Time zone label prominent

### Cards/Containers
- Rounded corners: rounded-lg
- Elevated cards: shadow-md with subtle border
- Padding: p-6 for content cards
- Stacking rhythm: space-y-4 between cards

### Forms (Settings Screen)
- Input fields: Full-width with clear labels above
- Input styling: border, rounded-md, p-3, focus ring treatment
- Buttons: Solid primary actions (rounded-md, px-6, py-3, font-medium)
- Toggle switches: For settings like notifications, time format preferences
- Spacing: space-y-6 between form sections

### Calendar Components (placeholder for Phase 8)
- Month grid: 7-column layout (Sunday-Saturday)
- Day cells: Square aspect ratio, p-2
- Event indicators: Small dots or badges
- Selected date: Ring treatment with emphasized background

### Alarm/Alert Cards
- Compact horizontal layout: Icon left, time/label center, actions right
- Clear visual separation between system alarms vs user alerts
- Dismissible interaction pattern

---

## Screen-Specific Layouts

### Home Screen
**Structure**:
1. Header with app title and navigation (h-16)
2. Hero Section: 
   - Welcome message + brief tagline (py-8)
   - Quick stats: "X active alarms | Y time zones tracked" (grid-cols-2, gap-4)
3. Time Rulers Section (py-8):
   - UTC Ruler component (placeholder)
   - Local Time Ruler component (placeholder)
   - Vertical spacing: space-y-6
4. Quick Actions Grid (grid-cols-2 md:grid-cols-3, gap-4):
   - "View Calendar" card
   - "Set Alarm" card  
   - "Add Note" card
   - Each card: p-6, text-center, hover lift effect
5. Recent Activity/Upcoming Alarms (py-8):
   - List layout with space-y-3
   - Each item: flex justify-between, p-4

### Calendar Screen
**Structure**:
1. Month navigation bar: Prev/Current Month/Next (flex justify-between, py-4)
2. Calendar grid: Full width, responsive cells
3. Side panel (lg:): Selected day details, notes, alarms (w-80)
4. Mobile: Stack selected day details below calendar

### Settings Screen
**Structure**:
1. Centered form layout (max-w-2xl)
2. Section groups with headers (space-y-8):
   - Time Zone Preferences
   - Notification Settings  
   - Alarm Sound Selection
   - Display Preferences (24h format, first day of week)
   - Data Management (export/import)
3. Save button: Sticky bottom on mobile, inline on desktop

---

## Iconography

**Icon Library**: Heroicons (via CDN)
- Consistent outline style for navigation and actions
- Solid style for active states and emphasis
- Size: w-5 h-5 for inline icons, w-8 h-8 for feature cards

**Key Icons**:
- Clock: Time displays, alarms
- Calendar: Calendar navigation
- Cog: Settings
- Bell: Notifications/alerts
- Globe: Time zones
- Plus: Add actions

---

## Responsive Behavior

**Breakpoints**:
- Mobile (default): Stack all elements, full-width components
- Tablet (md: 768px): Side-by-side rulers, 2-column grids
- Desktop (lg: 1024px): 3-column layouts, persistent side panels

**Mobile-Specific**:
- Bottom navigation bar alternative (if preferred over hamburger)
- Time rulers: Scrollable horizontal overflow with snap points
- Calendar: Swipe gestures between months

---

## Accessibility

- Focus indicators: Clear ring treatment on all interactive elements
- Semantic HTML: Proper heading hierarchy, nav/main/section elements
- ARIA labels: Especially for time displays and icon-only buttons
- Keyboard navigation: Full support for tab through time rulers and calendar
- Touch targets: Minimum 44px for all interactive elements (mobile)

---

## Animation Philosophy

**Minimal, Purposeful Motion**:
- Page transitions: None (instant for productivity)
- Card hover: Subtle lift (translate-y-1) 
- Drawer/modal: Slide-in (300ms)
- Alarm triggers: Gentle pulse on bell icon
- No scroll-triggered animations - focus on content

---

## Images

**Hero Section**: No large hero image - this is a utility app where function precedes storytelling. Instead, use:
- Clean typographic welcome with app icon
- Immediate access to time ruler visualization
- Dashboard-style information density

**Accent Images**:
- Empty state illustrations: Simple, minimal line art for "No alarms set" or "Calendar is empty"
- Settings screen: Optional small icon representing each preference category
- Style: Geometric, professional, not illustrative/playful