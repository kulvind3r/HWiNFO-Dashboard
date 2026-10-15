/**
 * Healthcheck Module
 *
 * Polls configured services and renders two side panels (left/right) beside
 * the main widget grid. Services are split equally between the panels.
 *
 * Activated via dashboardConfig.healthcheck in config.js.
 * Fully isolated — shares no state with the widget system.
 */

const HealthCheckModule = (() => {

    // ─── Constants ────────────────────────────────────────────────────────────

    const DEFAULT_CHECK_INTERVAL_MS  = 30_000;
    const PROBE_TIMEOUT_MS           = 5_000;
    const DASHBOARD_ICONS_CDN_BASE   = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png';

    const Status = Object.freeze({
        PENDING: 'pending',
        UP:      'up',
        DOWN:    'down',
    });

    // ─── State ────────────────────────────────────────────────────────────────

    let pollTimer = null;

    // Tracks the last URL that successfully probed for each service id.
    // Read at click-time so it always reflects the most recent probe result.
    const lastSuccessfulUrls = {};

    // ─── Public API ───────────────────────────────────────────────────────────

    function init(healthcheckConfig) {
        if (!healthcheckConfig?.enabled) return;

        const services = healthcheckConfig.services ?? [];
        if (services.length === 0) return;

        const intervalMs = (healthcheckConfig.checkIntervalSeconds ?? 30) * 1000;

        renderPanels(services);
        probeAll(services);

        pollTimer = setInterval(() => probeAll(services), intervalMs);
    }

    function destroy() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    function renderPanels(services) {
        const leftPanel  = document.getElementById('healthcheck-left');
        const rightPanel = document.getElementById('healthcheck-right');

        if (!leftPanel || !rightPanel) return;

        const midpoint    = Math.ceil(services.length / 2);
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
        item.id = `hc-item-${service.id}`;

        const isNavigable = !!(service.url || service.altUrl);
        item.className = isNavigable ? 'hc-item hc-item--clickable' : 'hc-item';

        if (isNavigable) {
            item.addEventListener('click', () => {
                const target = lastSuccessfulUrls[service.id] ?? service.url ?? service.altUrl;
                if (target) window.open(target, '_blank', 'noopener,noreferrer');
            });
        }

        const icon  = buildIcon(service);
        const label = buildLabel(service.label);
        const badge = buildStatusBadge(Status.PENDING);

        item.append(icon, label, badge);
        return item;
    }

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
            span.className = 'hc-icon hc-icon--emoji';
            span.textContent = service.icon;
            return span;
        }

        const slug = deriveIconSlug(service.label);
        const img  = document.createElement('img');
        img.className = 'hc-icon hc-icon--cdn-icon';
        img.width     = 20;
        img.height    = 20;
        img.alt       = '';
        img.src       = `${DASHBOARD_ICONS_CDN_BASE}/${slug}.png`;
        img.onerror   = () => img.replaceWith(buildFallbackIcon());

        return img;
    }

    function buildFallbackIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'hc-icon hc-icon--fallback');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        // server rack icon (two horizontal rect stacks)
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

    function updateServiceStatus(serviceId, status) {
        const item = document.getElementById(`hc-item-${serviceId}`);
        if (!item) return;

        const badge = item.querySelector('.hc-badge');
        if (!badge) return;

        badge.className   = `hc-badge hc-badge--${status}`;
        badge.textContent = badgeText(status);
    }

    // ─── Probing ──────────────────────────────────────────────────────────────

    async function probeAll(services) {
        await Promise.allSettled(services.map(probeService));
    }

    async function probeService(service) {
        // Try primary URL / SSH first
        const primaryStatus = service.type === 'ssh'
            ? await probeSsh(service)
            : await probeHttp(service);

        if (primaryStatus === Status.UP) {
            lastSuccessfulUrls[service.id] = service.url ?? null;
            updateServiceStatus(service.id, Status.UP);
            return;
        }

        // Fall back to altUrl if defined
        if (service.altUrl) {
            const altStatus = await probeHttp({ ...service, url: service.altUrl });
            if (altStatus === Status.UP) {
                lastSuccessfulUrls[service.id] = service.altUrl;
                updateServiceStatus(service.id, Status.UP);
                return;
            }
        }

        lastSuccessfulUrls[service.id] = null;
        updateServiceStatus(service.id, Status.DOWN);
    }

    async function probeHttp(service) {
        if (!service.url) return Status.DOWN;

        try {
            await fetch(service.url, {
                method: 'HEAD',
                mode:   'no-cors',
                signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
            });
            return Status.UP;
        } catch {
            return Status.DOWN;
        }
    }

    /**
     * SSH probe via opaque HTTP fetch against host:port.
     * SSH will reject the HTTP request but the TCP handshake succeeds,
     * so the browser sees a network-level response (opaque) → UP.
     * A refused/timed-out connection throws TypeError → DOWN.
     */
    async function probeSsh(service) {
        if (!service.host || !service.port) return Status.DOWN;

        try {
            await fetch(`http://${service.host}:${service.port}`, {
                mode:   'no-cors',
                signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
            });
            return Status.UP;
        } catch {
            return Status.DOWN;
        }
    }

    // ─── Exports ──────────────────────────────────────────────────────────────

    return { init, destroy };

})();
