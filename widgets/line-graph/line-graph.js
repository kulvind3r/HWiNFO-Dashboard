/**
 * LineGraph Widget
 * 
 * A horizontal line graph widget that displays the last 60 values of a sensor reading.
 * The graph plots values from right (oldest) to left (newest), with the latest value
 * shown at the base. Min and max values are displayed on the right axis.
 *
 * Configuration Options:
 *     - name: string - Unique identifier for the widget
 *     - label: string - The label displayed above the graph
 *     - unit: string (default: '%') - Unit suffix for the value display (e.g., '%', 'Mbps', '°C')
 *     - min: number (default: 0) - Minimum value for the scale (shown on right axis)
 *     - max: number (default: 100) - Maximum value for the scale (shown on right axis)
 *     - reading: string - The labelUser for the reading in remotehwinfo Server JSON to fetch for the main value
 *
 * Time Window:
 *     The graph always displays the last 60 values.
 *     Time window = refreshTime * 60 seconds.
 *     For example, if refresh time is 2 seconds, the graph shows 120 seconds of history.
 *
 * Usage:
 *   const widget = new LineGraph('#widget-network', {
 *       name: 'network',
 *       label: 'Network',
 *       reading: 'Network Total Bytes',
 *       unit: 'Mbps',
 *       min: 0,
 *       max: 1000,
 *   });
 *   widget.init();
 */

class LineGraph extends WidgetBase {

    constructor(containerSelector, config = {}) {
        super(containerSelector, config);

        // Default configuration
        this.config = {
            name: config.name || 'line-graph',
            label: config.label || 'Line',
            unit: config.unit || '%',
            min: config.min !== undefined ? config.min : 0,
            max: config.max !== undefined ? config.max : 100,
            reading: config.reading || '',
            ...config
        };

        // History buffer: stores last 60 values
        this.history = new Array(60).fill(0);
        this.currentValue = 0;
        
        // Canvas and context for rendering
        this.canvas = null;
    }

    render() {
        const container = this.container;
        if (!container) {
            console.error(`LineGraph: Container not found for widget "${this.name}"`);
            return;
        }

        container.className = 'lg-widget';
        container.innerHTML = `
            <div class="lg-label">${this.config.label}</div>
            <div class="lg-graph-container">
                <canvas id="${this.name}-canvas"></canvas>
                <div class="lg-axis-right">
                    <div class="lg-axis-value lg-max-value">0${this.config.unit}</div>
                    <div class="lg-axis-value lg-min-value">0${this.config.unit}</div>
                </div>
            </div>
            <div class="lg-value" id="${this.name}-value">0${this.config.unit}</div>
            <div class="lg-time-label">Last 60 readings</div>
        `;

        this.canvas = document.getElementById(`${this.name}-canvas`);
        if (this.canvas) {
            this.canvas.getContext = this.canvas.getContext.bind(this.canvas);
            this._setupCanvas();
            this._drawGraph();
        }
    }

    _setupCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = (rect.height + 20) * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        const ctx = this.canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
    }

    _drawGraph() {
        if (!this.canvas || !this.history.length) return;
        
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        
        const width = this.canvasWidth;
        const height = this.canvasHeight;
        const padding = { top: 10, bottom: 10, left: 10, right: 40 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate scale
        const minVal = this.config.min;
        const maxVal = this.config.max;
        const range = maxVal - minVal || 1;
        
        // Use fixed min/max values from config for axis labels
       const maxLabelEl = document.querySelector(`#${this.name}-canvas`).parentElement.querySelector('.lg-max-value');
       const minLabelEl = document.querySelector(`#${this.name}-canvas`).parentElement.querySelector('.lg-min-value');
       if (maxLabelEl) maxLabelEl.textContent = `${maxVal.toFixed(1)} ${this.config.unit}`;
       if (minLabelEl) minLabelEl.textContent = `${minVal.toFixed(1)} ${this.config.unit}`;
        
        // Draw grid lines (5 horizontal lines)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i / 4) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
        
        // Draw the line graph
      const validValues = this.history.filter(v => v !== null);
      if (validValues.length > 1) {
            // Calculate gradient color based on value
            const points = [];
            for (let i = 0; i < this.history.length; i++) {
                if (this.history[i] !== null) {
                    // Time flows right to left: oldest (index 0) on right, newest (index 59) on left
                    const x = padding.left + (i / (this.history.length - 1)) * graphWidth;
                    const normalizedValue = (this.history[i] - minVal) / range;
                    const y = padding.top + graphHeight - normalizedValue * graphHeight;
                    points.push({ x, y, value: this.history[i] });
                }
            }
            
            if (points.length >= 2) {
                // Draw filled area with gradient
                const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphHeight);
                gradient.addColorStop(0, 'rgba(0, 200, 83, 0.3)');
                gradient.addColorStop(0.5, 'rgba(255, 214, 0, 0.15)');
                gradient.addColorStop(1, 'rgba(255, 23, 68, 0.3)');
                
                // Points ordered: newest (left) to oldest (right)
                // Draw from left to right (newest to oldest)
                ctx.beginPath();
                ctx.moveTo(points[0].x, padding.top + graphHeight);
                for (let i = 0; i < points.length; i++) {
                    if (i === 0) {
                        ctx.lineTo(points[i].x, points[i].y);
                    } else {
                        const prevPoint = points[i - 1];
                        const cpx = (prevPoint.x + points[i].x) / 2;
                        ctx.bezierCurveTo(cpx, prevPoint.y, cpx, points[i].y, points[i].x, points[i].y);
                    }
                }
                ctx.lineTo(points[points.length - 1].x, padding.top + graphHeight);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Draw line with color based on the latest value (leftmost point = first in array)
                const latestValue = points[0].value;
                let lineColor;
                if (latestValue <= 35) {
                    lineColor = this.config.invertColors ? '#ff1744' : '#00c853';
                } else if (latestValue <= 65) {
                    lineColor = '#ffd600';
                } else {
                    lineColor = this.config.invertColors ? '#00c853' : '#ff1744';
                }
                
                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    if (i === 0) {
                        ctx.moveTo(points[i].x, points[i].y);
                    } else {
                        const prevPoint = points[i - 1];
                        const cpx = (prevPoint.x + points[i].x) / 2;
                        ctx.bezierCurveTo(cpx, prevPoint.y, cpx, points[i].y, points[i].x, points[i].y);
                    }
                }
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw dot at the newest value (rightmost point = last in array)
              var lastPoint = points[points.length - 1];
              ctx.beginPath();
              ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
              ctx.fillStyle = lineColor;
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
        }
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
                this.currentValue = mainReading.value;
                
                // Shift history: remove first element, add new value at the end
                this.history.shift();
                this.history.push(this.currentValue);
                
                // Redraw the graph
                this._drawGraph();
                
                // Update value display at base
                const valueEl = document.getElementById(`${this.name}-value`);
                if (valueEl) {
                    valueEl.textContent = `${this.currentValue.toFixed(1)} ${this.config.unit}`;
                }
            }
        }
    }
}

// Register the widget class globally
if (typeof window !== 'undefined') {
    window.LineGraph = LineGraph;
}
