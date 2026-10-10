/**
 * TextValue Widget
 * 
 * A simple widget that displays a label and a text value in large letters.
 *
 * Configuration Options:
 * - label: string - The label displayed above the value
 * - unit: string (default: '') - Unit suffix displayed in smaller font. Use "yes/no" to enable boolean display mode.
 * - reading: string - The label for the reading in remotehwinfo Server JSON to fetch for the main value
 * - prefix: string (default: '') - Prefix displayed before the value
 * - yesValueColor: string (default: 'white') - Color for "Yes" value when unit is "yes/no" (options: 'green', 'red'). If only this is set, the opposite color is used for "No".
 * - noValueColor: string (default: 'white') - Color for "No" value when unit is "yes/no" (options: 'green', 'red'). If only this is set, the opposite color is used for "Yes".
 *
 * Usage:
 *   const widget = new TextValue('#my-container', {
 *       label: 'CPU Temperature',
 *       reading: 'CPU Temperature',
 *       unit: '°C'
 *   });
 *   widget.init();
 */

class TextValue extends WidgetBase {

    constructor(container, config = {}) {
        super(container, config);

        // Default configuration
        this.config = {
            label: config.label || 'Value',
            unit: config.unit || '',
            prefix: config.prefix || '',
            reading: config.reading || '',
            yesValueColor: config.yesValueColor,
            noValueColor: config.noValueColor,
            ...config
        };

        this.currentValue = '';

        // Detect yes/no mode
        this.isYesNoMode = typeof this.config.unit === 'string' && this.config.unit.toLowerCase() === 'yes/no';

        // Resolve yes/no colors: default white, auto-opposite when only one is specified
        const { yesValueColor, noValueColor } = this.config;
        const hasYes = yesValueColor !== undefined && yesValueColor !== null && yesValueColor !== '';
        const hasNo = noValueColor !== undefined && noValueColor !== null && noValueColor !== '';
        const oppositeMap = { 'green': 'red', 'red': 'green' };

        if (hasYes && !hasNo) {
            this._resolvedYesColor = this._getColorValue(yesValueColor);
            this._resolvedNoColor = this._getColorValue(oppositeMap[String(yesValueColor).toLowerCase()] || 'green');
        } else if (!hasYes && hasNo) {
            this._resolvedNoColor = this._getColorValue(noValueColor);
            this._resolvedYesColor = this._getColorValue(oppositeMap[String(noValueColor).toLowerCase()] || 'red');
        } else if (hasYes && hasNo) {
            this._resolvedYesColor = this._getColorValue(yesValueColor);
            this._resolvedNoColor = this._getColorValue(noValueColor);
        } else {
            // Neither specified: both default to white
            this._resolvedYesColor = '#ffffff';
            this._resolvedNoColor = '#ffffff';
        }
    }

    render() {
        const container = this.container;
        if (!container) {
            console.error(`TextValue: Container not found for widget "${this.name}"`);
            return;
        }

        container.className = 'tv-widget';
        
        // Set CSS custom properties for yes/no colors
        container.style.setProperty('--tv-yes-color', this._resolvedYesColor);
        container.style.setProperty('--tv-no-color', this._resolvedNoColor);

        container.innerHTML = `
            <div class="tv-label">${this.config.label}</div>
            <div class="tv-value-container">
                <span class="tv-prefix"></span>
                <span class="tv-value"></span>
                <span class="tv-unit">${this.isYesNoMode ? '' : this.config.unit}</span>
            </div>
        `;
    }
    
    _getColorValue(colorName) {
        const colorMap = {
            'green': '#4CAF50',
            'red': '#F44336'
        };
        return colorMap[String(colorName).toLowerCase()] || '#ffffff';
    }

    _findReading(readings, label) {
        if (!label || !readings) return null;
        const reading = readings.find(r =>
            r.labelUser === label || r.labelOriginal === label
        );
        return reading || null;
    }

    update(data) {
        const readings = (data && data.hwinfo && data.hwinfo.readings) ? data.hwinfo.readings : [];

        if (this.config.reading) {
            const mainReading = this._findReading(readings, this.config.reading);
            if (mainReading) {
                this.currentValue = mainReading.value;
            }
        }

        const valueEl = this.container.querySelector('.tv-value');
        const prefixEl = this.container.querySelector('.tv-prefix');

        if (valueEl) {
            let displayValue = this.currentValue !== undefined && this.currentValue !== null ? this.currentValue : '';
            
            // Handle yes/no mode
            if (this.isYesNoMode) {
                const numericValue = Number(this.currentValue);
                if (numericValue === 1) {
                    displayValue = 'Yes';
                    valueEl.className = 'tv-value tv-yes';
                } else if (numericValue === 0) {
                    displayValue = 'No';
                    valueEl.className = 'tv-value tv-no';
                } else {
                    displayValue = String(this.currentValue);
                    valueEl.className = 'tv-value';
                }
            }
            
            valueEl.textContent = displayValue;
        }
        if (prefixEl) {
            prefixEl.textContent = this.config.prefix;
        }
    }
}

// Export the class globally
if (typeof window !== 'undefined') {
    window.TextValue = TextValue;
}
