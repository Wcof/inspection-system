# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install dependencies**: `npm install`
- **Run locally**: Serve static files with any HTTP server, e.g.:
  - `npx serve .`
  - `python3 -m http.server 8000`
  - `php -S localhost:8000`
- **Tests**: No test framework configured

## Architecture

This is a **real-time intelligent inspection robot command center dashboard** - a single-page web application for monitoring and managing a fleet of autonomous inspection robots in industrial environments.

### Technology Stack
- Vanilla JavaScript (ES6+ modules)
- MapLibre GL JS for interactive map visualization
- Custom CSS with CSS variables for theming
- No build system - static HTML/CSS/JS

### File Structure
```
dashboard/
├── index.html   # Main HTML entry point
├── app.js       # Main application logic (~67KB)
├── main.css     # Styling (~29KB)
└── package.json # Dependencies (mapbox-gl/maplibre-gl)
```

### Core Architecture

**State Management**:
- Single global `STATE` object tracks:
  - Current view mode (global / focused on robot/alert/dock)
  - Selected robot, task, alert, dock
  - Autoplay enabled/disabled (auto-task switching every 8s)

**Data Model**:
- Static mock data in `DATA` object containing:
  - `robots`: 5 robots with status (running/charging/warning/danger), battery, location
  - `tasks`: Inspection tasks with progress, inspection points, metrics
  - `alerts`: 3 alerts with severity (danger/warning) and state (unconfirmed/confirmed/cleared)
  - `docks`: 2 charging/docking stations
  - `inspectionPoints`: 4 monitored locations with sensor readings

**Rendering Pipeline**:
- `renderAll()` - Main render coordinator
- Individual render functions: `renderStats()`, `renderRobots()`, `renderAlerts()`, `renderDocks()`, `renderTaskCard()`, `renderTimeline()`, `renderEvidence()`, `updateMapLayers()`
- Direct DOM manipulation via `querySelector` and `innerHTML`
- Map layer updates through MapLibre GL JS API

### Key Features

1. **Interactive Map**: 3D factory layout with:
   - Robot position markers (custom SVG car icon)
   - Inspection points
   - Patrol paths (active vs future segments)
   - Pulsing animations for active alerts
   - 3D building extrusions

2. **Dashboard**: 6 KPI cards showing fleet summary
3. **Robot Management**: Status, battery levels, task assignment
4. **Task Management**: Filterable task list with progress tracking, sensor metrics
5. **Alert System**: Severity-based coloring, evidence viewing, actions (confirm/clear/undo)
6. **Timeline**: Visual task execution history with future path preview
7. **Evidence Modal**: Full-screen image viewing with visible/thermal/video modes
8. **Dock Monitoring**: Charging station status and availability

### Theming

CSS variables in `main.css` define the dark theme:
- `--bg-deep`: Dark background (#05080E)
- `--bg-panel`: Semi-transparent panels (rgba(10, 16, 26, 0.85))
- `--accent-titan`: Gold accent color (#C5A87B)
- `--accent-smog`: Blue-gray accent (#6B8EAD)
- Status colors: `--status-safe` (green), `--status-warn` (yellow), `--status-danger` (red), `--status-charging` (blue)

## Development Notes

- All data is currently static mock data - no backend API integration
- MapLibre GL JS is used (API compatible with Mapbox GL JS v3.20.0)
- Designed for desktop display - responsive but not optimized for mobile
- The application is a demo/proof-of-concept for an industrial inspection robot command center
