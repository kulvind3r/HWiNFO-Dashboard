<div align="center">

# HWiNFO Dashboard

A modular web dashboard for visualizing real-time hardware sensor data from HWiNFO.

![Dashboard](./dashboard-demo.png)

</div>

## Overview

This project is an addon for **[remotehwinfo](https://github.com/demion/remotehwinfo)** which serves as the JSON data server. The dashboard fetches sensor readings from the remotehwinfo API and displays them using configurable widgets.

It is not very one click plug and play and requires low-to-moderate programming knowledge to customise the config.

## How It Works

1. **remotehwinfo** runs on the target machine and exposes HWiNFO sensor data as JSON at `/json.json`
2. The dashboard loads [`config.js`](config.js) to determine which widgets to render
3. Each widget automatically fetches the sensor values it needs from the JSON data
4. Data refreshes at configurable intervals and updates all widgets in real-time

## Getting Started

1. Set up [remotehwinfo](https://github.com/demion/remotehwinfo) on the machine running HWiNFO
2. Download zip of source code from clone option.
2. Edit [`config.js`](config.js) and modify to use your server URL and widget configuration.
3. Open [`dashboard.html`](dashboard.html) in a browser

> Carefully look at [sample.json](./sample.json) and [config.js](./config.js) to understand how values returned by server 
> are hooked into the dashboard. Everything you need is within these examples.

## Dashboard Modes

The dashboard operates in one of two modes, set via `mode` in [`config.js`](config.js).

### Client Mode (default)

Open `dashboard.html` directly in a browser (`file://`). No web server needed.

```javascript
const dashboardConfig = {
    mode: "client",
    remotehwinfoUrl: "", // enter via settings panel or set here — saved in localStorage
    widgets: [ /* ... */ ]
};
```

- HWiNFO stats only — no healthcheck panels
- Set `remotehwinfoUrl` to your remotehwinfo server URL. The value can also be entered via the settings panel and is saved in browser localStorage.

### Server Mode

Served by Caddy. Provides HWiNFO stats **and** live healthcheck panels for local services.

```javascript
const dashboardConfig = {
    mode: "server",
    // remotehwinfoUrl is ignored — data comes from /api/hwinfo proxied by Caddy
    widgets: [ /* ... */ ]
};
```

Requires Caddy + Python + NSSM on the Windows machine running remotehwinfo. See [Server Mode Setup](#server-mode-setup) below.

## Configuration

Edit [`config.js`](config.js) to customize the dashboard:

```javascript
const dashboardConfig = {
    mode: "client",      // "client" | "server"
    remotehwinfoUrl: "", // client mode only — enter via settings panel or set here
    widgets: [ /* widget definitions */ ]
};
```

Each widget entry requires:
- **id** - Unique DOM element ID
- **type** - Widget type (must match one of the available widgets below)
- **order** - Display position (widgets part of a card widget **must** not have order number)
- **config** - Widget-specific configuration object
    - **reading** - Most important key in widget config. This is where you store the labelUser string for the value you want to show in widget. See [sample.json](./sample.json) for an exampe of JSON returned by remotehwinfo server.

## Available Widgets

| Widget | Description | Type Identifier |
|--------|-------------|-----------------|
| **Text Value** | Simple label and large text value display with optional boolean (yes/no) mode. Supports Offsetting the value. | [`text-value`](widgets/text-value/text-value.js) |
| **Vertical Bar Graph** | Color-coded vertical bar for percentage or value metrics (CPU usage, temperature, etc.) with optional left/right text fields | [`vertical-bar-graph`](widgets/vertical-bar-graph/vertical-bar-graph.js) |
| **Line Graph** | Horizontal timeline graph showing the last 60 readings of a sensor value | [`line-graph`](widgets/line-graph/line-graph.js) |
| **Speedometer Gauge** | Arc-style gauge with gradient colors for clock speeds or single values | [`speedometer-gauge`](widgets/speedometer-gauge/speedometer-gauge.js) |
| **2D Pie Chart** | Two-slice pie chart for displaying usage vs remaining (disk space, etc.) | [`2d-pie-chart`](widgets/2d-pie-chart/2d-pie-chart.js) |
| **Card** | Container widget that groups 2, 3, or 4 child widgets into a titled card layout | [`card`](widgets/card/card.js) |

### Card Layouts

The Card widget supports the following layouts (auto-selected based on widget count if not specified):

| Layout | Widgets Required | Description |
|--------|-----------------|-------------|
| `2-equal-columns` | 2 | Two widgets side-by-side, each taking 50% width and 100% height |
| `2-equal-rows` | 2 | Two widgets stacked vertically, each taking 100% width and 50% height |
| `1-row-2-columns` | 3 | First widget takes 100% width on top row, remaining two widgets on 2nd row at 50% width each |
| `quadrant` | 4 | Four widgets split into a 2x2 grid, each taking 50% horizontal and 50% vertical |

**Auto-selection (when layout is not specified):**
- 2 widgets → `2-equal-columns`
- 3 widgets → `1-row-2-columns`
- 4+ widgets → `quadrant`
- Less than 2 widgets → Shows error message

Each widget JS file contains detailed documentation on configuration options and usage examples.

## Healthcheck Panels

Available in **server mode only**. Displays live status of services running locally on the server machine in two columns flanking the widget grid.

> **Intended use**: monitoring services running on the same Windows machine as remotehwinfo (e.g. Jellyfin, qBittorrent, Navidrome). All probing happens server-side via Python so there are no browser CORS, mixed-content, or self-signed certificate limitations.
>
> **Remote / internet services**: technically any HTTP/HTTPS URL works, but this is not the intended use. If the server machine loses internet connectivity all remote checks report Offline regardless of actual service health — making results unreliable. Tools like [Uptime Kuma](https://github.com/louislam/uptime-kuma) are better suited for remote monitoring.

Service definitions live in [`server/healthcheck_config.json`](server/healthcheck_config.json):

```json
{
    "port": 47731,
    "checkIntervalSeconds": 30,
    "services": [
        { "label": "Jellyfin",    "url": "http://localhost:8096" },
        { "label": "qBittorrent", "url": "http://localhost:8080" },
        { "label": "Navidrome",   "url": "http://localhost:4533", "icon": "🎵" },
        { "label": "SSH",         "type": "ssh", "host": "localhost", "port": 22 }
    ]
}
```

### Service fields

| Field | Required | Description |
|-------|----------|-------------|
| `label` | Yes | Display name — must be unique. Also used as the DOM identifier and to auto-fetch the service icon |
| `type` | No | Probe type: `http` (default, no need to specify) or `ssh` |
| `url` | For HTTP | URL to probe. Use `http://localhost:PORT` for services on the same machine |
| `host` | For SSH | Hostname or IP to connect to (default: `localhost`) |
| `port` | For SSH | Port to connect to (default: `22`) |
| `icon` | No | Emoji to render instead of the auto-fetched CDN icon |

### How probing works

**HTTP (default):** The Python service sends a `HEAD` request to the service URL with a 5-second timeout. SSL certificate verification is disabled to support self-signed certificates common in homelab environments. Any HTTP response (including 4xx/5xx) is treated as Online; a refused connection or timeout is Offline.

**SSH:** A TCP socket connection is attempted to `host:port`. A successful connection means the SSH daemon is listening — no authentication is performed. A refused connection or timeout is Offline.

Icons are resolved in order: [selfh.st/icons](https://github.com/selfhst/icons) → [dashboard-icons](https://github.com/walkxcode/dashboard-icons) → SVG fallback. Use the `icon` field to override with an emoji for any service not found in either CDN.

## Server Mode Setup

RemoteHWinfo is a Windows application, so all server-mode components run on the same Windows machine.

### Dependencies

| Tool | Where to get |
|------|-------------|
| **Python 3** | [python.org](https://www.python.org/downloads/) — ensure `python.exe` is on PATH |
| **NSSM** | [nssm.cc](https://nssm.cc/download) — place `nssm.exe` on PATH |
| **Caddy** | [caddyserver.com](https://caddyserver.com/docs/install) — place `caddy.exe` on PATH |

### Steps

1. **Edit `server/Caddyfile`** — set the two `<CHANGE ME>` values:
   - The absolute path to your `HWiNFO-Dashboard` folder
   - The host and port of your remotehwinfo server

2. **Copy `server/Caddyfile`** to the directory where Caddy is installed (or wherever you will run Caddy from).

3. **Edit `server/healthcheck_config.json`** — replace the example services with your actual locally-running services.

4. **Start Caddy** from the directory containing the Caddyfile:
   ```cmd
   caddy run --config Caddyfile
   ```

5. **Install the Python healthcheck service** — run as Administrator:
   ```cmd
   server\install-service.bat
   ```

6. **Set `mode: "server"` in `config.js`** and open the dashboard URL in a browser (e.g. `http://localhost`).

### Managing the healthcheck service

```cmd
nssm status HWinfoDashboardHealth    :: check running state
nssm stop   HWinfoDashboardHealth    :: stop
nssm start  HWinfoDashboardHealth    :: start
nssm remove HWinfoDashboardHealth confirm  :: uninstall
```

Logs are written to `server/healthcheck-service.log`.

### Changing the port

Edit `"port"` in `server/healthcheck_config.json` and update the matching port on the `reverse_proxy` line in `server/Caddyfile`, then restart both services.

## Widget Architecture

All widgets extend [`WidgetBase`](widgets/WidgetBase.js) and implement:
- **render()** - Creates the DOM structure for the widget
- **update(data)** - Receives the full server data object and extracts the needed readings

The dashboard automatically registers all widgets and routes data updates to them. To create a custom widget, extend `WidgetBase` and register it in the `WidgetTypeMap` in [`dashboard.js`](dashboard.js).
