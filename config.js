/**
 * Dashboard Configuration
 * 
 * Defines all widgets and their configurations for the dashboard.
 * This file is loaded directly via a <script> tag in the HTML.
 */

const dashboardConfig = {
    title: "Acer Aspire R3 - 131T",
    serverUrl: "http://remotehwinfo.homelab.lan/json.json",
    widgets: [
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
            id: "widget-cpu-clock",
            type: "speedometer-gauge",
            config: {
                name: "cpu-clock",
                label: "CPU Speed",
                reading: "Core 0 Clock",
                unit: "MHz",
				min: 880,
                max: 2560
            }
        },
        {
            id: "cpu-card",
            type: "card",
            order: 1,
            config: {
                name: "cpu-card",
                title: "Intel Pentium N 3710"
            },
            cardWidgets: ["widget-cpu-clock", "widget-cpu-usage"]
        },
		{
            id: "widget-core0-throttling",
            type: "text-value",
            config: {
                name: "core0-throttling",
                label: "Core 0",
                reading: "Core 0 Thermal Throttling",
                unit: "Yes/No",
				yesValueColor: 'red',
				noValueColor: 'green'
            }
        },
		{
            id: "widget-core1-throttling",
            type: "text-value",
            config: {
                name: "core1-throttling",
                label: "Core 1",
                reading: "Core 1 Thermal Throttling",
                unit: "Yes/No",
				yesValueColor: 'red',
				noValueColor: 'green'
            }
        },
		{
            id: "widget-core2-throttling",
            type: "text-value",
            config: {
                name: "core2-throttling",
                label: "Core 2",
                reading: "Core 2 Thermal Throttling",
                unit: "Yes/No",
				yesValueColor: 'red',
				noValueColor: 'green'
            }
        },
		{
            id: "widget-core3-throttling",
            type: "text-value",
            config: {
                name: "core3-throttling",
                label: "Core 3",
                reading: "Core 3 Thermal Throttling",
                unit: "Yes/No",
				yesValueColor: 'red',
				noValueColor: 'green'
            }
        },
		{
            id: "cpu-throttle-card",
            type: "card",
            order: 2,
            config: {
                name: "cpu-throttle-card",
                title: "CPU Throttling"
            },
            cardWidgets: ["widget-core0-throttling", "widget-core1-throttling", "widget-core2-throttling", "widget-core3-throttling"]
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
				min: 400,
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
            id: "widget-ram-usage",
            type: "vertical-bar-graph",
            config: {
                name: "ram-usage",
                label: "RAM",
                reading: "RAM Usage",
                invertColors: false,
                unit: "%",
                min: 0,
                max: 100
            }
        },
		{
            id: "widget-ram-used",
            type: "text-value",
            config: {
                name: "ram-used",
                label: "Used",
                reading: "Physical Memory Used",
                unit: " MB",
            }
        },
		{
            id: "widget-ram-available",
            type: "text-value",
            config: {
                name: "ram-available",
                label: "Available",
                reading: "Physical Memory Available",
                unit: " MB",
            }
        },
		{
			id: "ram-card",
            type: "card",
            order: 4,
            config: {
                name: "ram-card",
                title: "Memory"
            },
            cardWidgets: ["widget-ram-usage", "widget-ram-used", "widget-ram-available"]
		},
		{
            id: "widget-cpu-temp",
            type: "vertical-bar-graph",
            config: {
                name: "cpu-temp",
                label: "CPU Core Temp",
                reading: "CPU Temp",
                invertColors: false,
                unit: "°C",
                min: 0,
                max: 70
            }
        },
		{
            id: "widget-drive-temp",
            type: "text-value",
            config: {
                name: "drive-temp",
                label: "Disk Drive Temp",
                reading: "Drive Temperature",
                unit: "°C",
            }
        },
		{
            id: "widget-ambient-temp",
            type: "text-value",
            config: {
                name: "ambient-temp",
                label: "Ambient Chasis Temp",
                reading: "Ambient local temp sensor",
                unit: "°C",
            }
        },
		{
			id: "temp-card",
            type: "card",
            order: 5,
            config: {
                name: "temp-card",
                title: "Temperature"
            },
            cardWidgets: ["widget-cpu-temp", "widget-drive-temp", "widget-ambient-temp"]
		},
		{
			id: "widget-system-uptime",
			type: "text-value",
			config: {
				name: "system-uptime",
				label: "UpTime",
				reading: "UpTime",
				unit: "days"
			}
		},
        {
            id: "widget-battery-charge",
            type: "vertical-bar-graph",
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
			id: "uptime-card",
            type: "card",
            order: 6,
            config: {
                name: "updtime-card",
                title: "System UpTime",
				layout: "2-equal-rows"
            },
            cardWidgets: ["widget-battery-charge", "widget-system-uptime"]
		},
        {
            id: "widget-network-download",
            type: "line-graph",
            config: {
                name: "network-download",
                label: "Download",
                reading: "Current DL rate",
                unit: "MBps",
                min: 0,
                max: 10
            }
        },
		{
            id: "widget-network-upload",
            type: "line-graph",
            config: {
                name: "network-upload",
                label: "Upload",
                reading: "Current UP rate",
                unit: "MBps",
                min: 0,
                max: 10
            }
        },
		{
            id: "net-activity-card",
            type: "card",
            order: 7,
            config: {
                name: "net-activity-card",
                title: "Network"
            },
            cardWidgets: ["widget-network-download", "widget-network-upload"]
        },
		{
            id: "widget-disk-read",
            type: "line-graph",
            config: {
                name: "disk-read",
                label: "Disk Read",
                reading: "Read Activity",
                unit: "%",
                min: 0,
                max: 100
            }
        },
		{
            id: "widget-disk-write",
            type: "line-graph",
            config: {
                name: "disk-write",
                label: "Disk Write",
                reading: "Write Activity",
                unit: "%",
                min: 0,
                max: 100
            }
        },
		{
            id: "disk-activity-card",
            type: "card",
            order: 8,
            config: {
                name: "disk-activity-card",
                title: "Disk Activity"
            },
            cardWidgets: ["widget-disk-read", "widget-disk-write"]
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
            id: "widget-drive-health",
            type: "text-value",
            config: {
                name: "drive-health",
                label: "Drive Health",
                reading: "Drive Remaining Life",
                unit: "%",
            }
        },
        {
            id: "disk-status-card",
            type: "card",
            order: 9,
            config: {
                name: "disk-status-card",
                title: "Disk Usage",
				layout: "2-columns"
            },
            cardWidgets: ["widget-drive-c", "widget-drive-d"]
        }
    ]
};
