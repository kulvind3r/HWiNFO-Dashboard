/**
 * PieChart2D Widget
 *
 * A simple 2D pie chart that displays only two sections:
 * - Reading value (in readingColor) at the bottom of the chart
 * - Remaining value (max - reading) in remainingColor
 *
 * Configuration Options:
 * - label: string - The label displayed above the chart
 * - unit: string (default: '%') - Unit suffix for the value display
 * - max: number (default: 100) - Maximum value for the scale
 * - reading: string - The labelUser for the reading in remotehwinfo Server JSON to fetch for the main value
 * - readingColor: string - The color for the reading value slice
 * - readingLabel: string - The label for the reading value (shown at bottom)
 * - remainingColor: string - The color for the remaining value slice
 * - remainingLabel: string - The label for the remaining value (shown outside the chart)
 *
 * Usage:
 *   const widget = new PieChart2D('#my-container', {
 *       label: 'Storage',
 *       max: 100,
 *       readingColor: '#FF5722',
 *       readingLabel: 'Current Reading',
 *       remainingColor: '#2196F3',
 *       remainingLabel: 'Remaining'
 *   });
 *   widget.init();
 */

class PieChart2D extends WidgetBase {
    constructor(containerSelector, config = {}) {
        super(containerSelector, config);
        
        // Default configuration
        this.config = {
            label: config.label || 'Value',
            unit: config.unit || '%',
            max: config.max !== undefined ? config.max : 100,
            reading: config.reading || '',
            readingColor: config.readingColor || '#64b5f6',
            readingLabel: config.readingLabel || 'Reading',
            remainingColor: config.remainingColor || '#37474f',
            remainingLabel: config.remainingLabel || 'Remaining',
            ...config
        };
        
        this.currentReading = 0;
    }
    
    render() {
        const container = this.container;
        if (!container) {
            console.error(`PieChart2D: Container not found for widget "${this.name}"`);
            return;
        }
        
        container.className = 'pie-chart-widget';
        container.innerHTML = `
             <div class="pie-chart-label">${this.config.label}</div>
             <div class="pie-chart-container">
                  <svg class="pie-chart-svg" viewBox="0 0 200 200" id="${this.name}-svg">
                      <!-- Pie slices will be rendered here -->
                  </svg>
                  <div class="pie-chart-remaining-indicator" id="${this.name}-remaining-indicator">
                      <span class="pie-chart-remaining-color-dot" id="${this.name}-remaining-dot"></span>
                      <span class="pie-chart-remaining-label-text" id="${this.name}-remaining-label">${this.config.remainingLabel}</span>
                      <span class="pie-chart-remaining-value" id="${this.name}-remaining-value">0</span>
                  </div>
                  <div class="pie-chart-reading-indicator" id="${this.name}-reading-indicator">
                      <span class="pie-chart-reading-color-dot" id="${this.name}-reading-dot"></span>
                      <span class="pie-chart-reading-label-text" id="${this.name}-reading-label">${this.config.readingLabel}</span>
                      <span class="pie-chart-reading-value" id="${this.name}-reading-value">0</span>
                  </div>
              </div>
          `;
        
        // Initial render with empty values
        this._updatePie(0);
    }
    
    _updatePie(readingValue) {
        const svg = document.getElementById(`${this.name}-svg`);
        const readingIndicatorEl = document.getElementById(`${this.name}-reading-indicator`);
        const readingDotEl = document.getElementById(`${this.name}-reading-dot`);
        const readingLabelTextEl = document.getElementById(`${this.name}-reading-label`);
        const readingValueEl = document.getElementById(`${this.name}-reading-value`);
        const remainingIndicatorEl = document.getElementById(`${this.name}-remaining-indicator`);
        const remainingDotEl = document.getElementById(`${this.name}-remaining-dot`);
        const remainingLabelTextEl = document.getElementById(`${this.name}-remaining-label`);
        const remainingValueEl = document.getElementById(`${this.name}-remaining-value`);
        
        if (!svg || !readingIndicatorEl || !remainingIndicatorEl) return;
        
        // Clear existing SVG content
        svg.innerHTML = '';
        
        // Store the current reading
        this.currentReading = readingValue;
        
        // Calculate remaining (max - reading)
        const remaining = Math.max(0, this.config.max - readingValue);
        
        // Render the pie chart with two sections
        this._drawPieChart(svg, readingValue, remaining);
        
        // Update the reading indicator
        if (readingDotEl) {
            readingDotEl.style.backgroundColor = this.config.readingColor;
         }
        if (readingLabelTextEl) {
            readingLabelTextEl.textContent = this.config.readingLabel;
         }
        if (readingValueEl) {
            readingValueEl.textContent = `${readingValue.toFixed(1)} ${this.config.unit}`;
            readingValueEl.style.color = this.config.readingColor;
         }
        
        // Update the remaining indicator
        if (remainingDotEl) {
            remainingDotEl.style.backgroundColor = this.config.remainingColor;
         }
        if (remainingLabelTextEl) {
            remainingLabelTextEl.textContent = this.config.remainingLabel;
         }
        if (remainingValueEl) {
            remainingValueEl.textContent = `${remaining.toFixed(1)} ${this.config.unit}`;
            remainingValueEl.style.color = this.config.remainingColor;
         }
    }
    
    _drawPieChart(svg, readingValue, remainingValue) {
        const centerX = 100;
        const centerY = 100;
        const radius = 80;
        
        const total = readingValue + remainingValue;
        
        if (total === 0) {
            // Draw empty pie
            const emptyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            emptyCircle.setAttribute('cx', centerX);
            emptyCircle.setAttribute('cy', centerY);
            emptyCircle.setAttribute('r', radius);
            emptyCircle.setAttribute('fill', 'rgba(207, 216, 220, 0.15)');
            emptyCircle.setAttribute('class', 'pie-slice-empty');
            svg.appendChild(emptyCircle);
            return;
        }
        
        // Start from top ( -90 degrees )
        let currentAngle = -90;
        
        // Draw remaining slice first
        if (remainingValue > 0) {
            const remainingAngle = (remainingValue / total) * 360;
            const endAngle = currentAngle + remainingAngle;
            
            const path = this._createPieSlicePath(centerX, centerY, radius, currentAngle, endAngle);
            
            const remainingSlice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            remainingSlice.setAttribute('d', path);
            remainingSlice.setAttribute('fill', this.config.remainingColor);
            remainingSlice.setAttribute('class', 'pie-slice');
            
            svg.appendChild(remainingSlice);
            
            currentAngle = endAngle;
        }
        
        // Draw reading slice next (starts where remaining ends)
        if (readingValue > 0) {
            const readingAngle = (readingValue / total) * 360;
            const endAngle = currentAngle + readingAngle;
            
            const path = this._createPieSlicePath(centerX, centerY, radius, currentAngle, endAngle);
            
            const readingSlice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            readingSlice.setAttribute('d', path);
            readingSlice.setAttribute('fill', this.config.readingColor);
            readingSlice.setAttribute('class', 'pie-slice');
            
            svg.appendChild(readingSlice);
        }
    }
    
    _createPieSlicePath(cx, cy, r, startAngle, endAngle) {
        if (endAngle - startAngle === 0) return '';
        if (endAngle - startAngle >= 360) {
            // Full circle
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
        }
        
        const startRad = startAngle * Math.PI / 180;
        const endRad = endAngle * Math.PI / 180;
        
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        
        const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
        
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }
    
    _findReadingByUserLabel(readings, labelUser) {
        if (!labelUser || !readings) return null;
        const reading = readings.find(r =>
            r.labelUser === labelUser
        );
        return reading || null;
    }
    
    _findReadingByOriginalLabel(readings, labelOriginal) {
        if (!labelOriginal || !readings) return null;
        const reading = readings.find(r =>
            r.labelOriginal === labelOriginal
        );
        return reading || null;
    }
    
    update(data) {
        // Accept the full server data object and extract readings automatically
        const readings = (data && data.hwinfo && data.hwinfo.readings) ? data.hwinfo.readings : [];
        
        // Get the reading value from config
        let readingValue = 0;
        
        // Try to find the reading based on 'reading' config (sensor label)
        if (this.config.reading) {
            const reading = this._findReadingByUserLabel(readings, this.config.reading) ||
                           this._findReadingByOriginalLabel(readings, this.config.reading);
            if (reading) {
                readingValue = reading.value;
            }
        }
        
        // Update the pie chart with the reading value
        this._updatePie(readingValue);
    }
}

// Register the widget class globally
if (typeof window !== 'undefined') {
    window.PieChart2D = PieChart2D;
}
