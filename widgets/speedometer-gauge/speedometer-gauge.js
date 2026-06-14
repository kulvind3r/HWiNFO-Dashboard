/**
 * SpeedometerGauge Widget
 * 
 * A speedometer-style arc gauge widget with variable width and gradient colors
 *
 * Configuration Options:
 * - label: string - The label displayed above the gauge
 * - unit: string (default: '') - Unit suffix for the value display
 * - max: number (default: 100) - Maximum value for the scale (min is always 0)
 * - reading: string - The reading label to fetch for the main value
 *
 * Usage:
 *   const widget = new SpeedometerGauge('#my-container', {
 *       label: 'CPU Usage', reading: 'CPU Usage', unit: '%'
 *    });
 *   widget.init();
 */

class SpeedometerGauge extends WidgetBase {

    constructor(containerSelector, config = {}) {
        super(containerSelector, config);

        // Default configuration
        this.config = {
            label: config.label || 'Value',
            unit: config.unit || '',
            max: config.max !== undefined ? config.max : 100,
            reading: config.reading || '',
            ...config
        };

        this.currentValue = 0;
    }

    render() {
        const container = this.container;
        if (!container) {
            console.error(`SpeedometerGauge: Container not found for widget "${this.name}"`);
            return;
        }

        container.className = 'sg-widget';

        // Calculate SVG dimensions and arc parameters
        const svgWidth = 240;
        const svgHeight = 140;
        const centerX = svgWidth / 2;
        const centerY = svgHeight - 20;
        const outerRadius = 100;
        const innerRadiusMin = 8;   // Thin at start
        const innerRadiusMax = 35;   // Thick at end

        // Calculate min/max label positions (outside the gauge, slightly lower)
        const startAngle = Math.PI;
        const endAngle = 0;
        
        const minLabelX = centerX + (outerRadius) * Math.cos(startAngle);
        const minLabelY = 40 + centerY + (outerRadius) * Math.sin(startAngle);
        const maxLabelX = centerX + (outerRadius) * Math.cos(endAngle);
        const maxLabelY = 40 + centerY + (outerRadius) * Math.sin(endAngle);

        container.innerHTML = `
            <div class="sg-label">${this.config.label}</div>
            <div class="sg-gauge-container">
                <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="${this.name}-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#4CAF50" />
                            <stop offset="50%" style="stop-color:#FF9800" />
                            <stop offset="100%" style="stop-color:#F44336" />
                        </linearGradient>
                    </defs>
                    <!-- Background arc -->
                    <path id="${this.name}-gauge-bg" class="sg-gauge-arc sg-gauge-arc-bg" stroke-width="${innerRadiusMax}" />
                    <!-- Fill arc -->
                    <path id="${this.name}-gauge-fill" class="sg-gauge-arc sg-gauge-arc-fill" stroke="url(#${this.name}-gauge-gradient)" stroke-width="${innerRadiusMax}" />
                    <!-- Min label with unit -->
                    <text x="${minLabelX.toFixed(1)}" y="${minLabelY.toFixed(1)}" class="sg-min-label" text-anchor="middle">0 ${this.config.unit}</text>
                    <!-- Max label with unit -->
                    <text x="${maxLabelX.toFixed(1)}" y="${maxLabelY.toFixed(1)}" class="sg-max-label" text-anchor="middle">${this.config.max} ${this.config.unit}</text>
                    <!-- Current value overlayed in center of gauge -->
                    <text x="${centerX}" y="${centerY}" class="sg-value" id="${this.name}-value" text-anchor="middle">0</text>
                    <text x="${centerX}" y="${centerY + 22}" class="sg-unit" id="${this.name}-unit" text-anchor="middle">${this.config.unit}</text>
                </svg>
            </div>
        `;

        // Set up the background arc path
        this._setupArcPath();

        // Initial update to set the gauge to 0
        this._updateGauge(0);
    }

    _setupArcPath() {
        const svgWidth = 240;
        const svgHeight = 140;
        const centerX = svgWidth / 2;
        const centerY = svgHeight - 20;
        const outerRadius = 100;
        const innerRadiusMax = 35;

        // Create the full arc path for background
        const startAngle = Math.PI;
        const endAngle = 0;
        const startX = centerX + outerRadius * Math.cos(startAngle);
        const startY = centerY + outerRadius * Math.sin(startAngle);
        const endX = centerX + outerRadius * Math.cos(endAngle);
        const endY = centerY + outerRadius * Math.sin(endAngle);

        const arcPath = `M ${startX} ${startY} A ${outerRadius} ${outerRadius} 0 0 1 ${endX} ${endY}`;

        const bgPath = document.getElementById(`${this.name}-gauge-bg`);
        const fillPath = document.getElementById(`${this.name}-gauge-fill`);

        if (bgPath) {
            bgPath.setAttribute('d', arcPath);
        }

        if (fillPath) {
            fillPath.setAttribute('d', arcPath);
        }

        // Store arc parameters for updates
        this._arcParams = {
            centerX,
            centerY,
            outerRadius,
            innerRadiusMax,
            startAngle,
            endAngle,
            arcPath
        };
    }

    _updateGauge(value) {
        const fillPath = document.getElementById(`${this.name}-gauge-fill`);
        const valueEl = document.getElementById(`${this.name}-value`);

        if (!fillPath || !valueEl) return;

         // Clamp value between 0 and max
        const clampedValue = Math.max(0, Math.min(this.config.max, value));
        const percent = this.config.max > 0 ? (clampedValue / this.config.max) : 0;

         // Calculate the arc length and set dashoffset
        const { outerRadius, startAngle, endAngle } = this._arcParams;
        const totalAngle = startAngle - endAngle;
        const fillAngle = totalAngle * percent;
        const arcLength = outerRadius * totalAngle;
        const fillLength = outerRadius * fillAngle;

         // Set up dasharray and dashoffset for the fill
        fillPath.style.strokeDasharray = `${arcLength}`;
        fillPath.style.strokeDashoffset = `${arcLength - fillLength}`;

         // Update value display (SVG text element)
        valueEl.textContent = clampedValue.toFixed(1);

        this.currentValue = value;
    }

    _findReading(readings, label) {
        if (!label || !readings) return null;
        const reading = readings.find(r =>
            r.labelUser === label || r.labelOriginal === label
        );
        return reading || null;
    }

    update(data) {
        // Accept the full server data object and extract readings automatically
        const readings = (data && data.hwinfo && data.hwinfo.readings) ? data.hwinfo.readings : [];

        // Extract main value from reading label
        if (this.config.reading) {
            const mainReading = this._findReading(readings, this.config.reading);
            if (mainReading) {
                this._updateGauge(mainReading.value);
            }
        }
    }
}

// Register the widget class globally
if (typeof window !== 'undefined') {
    window.SpeedometerGauge = SpeedometerGauge;
}
