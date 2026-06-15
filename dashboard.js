/**
 * Dashboard Controller
 *
 * Loads widget configurations from config.js and initializes widgets dynamically.
 * Automatically updates all registered widgets by passing the server data.
 */

// Server configuration - configurable via UI and config.js
let serverURL = 'http://localhost:9000/json.json';
let refreshIntervalSeconds = 3;

/**
 * Widget Type Map - Maps widget type strings (directory names) to class names
 */
const WidgetTypeMap = {
    'vertical-bar-graph': VerticalBarGraph,
    '2d-pie-chart': PieChart2D,
    'line-graph': LineGraph,
    'speedometer-gauge': SpeedometerGauge,
    'card': Card
};

/**
 * Apply settings from the UI input fields
 */
function applySettings() {
    const urlInput = document.getElementById('server-url');
    const intervalInput = document.getElementById('refresh-interval');
    const statusEl = document.getElementById('dashboard-status');
     
    // Update server URL
    if (urlInput && urlInput.value.trim()) {
        serverURL = urlInput.value.trim();
    }
     
    // Update refresh interval
    if (intervalInput && intervalInput.value) {
        const interval = parseInt(intervalInput.value, 10);
        if (interval >= 1) {
            refreshIntervalSeconds = interval;
        }
    }
     
    // Restart auto-refresh if enabled
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    if (autoRefreshCheckbox && autoRefreshCheckbox.checked) {
        startAutoRefresh();
    }
     
    // Fetch data with new settings
    fetchData();
     
    // Show confirmation
    if (statusEl) {
        statusEl.textContent = `Settings applied. Server: ${serverURL}, Interval: ${refreshIntervalSeconds}s`;
        statusEl.className = 'dashboard-status success';
    }
}

/**
 * Create a widget instance based on type and configuration
 * @param {string} type - The widget type (matches directory name in WidgetTypeMap)
 * @param {string} id - The widget ID (used as container selector)
 * @param {Object} config - The widget configuration object
 * @returns {WidgetBase} The instantiated widget
 */
function createWidget(type, id, config) {
    const WidgetClass = WidgetTypeMap[type];
    if (!WidgetClass) {
        console.error(`Unknown widget type: "${type}". Available types: ${Object.keys(WidgetTypeMap).join(', ')}`);
        return null;
    }
    
    // Ensure the config has the name set to the id if not provided
    if (!config.name) {
        config.name = id;
    }
    
    return new WidgetClass(`#${id}`, config);
}

/**
 * Load widget configuration from the dashboardConfig variable in config.js
 * @returns {Object} The configuration object
 */
function loadConfig() {
    if (typeof dashboardConfig === 'undefined') {
        console.error('dashboardConfig is not defined. Ensure config.js is loaded before dashboard.js.');
        return { widgets: [] };
    }
    return dashboardConfig;
}

/**
 * Initialize all dashboard widgets from configuration
 */
function initWidgets() {
    const config = loadConfig();
    const widgets = config.widgets || [];
    
    // Sort widgets by 'order' value to ensure correct display order
    // Widgets with 'order' come first (sorted by order value), then widgets without 'order'
    const sortedWidgets = widgets.sort((a, b) => {
        const aHasOrder = a.order !== undefined && a.order !== null && typeof a.order === 'number';
        const bHasOrder = b.order !== undefined && b.order !== null && typeof b.order === 'number';
        
        if (aHasOrder && bHasOrder) {
            return a.order - b.order; // Both have order: sort numerically
        }
        if (aHasOrder && !bHasOrder) {
            return -1; // a comes first (has order)
        }
        if (!aHasOrder && bHasOrder) {
            return 1; // b comes first (has order)
        }
        return 0; // Neither has order: keep original order
    });
    
    // Store widget instances for card references
    const widgetInstances = {};
    const cardEntries = {}; // Store card config for second pass
    
    // Get the dashboard container
    const dashboardContainer = document.getElementById('dashboard');
    if (!dashboardContainer) {
        console.error('Dashboard container with id "dashboard" not found.');
        return;
    }
    
    // First pass: Create container divs and widget instances
        // Only create container divs for widgets with a numerical "order" value
        // Widgets without "order" are children of card widgets and get their container
        // created by the card widget itself
        // Process widgets in sorted order to respect the 'order' value
    for (const widgetConfig of sortedWidgets) {
        const { id, type, config: widgetConfigData, cardWidgets } = widgetConfig;
        const hasOrder = widgetConfig.order !== undefined && widgetConfig.order !== null && typeof widgetConfig.order === 'number';
        
        // Create container div only for widgets with an order value
        // (standalone widgets and cards)
        if (hasOrder) {
            let container = document.getElementById(id);
            if (!container) {
                container = document.createElement('div');
                container.id = id;
                container.className = 'widget-container';
                dashboardContainer.appendChild(container);
             }
         }
        
        if (type === 'card') {
            // For card widgets, create the card instance
            const cardConfig = widgetConfigData || {};
            if (!cardConfig.name) {
                cardConfig.name = id;
            }
            if (!cardConfig.title && widgetConfig.title) {
                cardConfig.title = widgetConfig.title;
            }
            const card = new Card(`#${id}`, cardConfig);
            widgetInstances[id] = { widget: card, isCard: true };
            if (hasOrder) {
                cardEntries[id] = { widget: card, cardWidgets, hasOrder: true };
            }
        } else {
            // For regular widgets, create the instance
            const cfg = widgetConfigData || {};
            if (!cfg.name) {
                cfg.name = id;
            }
            const widget = createWidget(type, id, cfg);
            if (widget) {
                widgetInstances[id] = { widget, isCard: false, hasOrder };
            }
        }
    }
    
     // Second pass: Resolve card widget references and add child widgets
    for (const [id, entry] of Object.entries(cardEntries)) {
        const card = entry.widget;
        
        for (const childId of entry.cardWidgets) {
            const childEntry = widgetInstances[childId];
            if (childEntry && childEntry.widget) {
                card.addWidget(childEntry.widget);
             } else {
                console.warn(`Child widget "${childId}" not found for card "${id}"`);
             }
         }
     }
    
     // Third pass: Initialize widgets
     // - Cards with order: init (which inits child widgets)
     // - Non-card widgets with order: init directly
     // - Widgets without order: skip (unless they're children of a card)
    const initializedWidgets = new Set();
    
     // Initialize cards with order first
    for (const [id, entry] of Object.entries(cardEntries)) {
        cardEntries[id].widget.init();
         // Mark child widgets as initialized
        for (const childId of entry.cardWidgets) {
            initializedWidgets.add(childId);
         }
     }
    
     // Initialize standalone widgets with order (that aren't children of cards)
    for (const [id, entry] of Object.entries(widgetInstances)) {
        if (!entry.isCard && entry.hasOrder && !initializedWidgets.has(id)) {
            entry.widget.init();
         }
     }
}

/**
 * Fetch sensor data from the server
 */
async function fetchData() {
    const statusEl = document.getElementById('dashboard-status');
     
    try {
        const response = await fetch(serverURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
         
        const data = await response.json();
        updateDashboard(data);
         
        if (statusEl) {
            statusEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            statusEl.className = 'dashboard-status success';
        }
    } catch (error) {
        console.error('Failed to fetch data:', error);
        if (statusEl) {
            statusEl.textContent = `Error: ${error.message}`;
            statusEl.className = 'dashboard-status error';
        }
    }
}

/**
 * Update all widgets with data from the server
 * Automatically passes the data to each registered widget
 * @param {Object} data - The JSON data from the server
 */
function updateDashboard(data) {
    WidgetRegistry.getAll().forEach(widget => {
        widget.update(data);
    });
}

/**
 * Auto-refresh control (module-level for accessibility by applySettings)
 */
let refreshIntervalTimer = null;

function startAutoRefresh() {
    if (refreshIntervalTimer) clearInterval(refreshIntervalTimer);
    refreshIntervalTimer = setInterval(() => {
        fetchData();
    }, refreshIntervalSeconds * 1000); // Refresh using configurable interval
}

function stopAutoRefresh() {
    if (refreshIntervalTimer) {
        clearInterval(refreshIntervalTimer);
        refreshIntervalTimer = null;
    }
}

/**
 * Initialize the dashboard
 */
function initDashboard() {
    // Apply configuration from config.js
    const config = loadConfig();
    if (config.title) {
        // Update the <title> tag
        const titleEl = document.querySelector('title[data-configurable="title"]');
        if (titleEl) {
            titleEl.textContent = config.title;
        }
        // Update all <h1> elements with configurable attribute
        document.querySelectorAll('h1[data-configurable="title"]').forEach(el => {
            el.textContent = config.title;
        });
    }
    if (config.serverUrl) {
        serverURL = config.serverUrl;
        const urlInput = document.getElementById('server-url');
        if (urlInput) {
            urlInput.value = config.serverUrl;
        }
    }

    // Initialize widgets from config
    initWidgets();
     
    // Fetch initial data
    fetchData();
     
    // Setup auto-refresh
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
     
    if (autoRefreshCheckbox) {
        if (autoRefreshCheckbox.checked) {
            startAutoRefresh();
        }
         
        autoRefreshCheckbox.addEventListener('change', function() {
            if (this.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
