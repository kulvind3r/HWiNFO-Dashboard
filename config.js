/**
 * Dashboard Configuration
 * 
 * Defines all widgets and their configurations for the dashboard.
 * This file is loaded directly via a <script> tag in the HTML.
 */

const dashboardConfig = {
    title: "Acer Aspire R3 - 131T",
    serverUrl: "http://10.0.0.1:9000/json.json",
    widgets: [
        {
            id: "widget-ram-usage",
            type: "vertical-bar-graph",
            order: 1,
            config: {
                name: "ram-usage",
                label: "RAM",
                reading: "RAM Usage",
                invertColors: false,
                unit: "%",
                min: 0,
                max: 100,
                leftLabel: "Used",
                leftUnit: " MB",
                leftReading: "Physical Memory Used",
                rightLabel: "Available",
                rightUnit: " MB",
                rightReading: "Physical Memory Available"
            }
        },
        {
            id: "widget-battery-charge",
            type: "vertical-bar-graph",
            order: 2,
            config: {
                name: "battery-charge",
                label: "Battery",
                reading: "Battery Level",
                invertColors: true,
                unit: "%",
                min: 0,
                max: 100
            }
        },
        {
            id: "widget-network-download",
            type: "line-graph",
            order: 5,
            config: {
                name: "network-download",
                label: "Network",
                reading: "Current DL rate",
                unit: "MBps",
                min: 0,
                max: 10
            }
        },
        {
            id: "widget-drive-d",
            type: "2d-pie-chart",
            config: {
                name: "widget-drive-d",
                label: "Drive D",
                reading: "D: Free Space",
                unit: "GB",
                readingColor: "#D3D3D3",
                readingLabel: "Free",
                remainingColor: "#7393B3",
                remainingLabel: "Used",
                max: 395
            }
        },
        {
            id: "widget-drive-c",
            type: "2d-pie-chart",
            config: {
                name: "widget-drive-c",
                label: "Drive C",
                reading: "C: Free Space",
                unit: "GB",
                readingColor: "#D3D3D3",
                readingLabel: "Free",
                remainingColor: "#7393B3",
                remainingLabel: "Used",
                max: 50
            }
        },
        {
            id: "storage-card",
            type: "card",
            order: 6,
            config: {
                name: "storage-card",
                title: "Storage"
            },
            cardWidgets: ["widget-drive-c", "widget-drive-d"]
        },
        {
            id: "widget-gpu-usage",
            type: "vertical-bar-graph",
            config: {
                name: "gpu-usage",
                label: "GPU Usage",
                reading: "GPU D3D Usage",
                invertColors: false,
                unit: "%",
                min: 0,
                max: 100
            }
        },
        {
            id: "widget-gpu-clock",
            type: "speedometer-gauge",
            config: {
                name: "gpu-clock",
                label: "GPU Speed",
                reading: "GPU Clock",
                unit: "MHz",
                max: 800
            }
        },
        {
            id: "gpu-card",
            type: "card",
            order: 3,
            config: {
                name: "gpu-card",
                title: "Intel HD Graphics"
            },
            cardWidgets: ["widget-gpu-usage", "widget-gpu-clock"]
        },
        {
            id: "widget-cpu-usage",
            type: "vertical-bar-graph",
            config: {
                name: "cpu-usage",
                label: "CPU Usage",
                reading: "CPU Usage",
                invertColors: false,
                unit: "%",
                min: 0,
                max: 100
            }
        },
        {
            id: "widget-cpu-temp",
            type: "vertical-bar-graph",
            config: {
                name: "cpu-temp",
                label: "CPU Temp",
                reading: "CPU Temp",
                invertColors: false,
                unit: "°C",
                min: 0,
                max: 70
            }
        },
        {
            id: "widget-cpu-clock",
            type: "speedometer-gauge",
            config: {
                name: "cpu-clock",
                label: "CPU Speed",
                reading: "Core 0 Clock",
                unit: "MHz",
                max: 2560
            }
        },
        {
            id: "cpu-card",
            type: "card",
            order: 4,
            config: {
                name: "cpu-card",
                title: "Intel Pentium N 3710"
            },
            cardWidgets: ["widget-cpu-clock", "widget-cpu-usage", "widget-cpu-temp"]
        }
    ]
};
