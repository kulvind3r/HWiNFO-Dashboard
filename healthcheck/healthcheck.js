/**
 * Healthcheck Module — Server Mode Thin Client
 *
 * Polls /api/health (served by Caddy, proxied to the Python healthcheck service)
 * and renders two side panels (left/right) beside the main widget grid.
 *
 * All service probing happens server-side in healthcheck_server.py.
 * This module only fetches results and updates the DOM.
 *
 * Activated by dashboard.js when config.mode === "server".
 */

const HealthCheckModule = (() => {

    // ─── Constants ────────────────────────────────────────────────────────────

    const HEALTH_ENDPOINT          = '/api/health';
    const DASHBOARD_ICONS_CDN_BASE = 'https://cdn.jsdelivr.net/gh/selfhst/icons/png';
    const DASHBOARD_ICONS_CDN_FALLBACK = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png';

    const Status = Object.freeze({
        PENDING: 'pending',
        UP:      'up',
        DOWN:    'down',
    });

    // ─── State ────────────────────────────────────────────────────────────────

    let pollTimer      = null;
    let panelsRendered = false;

    // ─── Public API ───────────────────────────────────────────────────────────

    function init() {
        fetchAndRender();
    }

    function destroy() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        panelsRendered = false;
    }

    // ─── Data Fetching ────────────────────────────────────────────────────────

    async function fetchAndRender() {
        let payload;
        try {
            const response = await fetch(HEALTH_ENDPOINT);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            payload = await response.json();
        } catch (err) {
            console.error('[HealthCheck] Failed to fetch health status:', err);
            return;
        }

        const services = payload?.services;
        if (!Array.isArray(services)) return;

        if (!panelsRendered) {
            renderPanels(services);
            panelsRendered = true;

            // Start polling at the interval the server reports
            const intervalMs = (payload.checkIntervalSeconds ?? 30) * 1000;
            pollTimer = setInterval(fetchAndRender, intervalMs);
        } else {
            // Panels already built — just refresh the status badges
            for (const svc of services) {
                updateServiceStatus(svc.label, svc.status ?? Status.DOWN);
            }
        }
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    function renderPanels(services) {
        const leftPanel  = document.getElementById('healthcheck-left');
        const rightPanel = document.getElementById('healthcheck-right');
        if (!leftPanel || !rightPanel) return;

        const midpoint      = Math.ceil(services.length / 2);
        const leftServices  = services.slice(0, midpoint);
        const rightServices = services.slice(midpoint);

        leftPanel.appendChild(buildPanel(leftServices));
        rightPanel.appendChild(buildPanel(rightServices));
    }

    function buildPanel(services) {
        const list = document.createElement('ul');
        list.className = 'hc-list';
        for (const service of services) {
            list.appendChild(buildServiceItem(service));
        }
        return list;
    }

    function buildServiceItem(service) {
        const item = document.createElement('li');
        item.id = `hc-item-${deriveIconSlug(service.label)}`;

        item.className = 'hc-item';

        item.append(
            buildIcon(service),
            buildLabel(service.label),
            buildStatusBadge(service.status ?? Status.PENDING)
        );
        return item;
    }

    // ─── Icon Helpers ─────────────────────────────────────────────────────────

    /**
     * Derives a dashboard-icons CDN slug from the service label.
     * e.g. "QbitTorrent" → "qbittorrent", "Pi-hole" → "pi-hole"
     */
    function deriveIconSlug(label) {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function buildIcon(service) {
        if (service.icon) {
            const span = document.createElement('span');
            span.className   = 'hc-icon hc-icon--emoji';
            span.textContent = service.icon;
            return span;
        }

        const slug = deriveIconSlug(service.label);
        const img  = document.createElement('img');
        img.className = 'hc-icon hc-icon--cdn-icon';
        img.width     = 28;
        img.height    = 28;
        img.alt       = '';
        img.src       = `${DASHBOARD_ICONS_CDN_BASE}/${slug}.png`;
        img.onerror   = () => {
            // Try walkxcode CDN as secondary fallback
            const fallbackImg = document.createElement('img');
            fallbackImg.className = img.className;
            fallbackImg.width     = 28;
            fallbackImg.height    = 28;
            fallbackImg.alt       = '';
            fallbackImg.src       = `${DASHBOARD_ICONS_CDN_FALLBACK}/${slug}.png`;
            fallbackImg.onerror   = () => fallbackImg.replaceWith(buildFallbackIcon());
            img.replaceWith(fallbackImg);
        };
        return img;
    }

    function buildFallbackIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'hc-icon hc-icon--fallback');
        svg.setAttribute('width', '28');
        svg.setAttribute('height', '28');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        // Server rack icon
        svg.innerHTML = `
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
        `;
        return svg;
    }

    function buildLabel(text) {
        const span = document.createElement('span');
        span.className   = 'hc-label';
        span.textContent = text;
        return span;
    }

    function buildStatusBadge(status) {
        const span = document.createElement('span');
        span.className   = `hc-badge hc-badge--${status}`;
        span.textContent = badgeText(status);
        return span;
    }

    function badgeText(status) {
        const map = {
            [Status.PENDING]: 'Checking…',
            [Status.UP]:      'Online',
            [Status.DOWN]:    'Offline',
        };
        return map[status] ?? 'Unknown';
    }

    // ─── DOM Updates ──────────────────────────────────────────────────────────

    function updateServiceStatus(label, status) {
        const item = document.getElementById(`hc-item-${deriveIconSlug(label)}`);
        if (!item) return;
        const badge = item.querySelector('.hc-badge');
        if (!badge) return;
        badge.className   = `hc-badge hc-badge--${status}`;
        badge.textContent = badgeText(status);
    }

    // ─── Exports ──────────────────────────────────────────────────────────────

    return { init, destroy };

})();
