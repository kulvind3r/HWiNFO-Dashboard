/**
 * VerticalBarGraph Widget
 * 
 * A vertical bar graph widget that displays a percentage value with color-coded fill.
 * The widget automatically extracts values from the server data using reading labels.
 *
 * Configuration Options:
 *     - label: string - The label displayed above the graph
 *     - unit: string (default: '%') - Unit suffix for the value display (e.g., '%', '°C', 'MB')
 *     - invertColors: boolean (default: false) - If true, 0% = red and 100% = green
 *                                                If false, 0% = green and 100% = red
 *     - min: number (default: 0) - Minimum value for the scale
 *     - max: number (default: 100) - Maximum value for the scale
 *     - showGrid: boolean (default: true) - Whether to show grid lines
 *     - reading: string - The labelUser for the reading in remotehwinfo Server JSON to fetch for the main value
 *     - leftLabel: string - Label for the left text field (leave empty to hide)
 *     - leftUnit: string - Unit for the left text field
 *     - leftReading: string - The reading label to fetch for the left text field value
 *     - rightLabel: string - Label for the right text field (leave empty to hide)
 *     - rightUnit: string - Unit for the right text field
 *     - rightReading: string - The reading label to fetch for the right text field value
 *
 * Usage:
 *   const widget = new VerticalBarGraph('#my-container', {
 *       label: 'RAM', reading: 'RAM Usage', unit: '%',
 *       leftLabel: 'Used', leftUnit: 'MB', leftReading: 'Physical Memory Used',
 *       rightLabel: 'Available', rightUnit: 'MB', rightReading: 'Physical Memory Available'
 *   });
 *   widget.init();
 *   // The dashboard automatically calls widget.update(data) periodically
 */

class VerticalBarGraph extends WidgetBase {

    constructor(containerSelector, config = {}) {
        super(containerSelector, config);

        // Default configuration
        this.config = {
            label: config.label || 'Value',
            unit: config.unit || '%',
            invertColors: config.invertColors || false,
            min: config.min !== undefined ? config.min : 0,
            max: config.max !== undefined ? config.max : 100,
            showGrid: config.showGrid !== undefined ? config.showGrid : true,
            reading: config.reading || '',
            leftLabel: config.leftLabel || '',
            leftUnit: config.leftUnit || '',
            leftReading: config.leftReading || '',
            rightLabel: config.rightLabel || '',
            rightUnit: config.rightUnit || '',
            rightReading: config.rightReading || '',
            ...config
        };

        this.currentValue = 0;
        this.leftValue = 0;
        this.rightValue = 0;
    }

    render() {
        const container = this.container;
        if (!container) {
            console.error(`VerticalBarGraph: Container not found for widget "${this.name}"`);
            return;
        }

        const gridLines = this.config.showGrid ? this._generateGridLines() : '';
        const invertedClass = this.config.invertColors ? ' inverted' : '';

        container.className = `vbg-widget${invertedClass}`;
        const leftFieldHtml = this.config.leftLabel
             ? `<div class="vbg-text-field vbg-left-field">
                  <div class="vbg-text-field-label">${this.config.leftLabel}</div>
                  <div class="vbg-text-field-value" id="${this.name}-left-value">0${this.config.leftUnit}</div>
                </div>`
             : '';
        const rightFieldHtml = this.config.rightLabel
             ? `<div class="vbg-text-field vbg-right-field">
                  <div class="vbg-text-field-label">${this.config.rightLabel}</div>
                  <div class="vbg-text-field-value" id="${this.name}-right-value">0${this.config.rightUnit}</div>
                </div>`
             : '';

        container.innerHTML = `
                 <div class="vbg-label">${this.config.label}</div>
                 <div class="vbg-graph-container">
                     ${gridLines}
                     <div class="vbg-bar" id="${this.name}-bar"></div>
                 </div>
                 <div class="vbg-value" id="${this.name}-value">0${this.config.unit}</div>
                 <div class="vbg-text-fields-container">
                     ${leftFieldHtml}
                     ${rightFieldHtml}
                 </div>
             `;

        // Initial update to set the bar to 0
        this._updateBar(0);
    }

    _generateGridLines() {
        const lines = [];
        const steps = 5;
        for (let i = 1; i < steps; i++) {
            const topPercent = (i / steps) * 100;
            lines.push(`<div class="vbg-grid-line" style="top: ${topPercent}%"></div>`);
        }
        return `<div class="vbg-grid">${lines.join('')}</div>`;
    }

    _getColorClass(percent) {
        // percent is 0-100
        if (this.config.invertColors) {
            // Inverted: 0% = red, 50% = yellow, 100% = green
            if (percent <= 50) {
                return 'color-red';
            } else {
                return 'color-green';
            }
        } else {
            // Normal: 0% = green, 50% = yellow, 100% = red
            if (percent <= 50) {
                return 'color-green';
            } else {
                return 'color-red';
            }
        }
    }

    _getIntermediateColor(percent) {
        // For smoother transitions, use yellow in the middle range
        if (percent >= 35 && percent <= 65) {
            return 'color-yellow';
        }
        return this._getColorClass(percent);
    }

    _updateBar(value) {
        const bar = document.getElementById(`${this.name}-bar`);
        const valueEl = document.getElementById(`${this.name}-value`);

        if (!bar || !valueEl) return;

        // Clamp value between min and max
        const clampedValue = Math.max(this.config.min, Math.min(this.config.max, value));
        const percent = ((clampedValue - this.config.min) / (this.config.max - this.config.min)) * 100;

        // Determine color class
        let colorClass;
        if (percent < 35) {
            colorClass = this.config.invertColors ? 'color-red' : 'color-green';
        } else if (percent <= 65) {
            colorClass = 'color-yellow';
        } else {
            colorClass = this.config.invertColors ? 'color-green' : 'color-red';
        }

        // Remove old color classes and add new one
        bar.classList.remove('color-green', 'color-yellow', 'color-red');
        bar.classList.add(colorClass);

        // Update bar height
        bar.style.height = `${percent}%`;

        // Update value display
        valueEl.textContent = `${clampedValue.toFixed(1)} ${this.config.unit}`;

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
                this._updateBar(mainReading.value);
            }
        }

        // Update left text field from reading label
        if (this.config.leftReading) {
            const leftReading = this._findReading(readings, this.config.leftReading);
            if (leftReading) {
                this.leftValue = leftReading.value;
                const leftEl = document.getElementById(`${this.name}-left-value`);
                if (leftEl) {
                    leftEl.textContent = `${this.leftValue} ${this.config.leftUnit}`;
                }
            }
        }

        // Update right text field from reading label
        if (this.config.rightReading) {
            const rightReading = this._findReading(readings, this.config.rightReading);
            if (rightReading) {
                this.rightValue = rightReading.value;
                const rightEl = document.getElementById(`${this.name}-right-value`);
                if (rightEl) {
                    rightEl.textContent = `${this.rightValue} ${this.config.rightUnit}`;
                }
            }
        }
    }
}

// Register the widget class globally
if (typeof window !== 'undefined') {
    window.VerticalBarGraph = VerticalBarGraph;
}
