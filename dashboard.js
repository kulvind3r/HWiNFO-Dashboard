/**
 * Dashboard Controller
 * 
 * Initializes widgets and fetches sensor data from the server.
 * Automatically updates all registered widgets by passing the server data.
 */

// Server configuration - now configurable via UI
let serverURL = 'http://10.0.0.1:9000/json.json';
let refreshIntervalSeconds = 3;

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

    new LineGraph('#widget-network-download', {
        name: 'network-download',
        label: 'Network',
        reading: 'Current DL rate',
        unit: 'MBps',
        min: 0,
        max: 10
    });
    
    new PieChart2D('#widget-drive-d', {
        label: 'Disk - D: Free Space',
        reading: 'D: Free Space',
        unit: 'GB',
        readingColor: '#D3D3D3',
        readingLabel: 'Free',
        remainingColor: '#7393B3',
        remainingLabel: 'Used',
        max: 395
    });

    // Initialize all registered widgets
    WidgetRegistry.getAll().forEach(w => w.init());
}

const storageWidgetC = new PieChart2D('#widget-drive-d', {
    label: 'Drive C',
    reading: 'C: Free Space',
    unit: 'GB',
    readingColor: '#D3D3D3',
    readingLabel: 'Free',
    remainingColor: '#7393B3',
    remainingLabel: 'Used',
    max: 50
});

const storageWidgetD = new PieChart2D('#widget-drive-d', {
    label: 'Drive D',
    reading: 'D: Free Space',
    unit: 'GB',
    readingColor: '#D3D3D3',
    readingLabel: 'Free',
    remainingColor: '#7393B3',
    remainingLabel: 'Used',
    max: 395
});

const storageCard = new Card('#storage-card', {title: 'Storage'});
storageCard.addWidget(storageWidgetC);
storageCard.addWidget(storageWidgetD);
storageCard.init();

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

const gpuCard = new Card('#gpu-card', {title: 'Intel HD Graphics'});
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

const cpuCard = new Card('#cpu-card', {title: 'Intel Pentium N 3710'});
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
     // Initialize widgets
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
