/**
 * Card Widget - A container widget that holds other widgets.
 * 
 * Layout rules:
 * - 2 widgets: Title on top, two widgets side-by-side (50% width each)
 * - 3 widgets: Title on top, first widget on left (50%), other two stacked on right (50% each)
 * - 4 widgets: Title on top, four widgets in quadrant layout (25% each)
 * - Less than 2 widgets: Shows error message
 */
class Card extends WidgetBase {
    constructor(containerSelector, config = {}) {
        super(containerSelector, config);
        this.title = config.title || 'Card';
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

        if (widgetCount === 2) {
            // Layout: Two widgets side-by-side, each 50% width
            contentDiv.className = 'card-content card-layout-2';
            this.childWidgets.forEach((widget, index) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                // Set the container for the child widget
                widget.container = widgetContainer;
                contentDiv.appendChild(widgetContainer);
            });
        } else if (widgetCount === 3) {
            // Layout: First widget on left (50%), other two stacked on right (50% each)
            contentDiv.className = 'card-content card-layout-3';
            
            const leftSlot = document.createElement('div');
            leftSlot.className = 'card-widget-slot card-slot-left';
            // Set container for first widget
            this.childWidgets[0].container = leftSlot;
            
            const rightContainer = document.createElement('div');
            rightContainer.className = 'card-slot-right';
            
            const rightTopSlot = document.createElement('div');
            rightTopSlot.className = 'card-widget-slot card-slot-right-top';
            // Set container for second widget
            this.childWidgets[1].container = rightTopSlot;
            rightContainer.appendChild(rightTopSlot);
            
            const rightBottomSlot = document.createElement('div');
            rightBottomSlot.className = 'card-widget-slot card-slot-right-bottom';
            // Set container for third widget
            this.childWidgets[2].container = rightBottomSlot;
            rightContainer.appendChild(rightBottomSlot);
            
            contentDiv.appendChild(leftSlot);
            contentDiv.appendChild(rightContainer);
        } else if (widgetCount >= 4) {
            // Layout: Four widgets in quadrant layout, 25% each
            contentDiv.className = 'card-content card-layout-4';
            this.childWidgets.slice(0, 4).forEach((widget, index) => {
                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'card-widget-slot';
                // Set the container for the child widget
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
