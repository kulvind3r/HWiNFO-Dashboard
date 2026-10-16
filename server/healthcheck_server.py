"""
HWiNFO Dashboard — Healthcheck Service
---------------------------------------
Polls local services defined in healthcheck_config.json and exposes
their status at GET /api/health for the Caddy-proxied dashboard.

Requirements: Python 3.8+ (stdlib only — no pip installs needed)
Run:          python healthcheck_server.py
Service:      Use install-service.bat (NSSM) to run permanently on Windows
"""

import json
import os
import socket
import ssl
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, 'healthcheck_config.json')

def _load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

_startup_config    = _load_config()
PORT               = int(_startup_config.get('port', 47731))   # port is fixed at startup
PROBE_TIMEOUT_SECS = 5

# ── Shared state ──────────────────────────────────────────────────────────────

_cache_lock   = threading.Lock()
_cached_result = None  # None until first probe completes

# ── Probing ───────────────────────────────────────────────────────────────────

def _probe_service(service):
    """
    Probe a single service. Probe type is determined by the optional 'type'
    field in the service config (defaults to 'http' if omitted):

      http / https (default)
        HTTP HEAD request. Any HTTP response (including 4xx/5xx) is UP —
        a reply means the process is reachable. Only network-level failures
        (connection refused, timeout, DNS error) are DOWN.
        SSL certificate verification is disabled for homelab self-signed certs.

      ssh
        TCP socket connect to host:port (default port 22). A successful
        connection means sshd is listening — no authentication is attempted.

    Returns the service dict with 'status' set to 'up' or 'down'.
    """
    probe_type = service.get('type', 'http').lower()

    if probe_type == 'ssh':
        host = service.get('host', 'localhost')
        port = int(service.get('port', 22))
        try:
            with socket.create_connection((host, port), timeout=PROBE_TIMEOUT_SECS):
                status = 'up'
        except Exception:
            status = 'down'
        return {**service, 'status': status}

    # Default: HTTP / HTTPS
    url = service.get('url', '').strip()
    if not url:
        return {**service, 'status': 'down'}

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode    = ssl.CERT_NONE

    try:
        req = urllib.request.Request(url, method='HEAD')
        urllib.request.urlopen(req, timeout=PROBE_TIMEOUT_SECS, context=ssl_ctx)
        status = 'up'
    except urllib.error.HTTPError:
        # Server replied with an HTTP error code (4xx/5xx) — it's still up
        status = 'up'
    except Exception:
        # Network-level failure: connection refused, timeout, DNS error, etc.
        status = 'down'

    return {**service, 'status': status}


def _probe_all_services(services: list) -> list:
    """Probe all services in parallel, preserving config order in results."""
    results: list = [None] * len(services)

    def _worker(idx: int, svc: dict) -> None:
        results[idx] = _probe_service(svc)

    threads = [
        threading.Thread(target=_worker, args=(i, svc), daemon=True)
        for i, svc in enumerate(services)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=PROBE_TIMEOUT_SECS + 1)

    return results


def _background_poller():
    """Continuously probes all services and updates the shared cache.
    Reloads healthcheck_config.json on every cycle so service list and
    interval changes take effect without restarting the service."""
    global _cached_result
    while True:
        try:
            cfg = _load_config()
        except Exception as exc:
            print(f'[HWiNFO-Dashboard] Failed to reload config, retrying in 30s: {exc}')
            time.sleep(30)
            continue

        services = cfg.get('services', [])
        interval = int(cfg.get('checkIntervalSeconds', 30))

        results = _probe_all_services(services)
        payload = {
            'checkIntervalSeconds': interval,
            'services':             results,
        }
        with _cache_lock:
            _cached_result = payload
        time.sleep(interval)

# ── HTTP Handler ──────────────────────────────────────────────────────────────

class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/api/health':
            self.send_response(404)
            self.end_headers()
            return

        with _cache_lock:
            payload = _cached_result

        if payload is None:
            # Still running first probe — ask client to retry shortly
            body = b'{"error":"Service is starting, please retry in a few seconds"}'
            self.send_response(503)
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Retry-After',    str(PROBE_TIMEOUT_SECS + 2))
            self.end_headers()
            self.wfile.write(body)
            return

        body = json.dumps(payload).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type',   'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):  # suppress per-request console noise
        pass

# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print(f'[HWiNFO-Dashboard] Healthcheck service starting on 127.0.0.1:{PORT}')
    print(f'[HWiNFO-Dashboard] Monitoring {len(_startup_config.get("services", []))} service(s) every {_startup_config.get("checkIntervalSeconds", 30)}s')
    print(f'[HWiNFO-Dashboard] Config: {CONFIG_PATH}')

    # Start background poller — first probe runs immediately
    poller = threading.Thread(target=_background_poller, daemon=True)
    poller.start()

    server = HTTPServer(('127.0.0.1', PORT), _Handler)
    print(f'[HWiNFO-Dashboard] Listening. Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[HWiNFO-Dashboard] Shutting down.')
