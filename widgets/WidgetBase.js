/**
 * WidgetBase - Base class for all dashboard widgets.
 * Provides a registry system and common functionality.
 */
const WidgetRegistry = {
    _widgets: {},

    register(name, widget) {
        this._widgets[name] = widget;
    },

    get(name) {
        return this._widgets[name];
    },

    getAll() {
        return Object.values(this._widgets);
    }
};

class WidgetBase {
    constructor(containerSelector, config = {}) {
        this.name = config.name || 'widget-' + Math.random().toString(36).substr(2, 9);
        this.container = document.querySelector(containerSelector);
        this.config = config;
        this.initialized = false;
        WidgetRegistry.register(this.name, this);
     }

    init() {
        if (this.initialized) return;
        this.render();
        this.initialized = true;
    }

    render() {
        // Override in subclass
        throw new Error('render() must be implemented by subclass');
    }

    update(values) {
        // Override in subclass
        throw new Error('update() must be implemented by subclass');
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        delete WidgetRegistry._widgets[this.name];
    }
}
