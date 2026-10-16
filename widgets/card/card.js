/**
 * Card Widget - A container widget that holds other widgets.
 *
 * Layout can be explicitly set via config.layout, or auto-selected based on widget count.
 *
 * Available layouts:
 * - '1-row-2-columns': First widget takes 100% width on top row, remaining two widgets on 2nd row at 50% width each (requires 3 widgets)
 * - '2-columns-1-row': First two widgets on top row at 50% width each, remaining widget takes 100% width on 2nd row (requires 3 widgets)
 * - 'quadrant': 4 widgets split into a 2x2 grid, each taking 50% horizontal and 50% vertical (requires 4 widgets)
 * - '2-equal-columns': 2 widgets side-by-side, each taking 50% width and 100% height (requires 2 widgets)
 * - '2-equal-rows': 2 widgets stacked vertically, each taking 100% width and 50% height (requires 2 widgets)
 *
 * Auto-selection (when layout is not specified):
 * - 2 widgets: '2-equal-columns'
 * - 3 widgets: '1-row-2-columns'
 * - 4+ widgets: 'quadrant'
 * - Less than 2 widgets: Shows error message
 */
class Card extends WidgetBase {
    constructor(containerSelector, config = {}) {
        super(containerSelector, config);
        this.title = config.title || 'Card';
        this.layout = config.layout || ''; // '1-row-2-columns', '2-columns-1-row', 'quadrant', '2-equal-columns', '2-equal-rows', or '' for auto
        this.childWidgets = [];
     }

    addWidget(widget) {
        this.childWidgets.push(widget);
     }

    init() {
        if (this.childWidgets.length < 2) {
            this.renderError();
            return;
         }
        super.init();
     }

    renderError() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.className = 'card-widget card-error';
        this.container.setAttribute('data-card-name', this.name);
        this.container.setAttribute('data-widget-count', this.childWidgets.length);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'card-error-message';
        errorDiv.textContent = 'One more widget needed for card layout';
        this.container.appendChild(errorDiv);
     }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.className = 'card-widget';
        this.container.setAttribute('data-card-name', this.name);
        this.container.setAttribute('data-widget-count', this.childWidgets.length);

        // Create title div
        const titleDiv = document.createElement('div');
        titleDiv.className = 'card-title';
        titleDiv.textContent = this.title;
        this.container.appendChild(titleDiv);

        // Create container for child widgets
        const contentDiv = document.createElement('div');
        contentDiv.className = 'card-content';

        const widgetCount = this.childWidgets.length;

        // Determine layout: use explicit layout config if provided, otherwise auto-select based on widget count
        let layout = this.layout;
        if (!layout) {
            if (widgetCount === 2) {
                layout = '2-equal-columns';
            } else if (widgetCount === 3) {
                layout = '1-row-2-columns';
            } else if (widgetCount >= 4) {
                layout = 'quadrant';
            }
        }

        if (layout === '1-row-2-columns') {
            // Layout: First widget full width on top row, two widgets on bottom row 50% each
            contentDiv.className = 'card-content card-layout-1-row-2-columns';
            
            const topRow = document.createElement('div');
            topRow.className = 'card-row-top';
            const topSlot = document.createElement('div');
            topSlot.className = 'card-widget-slot';
            this.childWidgets[0].container = topSlot;
            topRow.appendChild(topSlot);
            
            const bottomRow = document.createElement('div');
            bottomRow.className = 'card-row-bottom';
            const bottomLeftSlot = document.createElement('div');
            bottomLeftSlot.className = 'card-widget-slot';
            this.childWidgets[1].container = bottomLeftSlot;
            bottomRow.appendChild(bottomLeftSlot);
            
            const bottomRightSlot = document.createElement('div');
            bottomRightSlot.className = 'card-widget-slot';
            this.childWidgets[2].container = bottomRightSlot;
            bottomRow.appendChild(bottomRightSlot);
            
            contentDiv.appendChild(topRow);
            contentDiv.appendChild(bottomRow);
        } else if (layout === '2-columns-1-row') {
            // Layout: First two widgets side-by-side on top row 50% each, third widget full width on bottom row
            contentDiv.className = 'card-content card-layout-2-columns-1-row';
            
            const topRow = document.createElement('div');
            topRow.className = 'card-row-top';
            const topLeftSlot = document.createElement('div');
            topLeftSlot.className = 'card-widget-slot';
            this.childWidgets[0].container = topLeftSlot;
            topRow.appendChild(topLeftSlot);
            
            const topRightSlot = document.createElement('div');
            topRightSlot.className = 'card-widget-slot';
            this.childWidgets[1].container = topRightSlot;
            topRow.appendChild(topRightSlot);
            
            const bottomRow = document.createElement('div');
            bottomRow.className = 'card-row-bottom';
            const bottomSlot = document.createElement('div');
            bottomSlot.className = 'card-widget-slot';
            this.childWidgets[2].container = bottomSlot;
            bottomRow.appendChild(bottomSlot);
            
            contentDiv.appendChild(topRow);
            contentDiv.appendChild(bottomRow);
        } else if (layout === 'quadrant') {
            // Layout: Four widgets in 2x2 grid, 50% width/height each
            contentDiv.className = 'card-content card-layout-quadrant';
            this.childWidgets.slice(0, 4).forEach((widget) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                widget.container = widgetContainer;
                contentDiv.appendChild(widgetContainer);
            });
        } else if (layout === '2-equal-columns') {
            // Layout: Two widgets side-by-side, 50% width each, 100% height
            contentDiv.className = 'card-content card-layout-2-equal-columns';
            this.childWidgets.slice(0, 2).forEach((widget) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                widget.container = widgetContainer;
                contentDiv.appendChild(widgetContainer);
            });
        } else if (layout === '2-equal-rows') {
            // Layout: Two widgets stacked, 100% width each, 50% height
            contentDiv.className = 'card-content card-layout-2-equal-rows';
            this.childWidgets.slice(0, 2).forEach((widget) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                widget.container = widgetContainer;
                contentDiv.appendChild(widgetContainer);
            });
        } else if (widgetCount === 2) {
            // Fallback: Two widgets side-by-side, each 50% width
            contentDiv.className = 'card-content card-layout-2';
            this.childWidgets.forEach((widget, index) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                widget.container = widgetContainer;
                contentDiv.appendChild(widgetContainer);
            });
        } else if (widgetCount === 3) {
            // Fallback: First widget on left (50%), other two stacked on right (50% each)
            contentDiv.className = 'card-content card-layout-3';
            
            const leftSlot = document.createElement('div');
            leftSlot.className = 'card-widget-slot card-slot-left';
            this.childWidgets[0].container = leftSlot;
            
            const rightContainer = document.createElement('div');
            rightContainer.className = 'card-slot-right';
            
            const rightTopSlot = document.createElement('div');
            rightTopSlot.className = 'card-widget-slot card-slot-right-top';
            this.childWidgets[1].container = rightTopSlot;
            rightContainer.appendChild(rightTopSlot);
            
            const rightBottomSlot = document.createElement('div');
            rightBottomSlot.className = 'card-widget-slot card-slot-right-bottom';
            this.childWidgets[2].container = rightBottomSlot;
            rightContainer.appendChild(rightBottomSlot);
            
            contentDiv.appendChild(leftSlot);
            contentDiv.appendChild(rightContainer);
        } else if (widgetCount >= 4) {
            // Fallback: Four widgets in quadrant layout, 25% each
            contentDiv.className = 'card-content card-layout-4';
            this.childWidgets.slice(0, 4).forEach((widget, index) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                widget.container = widgetContainer;
                contentDiv.appendChild(widgetContainer);
            });
        }

        // Append content div to the main container first so all child containers are in the DOM
        this.container.appendChild(contentDiv);
        
        // Now initialize child widgets - they will render into their assigned containers
        this.childWidgets.forEach(widget => {
            if (!widget.initialized) {
                widget.init();
            }
        });
     }

    update(data) {
        // Pass data to all child widgets
        this.childWidgets.forEach(widget => {
            try {
                widget.update(data);
            } catch (error) {
                console.warn(`Failed to update child widget ${widget.name}:`, error);
            }
        });
     }

    destroy() {
        // Destroy all child widgets
        this.childWidgets.forEach(widget => {
            try {
                widget.destroy();
            } catch (error) {
                console.warn(`Failed to destroy child widget ${widget.name}:`, error);
            }
        });
        this.childWidgets = [];
        super.destroy();
     }
}