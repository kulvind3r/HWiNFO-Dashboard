/**
 * Dashboard Controller
 * 
 * Initializes widgets and fetches sensor data from the server.
 * Automatically updates all registered widgets by passing the server data.
 */

// Server configuration
const SERVER_URL = 'http://10.0.0.1:9000/json.json';

/**
 * Initialize all dashboard widgets
 */

function initWidgets() {
    new VerticalBarGraph('#widget-ram-usage', {
        name: 'ram-usage',
        label: 'RAM',
        reading: 'RAM Usage',
        invertColors: false,
        unit: '%',
        min: 0,
        max: 100,
        leftLabel: 'Used',
        leftUnit: ' MB',
        leftReading: 'Physical Memory Used',
        rightLabel: 'Available',
        rightUnit: ' MB',
        rightReading: 'Physical Memory Available'
    });

    new VerticalBarGraph('#widget-battery-charge', {
        name: 'battery-charge',
        label: 'Battery',
        reading: 'Battery Level',
        invertColors: true,
        unit: '%',
        min: 0,
        max: 100
    });

    

    // Initialize all registered widgets
    WidgetRegistry.getAll().forEach(w => w.init());
}

const gpuUsageWidget = new VerticalBarGraph('#widget-gpu-usage', {
    name: 'gpu-usage',
    label: 'GPU Usage',
    reading: 'GPU D3D Usage',
    invertColors: false,
    unit: '%',
    min: 0,
    max: 100
});

const gpuClockWidget = new SpeedometerGauge('#widget-gpu-clock', {
    name: 'gpu-clock',
    label: 'GPU Speed',
    reading: 'GPU Clock',
    unit: 'MHz',
    max: 800
});

const gpuCard = new Card('#gpu-card', {title: 'GPU Stats'});
gpuCard.addWidget(gpuUsageWidget);
gpuCard.addWidget(gpuClockWidget);
gpuCard.init();

const cpuUsageWidget = new VerticalBarGraph('#widget-cpu-usage', {
    name: 'cpu-usage',
    label: 'CPU Usage',
    reading: 'CPU Usage',
    invertColors: false,
    unit: '%',
    min: 0,
    max: 100
});

const cpuTempWidget = new VerticalBarGraph('#widget-cpu-temp', {
    name: 'cpu-temp',
    label: 'CPU Temp',
    reading: 'CPU Temp',
    invertColors: false,
    unit: '°C',
    min: 0,
    max: 70
});

const cpuClockWidget = new SpeedometerGauge('#widget-cpu-clock', {
    name: 'cpu-clock',
    label: 'CPU Speed',
    reading: 'Core 0 Clock',
    unit: 'MHz',
    max: 2560
});

const cpuCard = new Card('#cpu-card', {title: 'CPU Stats'});
cpuCard.addWidget(cpuClockWidget);
cpuCard.addWidget(cpuUsageWidget);
cpuCard.addWidget(cpuTempWidget);
cpuCard.init();

/**
 * Fetch sensor data from the server
 */
async function fetchData() {
    const statusEl = document.getElementById('dashboard-status');
    
    try {
        const response = await fetch(SERVER_URL);
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
 * Initialize the dashboard
 */
function initDashboard() {
     // Initialize widgets
    initWidgets();
    
     // Fetch initial data
    fetchData();
    
     // Setup auto-refresh
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    let refreshInterval = null;
    
    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            fetchData();
         }, 5000); // Refresh every 5 seconds
    }
    
    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
         }
    }
    
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
