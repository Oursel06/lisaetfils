
(function (window) {
    var slice = Array.prototype.slice;
    function noop() { }
    function defineBridget($) {
        if (!$) {
            return;
        }
        function addOptionMethod(PluginClass) {
            if (PluginClass.prototype.option) {
                return;
            }
            PluginClass.prototype.option = function (opts) {
                // bail out if not an object
                if (!$.isPlainObject(opts)) {
                    return;
                }
                this.options = $.extend(true, this.options, opts);
            };
        }
        var logError = typeof console === 'undefined' ? noop :
            function (message) {
                console.error(message);
            };
        function bridge(namespace, PluginClass) {
            $.fn[namespace] = function (options) {
                if (typeof options === 'string') {
                    var args = slice.call(arguments, 1);
                    for (var i = 0, len = this.length; i < len; i++) {
                        var elem = this[i];
                        var instance = $.data(elem, namespace);
                        if (!instance) {
                            logError("cannot call methods on " + namespace + " prior to initialization; " +
                                "attempted to call '" + options + "'");
                            continue;
                        }
                        if (!$.isFunction(instance[options]) || options.charAt(0) === '_') {
                            logError("no such method '" + options + "' for " + namespace + " instance");
                            continue;
                        }
                        var returnValue = instance[options].apply(instance, args);
                        if (returnValue !== undefined) {
                            return returnValue;
                        }
                    }
                    return this;
                } else {
                    return this.each(function () {
                        var instance = $.data(this, namespace);
                        if (instance) {
                            instance.option(options);
                            instance._init();
                        } else {
                            instance = new PluginClass(this, options);
                            $.data(this, namespace, instance);
                        }
                    });
                }
            };
        }
        $.bridget = function (namespace, PluginClass) {
            addOptionMethod(PluginClass);
            bridge(namespace, PluginClass);
        };
        return $.bridget;
    }
    if (typeof define === 'function' && define.amd) {
        define('jquery-bridget/jquery.bridget', ['jquery'], defineBridget);
    } else if (typeof exports === 'object') {
        defineBridget(require('jquery'));
    } else {
        defineBridget(window.jQuery);
    }

})(window);

(function (window) {
    function classReg(className) {
        return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }
    var hasClass, addClass, removeClass;
    if ('classList' in document.documentElement) {
        hasClass = function (elem, c) {
            return elem.classList.contains(c);
        };
        addClass = function (elem, c) {
            elem.classList.add(c);
        };
        removeClass = function (elem, c) {
            elem.classList.remove(c);
        };
    }
    else {
        hasClass = function (elem, c) {
            return classReg(c).test(elem.className);
        };
        addClass = function (elem, c) {
            if (!hasClass(elem, c)) {
                elem.className = elem.className + ' ' + c;
            }
        };
        removeClass = function (elem, c) {
            elem.className = elem.className.replace(classReg(c), ' ');
        };
    }
    function toggleClass(elem, c) {
        var fn = hasClass(elem, c) ? removeClass : addClass;
        fn(elem, c);
    }
    var classie = {
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        has: hasClass,
        add: addClass,
        remove: removeClass,
        toggle: toggleClass
    };
    if (typeof define === 'function' && define.amd) {
        define('classie/classie', classie);
    } else if (typeof exports === 'object') {
        module.exports = classie;
    } else {
        window.classie = classie;
    }

})(window);

; (function () {
    function EventEmitter() { }
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }
        return -1;
    }
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }
        return response;
    };
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;
        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }
        return flatListeners;
    };
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;
        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }
        return response || listeners;
    };
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;
        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }
        return this;
    };
    proto.on = alias('addListener');
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };
    proto.once = alias('addOnceListener');
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;
        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);
                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }
        return this;
    };
    proto.off = alias('removeListener');
    proto.addListeners = function addListeners(evt, listeners) {
        return this.manipulateListeners(false, evt, listeners);
    };
    proto.removeListeners = function removeListeners(evt, listeners) {
        return this.manipulateListeners(true, evt, listeners);
    };
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }
        return this;
    };
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;
        if (type === 'string') {
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            delete this._events;
        }
        return this;
    };
    proto.removeAllListeners = alias('removeEvent');
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;
        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;
                while (i--) {
                    listener = listeners[key][i];
                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }
                    response = listener.listener.apply(this, args || []);
                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }
        return this;
    };
    proto.trigger = alias('emitEvent');
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };
    if (typeof define === 'function' && define.amd) {
        define('eventEmitter/EventEmitter', [], function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports) {
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}.call(this));

(function (window) {
    var docElem = document.documentElement;
    var bind = function () { };
    function getIEEvent(obj) {
        var event = window.event;
        event.target = event.target || event.srcElement || obj;
        return event;
    }
    if (docElem.addEventListener) {
        bind = function (obj, type, fn) {
            obj.addEventListener(type, fn, false);
        };
    } else if (docElem.attachEvent) {
        bind = function (obj, type, fn) {
            obj[type + fn] = fn.handleEvent ?
                function () {
                    var event = getIEEvent(obj);
                    fn.handleEvent.call(fn, event);
                } :
                function () {
                    var event = getIEEvent(obj);
                    fn.call(obj, event);
                };
            obj.attachEvent("on" + type, obj[type + fn]);
        };
    }
    var unbind = function () { };
    if (docElem.removeEventListener) {
        unbind = function (obj, type, fn) {
            obj.removeEventListener(type, fn, false);
        };
    } else if (docElem.detachEvent) {
        unbind = function (obj, type, fn) {
            obj.detachEvent("on" + type, obj[type + fn]);
            try {
                delete obj[type + fn];
            } catch (err) {
                // can't delete window object properties
                obj[type + fn] = undefined;
            }
        };
    }
    var eventie = {
        bind: bind,
        unbind: unbind
    };
    if (typeof define === 'function' && define.amd) {
        define('eventie/eventie', eventie);
    } else if (typeof exports === 'object') {
        module.exports = eventie;
    } else {
        window.eventie = eventie;
    }

})(window);

(function (window) {
    var prefixes = 'Webkit Moz ms Ms O'.split(' ');
    var docElemStyle = document.documentElement.style;
    function getStyleProperty(propName) {
        if (!propName) {
            return;
        }
        // test standard property first
        if (typeof docElemStyle[propName] === 'string') {
            return propName;
        }
        // capitalize
        propName = propName.charAt(0).toUpperCase() + propName.slice(1);
        // test vendor specific properties
        var prefixed;
        for (var i = 0, len = prefixes.length; i < len; i++) {
            prefixed = prefixes[i] + propName;
            if (typeof docElemStyle[prefixed] === 'string') {
                return prefixed;
            }
        }
    }
    // transport
    if (typeof define === 'function' && define.amd) {
        define('get-style-property/get-style-property', [], function () {
            return getStyleProperty;
        });
    } else if (typeof exports === 'object') {
        module.exports = getStyleProperty;
    } else {
        window.getStyleProperty = getStyleProperty;
    }

})(window);

(function (window, undefined) {
    // -------------------------- helpers -------------------------- //
    // get a number from a string, not a percentage
    function getStyleSize(value) {
        var num = parseFloat(value);
        // not a percent like '100%', and a number
        var isValid = value.indexOf('%') === -1 && !isNaN(num);
        return isValid && num;
    }
    function noop() { }
    var logError = typeof console === 'undefined' ? noop :
        function (message) {
            console.error(message);
        };
    // -------------------------- measurements -------------------------- //
    var measurements = [
        'paddingLeft',
        'paddingRight',
        'paddingTop',
        'paddingBottom',
        'marginLeft',
        'marginRight',
        'marginTop',
        'marginBottom',
        'borderLeftWidth',
        'borderRightWidth',
        'borderTopWidth',
        'borderBottomWidth'
    ];
    function getZeroSize() {
        var size = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        };
        for (var i = 0, len = measurements.length; i < len; i++) {
            var measurement = measurements[i];
            size[measurement] = 0;
        }
        return size;
    }
    function defineGetSize(getStyleProperty) {
        var isSetup = false;
        var getStyle, boxSizingProp, isBoxSizeOuter;
        function setup() {
            // setup once
            if (isSetup) {
                return;
            }
            isSetup = true;
            var getComputedStyle = window.getComputedStyle;
            getStyle = (function () {
                var getStyleFn = getComputedStyle ?
                    function (elem) {
                        return getComputedStyle(elem, null);
                    } :
                    function (elem) {
                        return elem.currentStyle;
                    };
                return function getStyle(elem) {
                    var style = getStyleFn(elem);
                    if (!style) {
                        logError('Style returned ' + style + '.');
                    }
                    return style;
                };
            })();
            boxSizingProp = getStyleProperty('boxSizing');
            if (boxSizingProp) {
                var div = document.createElement('div');
                div.style.width = '200px';
                div.style.padding = '1px 2px 3px 4px';
                div.style.borderStyle = 'solid';
                div.style.borderWidth = '1px 2px 3px 4px';
                div.style[boxSizingProp] = 'border-box';
                var body = document.body || document.documentElement;
                body.appendChild(div);
                var style = getStyle(div);
                isBoxSizeOuter = getStyleSize(style.width) === 200;
                body.removeChild(div);
            }
        }
        // -------------------------- getSize -------------------------- //
        function getSize(elem) {
            setup();
            // use querySeletor if elem is string
            if (typeof elem === 'string') {
                elem = document.querySelector(elem);
            }
            // do not proceed on non-objects
            if (!elem || typeof elem !== 'object' || !elem.nodeType) {
                return;
            }
            var style = getStyle(elem);
            // if hidden, everything is 0
            if (style.display === 'none') {
                return getZeroSize();
            }
            var size = {};
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;
            var isBorderBox = size.isBorderBox = !!(boxSizingProp &&
                style[boxSizingProp] && style[boxSizingProp] === 'border-box');
            // get all measurements
            for (var i = 0, len = measurements.length; i < len; i++) {
                var measurement = measurements[i];
                var value = style[measurement];
                value = mungeNonPixel(elem, value);
                var num = parseFloat(value);
                // any 'auto', 'medium' value will be 0
                size[measurement] = !isNaN(num) ? num : 0;
            }
            var paddingWidth = size.paddingLeft + size.paddingRight;
            var paddingHeight = size.paddingTop + size.paddingBottom;
            var marginWidth = size.marginLeft + size.marginRight;
            var marginHeight = size.marginTop + size.marginBottom;
            var borderWidth = size.borderLeftWidth + size.borderRightWidth;
            var borderHeight = size.borderTopWidth + size.borderBottomWidth;
            var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;
            // overwrite width and height if we can get it from style
            var styleWidth = getStyleSize(style.width);
            if (styleWidth !== false) {
                size.width = styleWidth +
                    // add padding and border unless it's already including it
                    (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
            }
            var styleHeight = getStyleSize(style.height);
            if (styleHeight !== false) {
                size.height = styleHeight +
                    // add padding and border unless it's already including it
                    (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
            }
            size.innerWidth = size.width - (paddingWidth + borderWidth);
            size.innerHeight = size.height - (paddingHeight + borderHeight);
            size.outerWidth = size.width + marginWidth;
            size.outerHeight = size.height + marginHeight;
            return size;
        }
        // IE8 returns percent values, not pixels
        // taken from jQuery's curCSS
        function mungeNonPixel(elem, value) {
            // IE8 and has percent value
            if (window.getComputedStyle || value.indexOf('%') === -1) {
                return value;
            }
            var style = elem.style;
            // Remember the original values
            var left = style.left;
            var rs = elem.runtimeStyle;
            var rsLeft = rs && rs.left;
            // Put in the new values to get a computed value out
            if (rsLeft) {
                rs.left = elem.currentStyle.left;
            }
            style.left = value;
            value = style.pixelLeft;
            // Revert the changed values
            style.left = left;
            if (rsLeft) {
                rs.left = rsLeft;
            }
            return value;
        }
        return getSize;
    }
    if (typeof define === 'function' && define.amd) {
        define('get-size/get-size', ['get-style-property/get-style-property'], defineGetSize);
    } else if (typeof exports === 'object') {
        module.exports = defineGetSize(require('desandro-get-style-property'));
    } else {
        window.getSize = defineGetSize(window.getStyleProperty);
    }

})(window);
(function (window) {
    var document = window.document;
    // collection of functions to be triggered on ready
    var queue = [];
    function docReady(fn) {
        // throw out non-functions
        if (typeof fn !== 'function') {
            return;
        }
        if (docReady.isReady) {
            // ready now, hit it
            fn();
        } else {
            // queue function when ready
            queue.push(fn);
        }
    }
    docReady.isReady = false;
    // triggered on various doc ready events
    function onReady(event) {
        // bail if already triggered or IE8 document is not ready just yet
        var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
        if (docReady.isReady || isIE8NotReady) {
            return;
        }
        trigger();
    }
    function trigger() {
        docReady.isReady = true;
        // process queue
        for (var i = 0, len = queue.length; i < len; i++) {
            var fn = queue[i];
            fn();
        }
    }
    function defineDocReady(eventie) {
        // trigger ready if page is ready
        if (document.readyState === 'complete') {
            trigger();
        } else {
            // listen for events
            eventie.bind(document, 'DOMContentLoaded', onReady);
            eventie.bind(document, 'readystatechange', onReady);
            eventie.bind(window, 'load', onReady);
        }
        return docReady;
    }
    // transport
    if (typeof define === 'function' && define.amd) {
        define('doc-ready/doc-ready', ['eventie/eventie'], defineDocReady);
    } else if (typeof exports === 'object') {
        module.exports = defineDocReady(require('eventie'));
    } else {
        window.docReady = defineDocReady(window.eventie);
    }

})(window);
(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('fizzy-ui-utils/utils', [
            'doc-ready/doc-ready',
            'matches-selector/matches-selector'
        ], function (docReady, matchesSelector) {
            return factory(window, docReady, matchesSelector);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('doc-ready'),
            require('desandro-matches-selector')
        );
    } else {
        window.fizzyUIUtils = factory(
            window,
            window.docReady,
            window.matchesSelector
        );
    }

}(window, function factory(window, docReady, matchesSelector) {
    var utils = {};
    // ----- extend ----- //
    // extends objects
    utils.extend = function (a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    };
    // ----- modulo ----- //
    utils.modulo = function (num, div) {
        return ((num % div) + div) % div;
    };
    // ----- isArray ----- //
    var objToString = Object.prototype.toString;
    utils.isArray = function (obj) {
        return objToString.call(obj) == '[object Array]';
    };
    // ----- makeArray ----- //
    // turn element or nodeList into an array
    utils.makeArray = function (obj) {
        var ary = [];
        if (utils.isArray(obj)) {
            // use object if already an array
            ary = obj;
        } else if (obj && typeof obj.length == 'number') {
            // convert nodeList to array
            for (var i = 0, len = obj.length; i < len; i++) {
                ary.push(obj[i]);
            }
        } else {
            // array of single index
            ary.push(obj);
        }
        return ary;
    };
    // ----- indexOf ----- //
    // index of helper cause IE8
    utils.indexOf = Array.prototype.indexOf ? function (ary, obj) {
        return ary.indexOf(obj);
    } : function (ary, obj) {
        for (var i = 0, len = ary.length; i < len; i++) {
            if (ary[i] === obj) {
                return i;
            }
        }
        return -1;
    };
    utils.removeFrom = function (ary, obj) {
        var index = utils.indexOf(ary, obj);
        if (index != -1) {
            ary.splice(index, 1);
        }
    };
    utils.isElement = (typeof HTMLElement == 'function' || typeof HTMLElement == 'object') ?
        function isElementDOM2(obj) {
            return obj instanceof HTMLElement;
        } :
        function isElementQuirky(obj) {
            return obj && typeof obj == 'object' &&
                obj.nodeType == 1 && typeof obj.nodeName == 'string';
        };
    utils.setText = (function () {
        var setTextProperty;
        function setText(elem, text) {
            setTextProperty = setTextProperty || (document.documentElement.textContent !== undefined ? 'textContent' : 'innerText');
            elem[setTextProperty] = text;
        }
        return setText;
    })();
    utils.getParent = function (elem, selector) {
        while (elem != document.body) {
            elem = elem.parentNode;
            if (matchesSelector(elem, selector)) {
                return elem;
            }
        }
    };
    utils.getQueryElement = function (elem) {
        if (typeof elem == 'string') {
            return document.querySelector(elem);
        }
        return elem;
    };
    utils.handleEvent = function (event) {
        var method = 'on' + event.type;
        if (this[method]) {
            this[method](event);
        }
    };
    utils.filterFindElements = function (elems, selector) {
        elems = utils.makeArray(elems);
        var ffElems = [];
        for (var i = 0, len = elems.length; i < len; i++) {
            var elem = elems[i];
            if (!utils.isElement(elem)) {
                continue;
            }
            if (selector) {
                if (matchesSelector(elem, selector)) {
                    ffElems.push(elem);
                }
                var childElems = elem.querySelectorAll(selector);
                for (var j = 0, jLen = childElems.length; j < jLen; j++) {
                    ffElems.push(childElems[j]);
                }
            } else {
                ffElems.push(elem);
            }
        }
        return ffElems;
    };
    // ----- debounceMethod ----- //
    utils.debounceMethod = function (_class, methodName, threshold) {
        // original method
        var method = _class.prototype[methodName];
        var timeoutName = methodName + 'Timeout';
        _class.prototype[methodName] = function () {
            var timeout = this[timeoutName];
            if (timeout) {
                clearTimeout(timeout);
            }
            var args = arguments;
            var _this = this;
            this[timeoutName] = setTimeout(function () {
                method.apply(_this, args);
                delete _this[timeoutName];
            }, threshold || 100);
        };
    };
    var jQuery = window.jQuery;
    function toDashed(str) {
        return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
            return $1 + '-' + $2;
        }).toLowerCase();
    }
    var console = window.console;
    utils.htmlInit = function (WidgetClass, namespace) {
        docReady(function () {
            var dashedNamespace = toDashed(namespace);
            var elems = document.querySelectorAll('.js-' + dashedNamespace);
            var dataAttr = 'data-' + dashedNamespace + '-options';
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                var attr = elem.getAttribute(dataAttr);
                var options;
                try {
                    options = attr && JSON.parse(attr);
                } catch (error) {
                    // log error, do not initialize
                    if (console) {
                        console.error('Error parsing ' + dataAttr + ' on ' +
                            elem.nodeName.toLowerCase() + (elem.id ? '#' + elem.id : '') + ': ' +
                            error);
                    }
                    continue;
                }
                // initialize
                var instance = new WidgetClass(elem, options);
                // make available via $().data('layoutname')
                if (jQuery) {
                    jQuery.data(elem, namespace, instance);
                }
            }
        });
    };
    return utils;

}));

(function (window, factory) {
    // universal module definition
    if (typeof define == 'function' && define.amd) {
        define('flickity/js/cell', [
            'get-size/get-size'
        ], function (getSize) {
            return factory(window, getSize);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('get-size')
        );
    } else {
        window.Flickity = window.Flickity || {};
        window.Flickity.Cell = factory(
            window,
            window.getSize
        );
    }

}(window, function factory(window, getSize) {
    function Cell(elem, parent) {
        this.element = elem;
        this.parent = parent;
        this.create();
    }
    var isIE8 = 'attachEvent' in window;
    Cell.prototype.create = function () {
        this.element.style.position = 'absolute';
        if (isIE8) {
            this.element.setAttribute('unselectable', 'on');
        }
        this.x = 0;
        this.shift = 0;
    };
    Cell.prototype.destroy = function () {
        this.element.style.position = '';
        var side = this.parent.originSide;
        this.element.style[side] = '';
    };
    Cell.prototype.getSize = function () {
        this.size = getSize(this.element);
    };
    Cell.prototype.setPosition = function (x) {
        this.x = x;
        this.setDefaultTarget();
        this.renderPosition(x);
    };
    Cell.prototype.setDefaultTarget = function () {
        var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
        this.target = this.x + this.size[marginProperty] +
            this.size.width * this.parent.cellAlign;
    };
    Cell.prototype.renderPosition = function (x) {
        // render position of cell with in slider
        var side = this.parent.originSide;
        this.element.style[side] = this.parent.getPositionValue(x);
    };
    Cell.prototype.wrapShift = function (shift) {
        this.shift = shift;
        this.renderPosition(this.x + this.parent.slideableWidth * shift);
    };
    Cell.prototype.remove = function () {
        this.element.parentNode.removeChild(this.element);
    };
    return Cell;

}));

(function (window, factory) {
    // universal module definition
    if (typeof define == 'function' && define.amd) {
        define('flickity/js/animate', [
            'get-style-property/get-style-property',
            'fizzy-ui-utils/utils'
        ], function (getStyleProperty, utils) {
            return factory(window, getStyleProperty, utils);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('desandro-get-style-property'),
            require('fizzy-ui-utils')
        );
    } else {
        window.Flickity = window.Flickity || {};
        window.Flickity.animatePrototype = factory(
            window,
            window.getStyleProperty,
            window.fizzyUIUtils
        );
    }

}(window, function factory(window, getStyleProperty, utils) {
    var lastTime = 0;
    var prefixes = 'webkit moz ms o'.split(' ');
    var requestAnimationFrame = window.requestAnimationFrame;
    var cancelAnimationFrame = window.cancelAnimationFrame;
    var prefix;
    for (var i = 0; i < prefixes.length; i++) {
        if (requestAnimationFrame && cancelAnimationFrame) {
            break;
        }
        prefix = prefixes[i];
        requestAnimationFrame = requestAnimationFrame || window[prefix + 'RequestAnimationFrame'];
        cancelAnimationFrame = cancelAnimationFrame || window[prefix + 'CancelAnimationFrame'] ||
            window[prefix + 'CancelRequestAnimationFrame'];
    }
    if (!requestAnimationFrame || !cancelAnimationFrame) {
        requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        cancelAnimationFrame = function (id) {
            window.clearTimeout(id);
        };
    }
    var proto = {};
    proto.startAnimation = function () {
        if (this.isAnimating) {
            return;
        }
        this.isAnimating = true;
        this.restingFrames = 0;
        this.animate();
    };
    proto.animate = function () {
        this.applySelectedAttraction();
        var previousX = this.x;
        this.integratePhysics();
        this.positionSlider();
        this.settle(previousX);
        // animate next frame
        if (this.isAnimating) {
            var _this = this;
            requestAnimationFrame(function animateFrame() {
                _this.animate();
            });
        }
    };
    var transformProperty = getStyleProperty('transform');
    var is3d = !!getStyleProperty('perspective');
    proto.positionSlider = function () {
        var x = this.x;
        // wrap position around
        if (this.options.wrapAround && this.cells.length > 1) {
            x = utils.modulo(x, this.slideableWidth);
            x = x - this.slideableWidth;
            this.shiftWrapCells(x);
        }
        x = x + this.cursorPosition;
        // reverse if right-to-left and using transform
        x = this.options.rightToLeft && transformProperty ? -x : x;
        var value = this.getPositionValue(x);
        if (transformProperty) {
            // use 3D tranforms for hardware acceleration on iOS
            // but use 2D when settled, for better font-rendering
            this.slider.style[transformProperty] = is3d && this.isAnimating ?
                'translate3d(' + value + ',0,0)' : 'translateX(' + value + ')';
        } else {
            this.slider.style[this.originSide] = value;
        }
    };
    proto.positionSliderAtSelected = function () {
        if (!this.cells.length) {
            return;
        }
        var selectedCell = this.cells[this.selectedIndex];
        this.x = -selectedCell.target;
        this.positionSlider();
    };
    proto.getPositionValue = function (position) {
        if (this.options.percentPosition) {
            // percent position, round to 2 digits, like 12.34%
            return (Math.round((position / this.size.innerWidth) * 10000) * 0.01) + '%';
        } else {
            // pixel positioning
            return Math.round(position) + 'px';
        }
    };
    proto.settle = function (previousX) {
        // keep track of frames where x hasn't moved
        if (!this.isPointerDown && Math.round(this.x * 100) == Math.round(previousX * 100)) {
            this.restingFrames++;
        }
        // stop animating if resting for 3 or more frames
        if (this.restingFrames > 2) {
            this.isAnimating = false;
            delete this.isFreeScrolling;
            // render position with translateX when settled
            if (is3d) {
                this.positionSlider();
            }
            this.dispatchEvent('settle');
        }
    };
    proto.shiftWrapCells = function (x) {
        // shift before cells
        var beforeGap = this.cursorPosition + x;
        this._shiftCells(this.beforeShiftCells, beforeGap, -1);
        // shift after cells
        var afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);
        this._shiftCells(this.afterShiftCells, afterGap, 1);
    };
    proto._shiftCells = function (cells, gap, shift) {
        for (var i = 0, len = cells.length; i < len; i++) {
            var cell = cells[i];
            var cellShift = gap > 0 ? shift : 0;
            cell.wrapShift(cellShift);
            gap -= cell.size.outerWidth;
        }
    };
    proto._unshiftCells = function (cells) {
        if (!cells || !cells.length) {
            return;
        }
        for (var i = 0, len = cells.length; i < len; i++) {
            cells[i].wrapShift(0);
        }
    };
    // -------------------------- physics -------------------------- //
    proto.integratePhysics = function () {
        this.velocity += this.accel;
        this.x += this.velocity;
        this.velocity *= this.getFrictionFactor();
        // reset acceleration
        this.accel = 0;
    };
    proto.applyForce = function (force) {
        this.accel += force;
    };
    proto.getFrictionFactor = function () {
        return 1 - this.options[this.isFreeScrolling ? 'freeScrollFriction' : 'friction'];
    };
    proto.getRestingPosition = function () {
        // my thanks to Steven Wittens, who simplified this math greatly
        return this.x + this.velocity / (1 - this.getFrictionFactor());
    };
    proto.applySelectedAttraction = function () {
        // do not attract if pointer down or no cells
        var len = this.cells.length;
        if (this.isPointerDown || this.isFreeScrolling || !len) {
            return;
        }
        var cell = this.cells[this.selectedIndex];
        var wrap = this.options.wrapAround && len > 1 ?
            this.slideableWidth * Math.floor(this.selectedIndex / len) : 0;
        var distance = (cell.target + wrap) * -1 - this.x;
        var force = distance * this.options.selectedAttraction;
        this.applyForce(force);
    };
    return proto;

}));

(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('flickity/js/flickity', [
            'classie/classie',
            'eventEmitter/EventEmitter',
            'eventie/eventie',
            'get-size/get-size',
            'fizzy-ui-utils/utils',
            './cell',
            './animate'
        ], function (classie, EventEmitter, eventie, getSize, utils, Cell, animatePrototype) {
            return factory(window, classie, EventEmitter, eventie, getSize, utils, Cell, animatePrototype);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('desandro-classie'),
            require('wolfy87-eventemitter'),
            require('eventie'),
            require('get-size'),
            require('fizzy-ui-utils'),
            require('./cell'),
            require('./animate')
        );
    } else {
        var _Flickity = window.Flickity;
        window.Flickity = factory(
            window,
            window.classie,
            window.EventEmitter,
            window.eventie,
            window.getSize,
            window.fizzyUIUtils,
            _Flickity.Cell,
            _Flickity.animatePrototype
        );
    }

}(window, function factory(window, classie, EventEmitter, eventie, getSize,
    utils, Cell, animatePrototype) {
    // vars
    var jQuery = window.jQuery;
    var getComputedStyle = window.getComputedStyle;
    var console = window.console;
    function moveElements(elems, toElem) {
        elems = utils.makeArray(elems);
        while (elems.length) {
            toElem.appendChild(elems.shift());
        }
    }
    // -------------------------- Flickity -------------------------- //
    // globally unique identifiers
    var GUID = 0;
    // internal store of all Flickity intances
    var instances = {};
    function Flickity(element, options) {
        var queryElement = utils.getQueryElement(element);
        if (!queryElement) {
            if (console) {
                console.error('Bad element for Flickity: ' + (queryElement || element));
            }
            return;
        }
        this.element = queryElement;
        // add jQuery
        if (jQuery) {
            this.$element = jQuery(this.element);
        }
        // options
        this.options = utils.extend({}, this.constructor.defaults);
        this.option(options);
        // kick things off
        this._create();
    }
    Flickity.defaults = {
        accessibility: true,
        cellAlign: 'center',
        // cellSelector: undefined,
        // contain: false,
        freeScrollFriction: 0.075, // friction when free-scrolling
        friction: 0.28, // friction when selecting
        // initialIndex: 0,
        percentPosition: true,
        resize: true,
        selectedAttraction: 0.025,
        setGallerySize: true
        // watchCSS: false,
        // wrapAround: false
    };
    // hash of methods triggered on _create()
    Flickity.createMethods = [];
    // inherit EventEmitter
    utils.extend(Flickity.prototype, EventEmitter.prototype);
    Flickity.prototype._create = function () {
        // add id for Flickity.data
        var id = this.guid = ++GUID;
        this.element.flickityGUID = id; // expando
        instances[id] = this; // associate via id
        // initial properties
        this.selectedIndex = this.options.initialIndex || 0;
        // how many frames slider has been in same position
        this.restingFrames = 0;
        // initial physics properties
        this.x = 0;
        this.velocity = 0;
        this.accel = 0;
        this.originSide = this.options.rightToLeft ? 'right' : 'left';
        // create viewport & slider
        this.viewport = document.createElement('div');
        this.viewport.className = 'flickity-viewport';
        Flickity.setUnselectable(this.viewport);
        this._createSlider();
        if (this.options.resize || this.options.watchCSS) {
            eventie.bind(window, 'resize', this);
            this.isResizeBound = true;
        }
        for (var i = 0, len = Flickity.createMethods.length; i < len; i++) {
            var method = Flickity.createMethods[i];
            this[method]();
        }
        if (this.options.watchCSS) {
            this.watchCSS();
        } else {
            this.activate();
        }
    };
    Flickity.prototype.option = function (opts) {
        utils.extend(this.options, opts);
    };
    Flickity.prototype.activate = function () {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        classie.add(this.element, 'flickity-enabled');
        if (this.options.rightToLeft) {
            classie.add(this.element, 'flickity-rtl');
        }
        var cellElems = this._filterFindCellElements(this.element.children);
        moveElements(cellElems, this.slider);
        this.viewport.appendChild(this.slider);
        this.element.appendChild(this.viewport);
        this.getSize();
        // get cells from children
        this.reloadCells();
        this.setGallerySize();
        if (this.options.accessibility) {
            // allow element to focusable
            this.element.tabIndex = 0;
            // listen for key presses
            eventie.bind(this.element, 'keydown', this);
        }
        this.emit('activate');
        this.positionSliderAtSelected();
        this.select(this.selectedIndex);
    };
    // slider positions the cells
    Flickity.prototype._createSlider = function () {
        // slider element does all the positioning
        var slider = document.createElement('div');
        slider.className = 'flickity-slider';
        slider.style[this.originSide] = 0;
        this.slider = slider;
    };
    Flickity.prototype._filterFindCellElements = function (elems) {
        return utils.filterFindElements(elems, this.options.cellSelector);
    };
    Flickity.prototype.reloadCells = function () {
        // collection of item elements
        this.cells = this._makeCells(this.slider.children);
        this.positionCells();
        this._getWrapShiftCells();
        this.setGallerySize();
    };
    Flickity.prototype._makeCells = function (elems) {
        var cellElems = this._filterFindCellElements(elems);
        var cells = [];
        for (var i = 0, len = cellElems.length; i < len; i++) {
            var elem = cellElems[i];
            var cell = new Cell(elem, this);
            cells.push(cell);
        }
        return cells;
    };
    Flickity.prototype.getLastCell = function () {
        return this.cells[this.cells.length - 1];
    };
    Flickity.prototype.positionCells = function () {
        this._sizeCells(this.cells);
        this._positionCells(0);
    };
    Flickity.prototype._positionCells = function (index) {
        this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
        var cellX = 0;
        if (index > 0) {
            var startCell = this.cells[index - 1];
            cellX = startCell.x + startCell.size.outerWidth;
        }
        var cell;
        for (var len = this.cells.length, i = index; i < len; i++) {
            cell = this.cells[i];
            cell.setPosition(cellX);
            cellX += cell.size.outerWidth;
            this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
        }
        this.slideableWidth = cellX;
        this._containCells();
    };
    Flickity.prototype._sizeCells = function (cells) {
        for (var i = 0, len = cells.length; i < len; i++) {
            var cell = cells[i];
            cell.getSize();
        }
    };
    Flickity.prototype._init =
        Flickity.prototype.reposition = function () {
            this.positionCells();
            this.positionSliderAtSelected();
        };
    Flickity.prototype.getSize = function () {
        this.size = getSize(this.element);
        this.setCellAlign();
        this.cursorPosition = this.size.innerWidth * this.cellAlign;
    };
    var cellAlignShorthands = {
        // cell align, then based on origin side
        center: {
            left: 0.5,
            right: 0.5
        },
        left: {
            left: 0,
            right: 1
        },
        right: {
            right: 0,
            left: 1
        }
    };
    Flickity.prototype.setCellAlign = function () {
        var shorthand = cellAlignShorthands[this.options.cellAlign];
        this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
    };
    Flickity.prototype.setGallerySize = function () {
        if (this.options.setGallerySize) {
            this.viewport.style.height = this.maxCellHeight + 'px';
        }
    };
    Flickity.prototype._getWrapShiftCells = function () {
        if (!this.options.wrapAround) {
            return;
        }
        this._unshiftCells(this.beforeShiftCells);
        this._unshiftCells(this.afterShiftCells);
        var gapX = this.cursorPosition;
        var cellIndex = this.cells.length - 1;
        this.beforeShiftCells = this._getGapCells(gapX, cellIndex, -1);
        gapX = this.size.innerWidth - this.cursorPosition;
        this.afterShiftCells = this._getGapCells(gapX, 0, 1);
    };
    Flickity.prototype._getGapCells = function (gapX, cellIndex, increment) {
        var cells = [];
        while (gapX > 0) {
            var cell = this.cells[cellIndex];
            if (!cell) {
                break;
            }
            cells.push(cell);
            cellIndex += increment;
            gapX -= cell.size.outerWidth;
        }
        return cells;
    };
    Flickity.prototype._containCells = function () {
        if (!this.options.contain || this.options.wrapAround || !this.cells.length) {
            return;
        }
        var startMargin = this.options.rightToLeft ? 'marginRight' : 'marginLeft';
        var endMargin = this.options.rightToLeft ? 'marginLeft' : 'marginRight';
        var firstCellStartMargin = this.cells[0].size[startMargin];
        var lastCell = this.getLastCell();
        var contentWidth = this.slideableWidth - lastCell.size[endMargin];
        var endLimit = contentWidth - this.size.innerWidth * (1 - this.cellAlign);
        var isContentSmaller = contentWidth < this.size.innerWidth;
        for (var i = 0, len = this.cells.length; i < len; i++) {
            var cell = this.cells[i];
            cell.setDefaultTarget();
            if (isContentSmaller) {
                cell.target = contentWidth * this.cellAlign;
            } else {
                cell.target = Math.max(cell.target, this.cursorPosition + firstCellStartMargin);
                cell.target = Math.min(cell.target, endLimit);
            }
        }
    };
    Flickity.prototype.dispatchEvent = function (type, event, args) {
        var emitArgs = [event].concat(args);
        this.emitEvent(type, emitArgs);
        if (jQuery && this.$element) {
            if (event) {
                var $event = jQuery.Event(event);
                $event.type = type;
                this.$element.trigger($event, args);
            } else {
                this.$element.trigger(type, args);
            }
        }
    };
    Flickity.prototype.select = function (index, isWrap) {
        if (!this.isActive) {
            return;
        }
        var len = this.cells.length;
        if (this.options.wrapAround && len > 1) {
            if (index < 0) {
                this.x -= this.slideableWidth;
            } else if (index >= len) {
                this.x += this.slideableWidth;
            }
        }
        if (this.options.wrapAround || isWrap) {
            index = utils.modulo(index, len);
        }
        if (this.cells[index]) {
            this.selectedIndex = index;
            this.setSelectedCell();
            this.startAnimation();
            this.dispatchEvent('cellSelect');
        }
    };
    Flickity.prototype.previous = function (isWrap) {
        this.select(this.selectedIndex - 1, isWrap);
    };
    Flickity.prototype.next = function (isWrap) {
        this.select(this.selectedIndex + 1, isWrap);
    };
    Flickity.prototype.setSelectedCell = function () {
        this._removeSelectedCellClass();
        this.selectedCell = this.cells[this.selectedIndex];
        this.selectedElement = this.selectedCell.element;
        classie.add(this.selectedElement, 'is-selected');
    };
    Flickity.prototype._removeSelectedCellClass = function () {
        if (this.selectedCell) {
            classie.remove(this.selectedCell.element, 'is-selected');
        }
    };
    Flickity.prototype.getCell = function (elem) {
        for (var i = 0, len = this.cells.length; i < len; i++) {
            var cell = this.cells[i];
            if (cell.element == elem) {
                return cell;
            }
        }
    };
    Flickity.prototype.getCells = function (elems) {
        elems = utils.makeArray(elems);
        var cells = [];
        for (var i = 0, len = elems.length; i < len; i++) {
            var elem = elems[i];
            var cell = this.getCell(elem);
            if (cell) {
                cells.push(cell);
            }
        }
        return cells;
    };
    Flickity.prototype.getCellElements = function () {
        var cellElems = [];
        for (var i = 0, len = this.cells.length; i < len; i++) {
            cellElems.push(this.cells[i].element);
        }
        return cellElems;
    };
    Flickity.prototype.getParentCell = function (elem) {
        var cell = this.getCell(elem);
        if (cell) {
            return cell;
        }
        elem = utils.getParent(elem, '.flickity-slider > *');
        return this.getCell(elem);
    };
    // -------------------------- events -------------------------- //
    Flickity.prototype.uiChange = function () {
        this.emit('uiChange');
    };
    Flickity.prototype.childUIPointerDown = function (event) {
        this.emitEvent('childUIPointerDown', [event]);
    };
    // ----- resize ----- //
    Flickity.prototype.onresize = function () {
        this.watchCSS();
        this.resize();
    };
    utils.debounceMethod(Flickity, 'onresize', 150);
    Flickity.prototype.resize = function () {
        if (!this.isActive) {
            return;
        }
        this.getSize();
        // wrap values
        if (this.options.wrapAround) {
            this.x = utils.modulo(this.x, this.slideableWidth);
        }
        this.positionCells();
        this._getWrapShiftCells();
        this.setGallerySize();
        this.positionSliderAtSelected();
    };
    var supportsConditionalCSS = Flickity.supportsConditionalCSS = (function () {
        var supports;
        return function checkSupport() {
            if (supports !== undefined) {
                return supports;
            }
            if (!getComputedStyle) {
                supports = false;
                return;
            }
            // style body's :after and check that
            var style = document.createElement('style');
            var cssText = document.createTextNode('body:after { content: "foo"; display: none; }');
            style.appendChild(cssText);
            document.head.appendChild(style);
            var afterContent = getComputedStyle(document.body, ':after').content;
            // check if able to get :after content
            supports = afterContent.indexOf('foo') != -1;
            document.head.removeChild(style);
            return supports;
        };
    })();
    // watches the :after property, activates/deactivates
    Flickity.prototype.watchCSS = function () {
        var watchOption = this.options.watchCSS;
        if (!watchOption) {
            return;
        }
        var supports = supportsConditionalCSS();
        if (!supports) {
            // activate if watch option is fallbackOn
            var method = watchOption == 'fallbackOn' ? 'activate' : 'deactivate';
            this[method]();
            return;
        }
        var afterContent = getComputedStyle(this.element, ':after').content;
        // activate if :after { content: 'flickity' }
        if (afterContent.indexOf('flickity') != -1) {
            this.activate();
        } else {
            this.deactivate();
        }
    };
    // ----- keydown ----- //
    // go previous/next if left/right keys pressed
    Flickity.prototype.onkeydown = function (event) {
        // only work if element is in focus
        if (!this.options.accessibility ||
            (document.activeElement && document.activeElement != this.element)) {
            return;
        }
        if (event.keyCode == 37) {
            // go left
            var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
            this.uiChange();
            this[leftMethod]();
        } else if (event.keyCode == 39) {
            // go right
            var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
            this.uiChange();
            this[rightMethod]();
        }
    };
    // -------------------------- destroy -------------------------- //
    // deactivate all Flickity functionality, but keep stuff available
    Flickity.prototype.deactivate = function () {
        if (!this.isActive) {
            return;
        }
        classie.remove(this.element, 'flickity-enabled');
        classie.remove(this.element, 'flickity-rtl');
        // destroy cells
        for (var i = 0, len = this.cells.length; i < len; i++) {
            var cell = this.cells[i];
            cell.destroy();
        }
        this._removeSelectedCellClass();
        this.element.removeChild(this.viewport);
        // move child elements back into element
        moveElements(this.slider.children, this.element);
        if (this.options.accessibility) {
            this.element.removeAttribute('tabIndex');
            eventie.unbind(this.element, 'keydown', this);
        }
        // set flags
        this.isActive = false;
        this.emit('deactivate');
    };
    Flickity.prototype.destroy = function () {
        this.deactivate();
        if (this.isResizeBound) {
            eventie.unbind(window, 'resize', this);
        }
        this.emit('destroy');
        if (jQuery && this.$element) {
            jQuery.removeData(this.element, 'flickity');
        }
        delete this.element.flickityGUID;
        delete instances[this.guid];
    };
    utils.extend(Flickity.prototype, animatePrototype);
    var isIE8 = 'attachEvent' in window;
    Flickity.setUnselectable = function (elem) {
        if (!isIE8) {
            return;
        }
        elem.setAttribute('unselectable', 'on');
    };
    Flickity.data = function (elem) {
        elem = utils.getQueryElement(elem);
        var id = elem && elem.flickityGUID;
        return id && instances[id];
    };
    utils.htmlInit(Flickity, 'flickity');
    if (jQuery && jQuery.bridget) {
        jQuery.bridget('flickity', Flickity);
    }
    Flickity.Cell = Cell;
    return Flickity;

}));

(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('unipointer/unipointer', [
            'eventEmitter/EventEmitter',
            'eventie/eventie'
        ], function (EventEmitter, eventie) {
            return factory(window, EventEmitter, eventie);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('wolfy87-eventemitter'),
            require('eventie')
        );
    } else {
        window.Unipointer = factory(
            window,
            window.EventEmitter,
            window.eventie
        );
    }

}(window, function factory(window, EventEmitter, eventie) {
    function noop() { }
    function Unipointer() { }
    Unipointer.prototype = new EventEmitter();
    Unipointer.prototype.bindStartEvent = function (elem) {
        this._bindStartEvent(elem, true);
    };
    Unipointer.prototype.unbindStartEvent = function (elem) {
        this._bindStartEvent(elem, false);
    };
    Unipointer.prototype._bindStartEvent = function (elem, isBind) {
        isBind = isBind === undefined ? true : !!isBind;
        var bindMethod = isBind ? 'bind' : 'unbind';
        if (window.navigator.pointerEnabled) {
            eventie[bindMethod](elem, 'pointerdown', this);
        } else if (window.navigator.msPointerEnabled) {
            eventie[bindMethod](elem, 'MSPointerDown', this);
        } else {
            eventie[bindMethod](elem, 'mousedown', this);
            eventie[bindMethod](elem, 'touchstart', this);
        }
    };
    Unipointer.prototype.handleEvent = function (event) {
        var method = 'on' + event.type;
        if (this[method]) {
            this[method](event);
        }
    };
    // returns the touch that we're keeping track of
    Unipointer.prototype.getTouch = function (touches) {
        for (var i = 0, len = touches.length; i < len; i++) {
            var touch = touches[i];
            if (touch.identifier == this.pointerIdentifier) {
                return touch;
            }
        }
    };
    // ----- start event ----- //
    Unipointer.prototype.onmousedown = function (event) {
        // dismiss clicks from right or middle buttons
        var button = event.button;
        if (button && (button !== 0 && button !== 1)) {
            return;
        }
        this._pointerDown(event, event);
    };
    Unipointer.prototype.ontouchstart = function (event) {
        this._pointerDown(event, event.changedTouches[0]);
    };
    Unipointer.prototype.onMSPointerDown =
        Unipointer.prototype.onpointerdown = function (event) {
            this._pointerDown(event, event);
        };
    Unipointer.prototype._pointerDown = function (event, pointer) {
        if (this.isPointerDown) {
            return;
        }
        this.isPointerDown = true;
        this.pointerIdentifier = pointer.pointerId !== undefined ?
            pointer.pointerId : pointer.identifier;
        this.pointerDown(event, pointer);
    };
    Unipointer.prototype.pointerDown = function (event, pointer) {
        this._bindPostStartEvents(event);
        this.emitEvent('pointerDown', [this, event, pointer]);
    };
    // hash of events to be bound after start event
    var postStartEvents = {
        mousedown: ['mousemove', 'mouseup'],
        touchstart: ['touchmove', 'touchend', 'touchcancel'],
        pointerdown: ['pointermove', 'pointerup', 'pointercancel'],
        MSPointerDown: ['MSPointerMove', 'MSPointerUp', 'MSPointerCancel']
    };
    Unipointer.prototype._bindPostStartEvents = function (event) {
        if (!event) {
            return;
        }
        // get proper events to match start event
        var events = postStartEvents[event.type];
        // IE8 needs to be bound to document
        var node = event.preventDefault ? window : document;
        // bind events to node
        for (var i = 0, len = events.length; i < len; i++) {
            var evnt = events[i];
            eventie.bind(node, evnt, this);
        }
        // save these arguments
        this._boundPointerEvents = {
            events: events,
            node: node
        };
    };
    Unipointer.prototype._unbindPostStartEvents = function () {
        var args = this._boundPointerEvents;
        // IE8 can trigger dragEnd twice, check for _boundEvents
        if (!args || !args.events) {
            return;
        }
        for (var i = 0, len = args.events.length; i < len; i++) {
            var event = args.events[i];
            eventie.unbind(args.node, event, this);
        }
        delete this._boundPointerEvents;
    };
    Unipointer.prototype.onmousemove = function (event) {
        this._pointerMove(event, event);
    };
    Unipointer.prototype.onMSPointerMove =
        Unipointer.prototype.onpointermove = function (event) {
            if (event.pointerId == this.pointerIdentifier) {
                this._pointerMove(event, event);
            }
        };
    Unipointer.prototype.ontouchmove = function (event) {
        var touch = this.getTouch(event.changedTouches);
        if (touch) {
            this._pointerMove(event, touch);
        }
    };
    Unipointer.prototype._pointerMove = function (event, pointer) {
        this.pointerMove(event, pointer);
    };
    Unipointer.prototype.pointerMove = function (event, pointer) {
        this.emitEvent('pointerMove', [this, event, pointer]);
    };
    Unipointer.prototype.onmouseup = function (event) {
        this._pointerUp(event, event);
    };
    Unipointer.prototype.onMSPointerUp =
        Unipointer.prototype.onpointerup = function (event) {
            if (event.pointerId == this.pointerIdentifier) {
                this._pointerUp(event, event);
            }
        };
    Unipointer.prototype.ontouchend = function (event) {
        var touch = this.getTouch(event.changedTouches);
        if (touch) {
            this._pointerUp(event, touch);
        }
    };
    Unipointer.prototype._pointerUp = function (event, pointer) {
        this._pointerDone();
        this.pointerUp(event, pointer);
    };
    Unipointer.prototype.pointerUp = function (event, pointer) {
        this.emitEvent('pointerUp', [this, event, pointer]);
    };
    Unipointer.prototype._pointerDone = function () {
        this.isPointerDown = false;
        delete this.pointerIdentifier;
        this._unbindPostStartEvents();
        this.pointerDone();
    };
    Unipointer.prototype.pointerDone = noop;
    // ----- pointer cancel ----- //
    Unipointer.prototype.onMSPointerCancel =
        Unipointer.prototype.onpointercancel = function (event) {
            if (event.pointerId == this.pointerIdentifier) {
                this._pointerCancel(event, event);
            }
        };
    Unipointer.prototype.ontouchcancel = function (event) {
        var touch = this.getTouch(event.changedTouches);
        if (touch) {
            this._pointerCancel(event, touch);
        }
    };
    Unipointer.prototype._pointerCancel = function (event, pointer) {
        this._pointerDone();
        this.pointerCancel(event, pointer);
    };
    Unipointer.prototype.pointerCancel = function (event, pointer) {
        this.emitEvent('pointerCancel', [this, event, pointer]);
    };
    Unipointer.getPointerPoint = function (pointer) {
        return {
            x: pointer.pageX !== undefined ? pointer.pageX : pointer.clientX,
            y: pointer.pageY !== undefined ? pointer.pageY : pointer.clientY
        };
    };
    return Unipointer;

}));

(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('unidragger/unidragger', [
            'eventie/eventie',
            'unipointer/unipointer'
        ], function (eventie, Unipointer) {
            return factory(window, eventie, Unipointer);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('eventie'),
            require('unipointer')
        );
    } else {
        window.Unidragger = factory(
            window,
            window.eventie,
            window.Unipointer
        );
    }

}(window, function factory(window, eventie, Unipointer) {
    function noop() { }
    // handle IE8 prevent default
    function preventDefaultEvent(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }
    function getParentLink(elem) {
        while (elem != document.body) {
            elem = elem.parentNode;
            if (elem.nodeName == 'A') {
                return elem;
            }
        }
    }
    // -------------------------- Unidragger -------------------------- //
    function Unidragger() { }
    // inherit Unipointer & EventEmitter
    Unidragger.prototype = new Unipointer();
    Unidragger.prototype.bindHandles = function () {
        this._bindHandles(true);
    };
    Unidragger.prototype.unbindHandles = function () {
        this._bindHandles(false);
    };
    var navigator = window.navigator;
    Unidragger.prototype._bindHandles = function (isBind) {
        isBind = isBind === undefined ? true : !!isBind;
        var binderExtra;
        if (navigator.pointerEnabled) {
            binderExtra = function (handle) {
                handle.style.touchAction = isBind ? 'none' : '';
            };
        } else if (navigator.msPointerEnabled) {
            binderExtra = function (handle) {
                handle.style.msTouchAction = isBind ? 'none' : '';
            };
        } else {
            binderExtra = function () {
                if (isBind) {
                    disableImgOndragstart(handle);
                }
            };
        }
        // bind each handle
        var bindMethod = isBind ? 'bind' : 'unbind';
        for (var i = 0, len = this.handles.length; i < len; i++) {
            var handle = this.handles[i];
            this._bindStartEvent(handle, isBind);
            binderExtra(handle);
            eventie[bindMethod](handle, 'click', this);
        }
    };
    // remove default dragging interaction on all images in IE8
    // IE8 does its own drag thing on images, which messes stuff up
    function noDragStart() {
        return false;
    }
    // TODO replace this with a IE8 test
    var isIE8 = 'attachEvent' in document.documentElement;
    // IE8 only
    var disableImgOndragstart = !isIE8 ? noop : function (handle) {
        if (handle.nodeName == 'IMG') {
            handle.ondragstart = noDragStart;
        }
        var images = handle.querySelectorAll('img');
        for (var i = 0, len = images.length; i < len; i++) {
            var img = images[i];
            img.ondragstart = noDragStart;
        }
    };
    var allowTouchstartNodes = Unidragger.allowTouchstartNodes = {
        INPUT: true,
        A: true,
        BUTTON: true,
        SELECT: true
    };
    Unidragger.prototype.pointerDown = function (event, pointer) {
        this._dragPointerDown(event, pointer);
        var focused = document.activeElement;
        if (focused && focused.blur) {
            focused.blur();
        }
        this._bindPostStartEvents(event);
        this.emitEvent('pointerDown', [this, event, pointer]);
    };
    Unidragger.prototype._dragPointerDown = function (event, pointer) {
        this.pointerDownPoint = Unipointer.getPointerPoint(pointer);
        var targetNodeName = event.target.nodeName;
        var isTouchstartNode = event.type == 'touchstart' &&
            (allowTouchstartNodes[targetNodeName] || getParentLink(event.target));
        if (!isTouchstartNode && targetNodeName != 'SELECT') {
            preventDefaultEvent(event);
        }
    };
    Unidragger.prototype.pointerMove = function (event, pointer) {
        var moveVector = this._dragPointerMove(event, pointer);
        this.emitEvent('pointerMove', [this, event, pointer, moveVector]);
        this._dragMove(event, pointer, moveVector);
    };
    Unidragger.prototype._dragPointerMove = function (event, pointer) {
        var movePoint = Unipointer.getPointerPoint(pointer);
        var moveVector = {
            x: movePoint.x - this.pointerDownPoint.x,
            y: movePoint.y - this.pointerDownPoint.y
        };
        if (!this.isDragging && this.hasDragStarted(moveVector)) {
            this._dragStart(event, pointer);
        }
        return moveVector;
    };
    Unidragger.prototype.hasDragStarted = function (moveVector) {
        return Math.abs(moveVector.x) > 3 || Math.abs(moveVector.y) > 3;
    };
    Unidragger.prototype.pointerUp = function (event, pointer) {
        this.emitEvent('pointerUp', [this, event, pointer]);
        this._dragPointerUp(event, pointer);
    };
    Unidragger.prototype._dragPointerUp = function (event, pointer) {
        if (this.isDragging) {
            this._dragEnd(event, pointer);
        } else {
            this._staticClick(event, pointer);
        }
    };
    Unidragger.prototype._dragStart = function (event, pointer) {
        this.isDragging = true;
        this.dragStartPoint = Unidragger.getPointerPoint(pointer);
        this.isPreventingClicks = true;
        this.dragStart(event, pointer);
    };
    Unidragger.prototype.dragStart = function (event, pointer) {
        this.emitEvent('dragStart', [this, event, pointer]);
    };
    Unidragger.prototype._dragMove = function (event, pointer, moveVector) {
        if (!this.isDragging) {
            return;
        }
        this.dragMove(event, pointer, moveVector);
    };
    Unidragger.prototype.dragMove = function (event, pointer, moveVector) {
        this.emitEvent('dragMove', [this, event, pointer, moveVector]);
    };
    // dragEnd
    Unidragger.prototype._dragEnd = function (event, pointer) {
        // set flags
        this.isDragging = false;
        // re-enable clicking async
        var _this = this;
        setTimeout(function () {
            delete _this.isPreventingClicks;
        });
        this.dragEnd(event, pointer);
    };
    Unidragger.prototype.dragEnd = function (event, pointer) {
        this.emitEvent('dragEnd', [this, event, pointer]);
    };
    Unidragger.prototype.onclick = function (event) {
        if (this.isPreventingClicks) {
            preventDefaultEvent(event);
        }
    };
    Unidragger.prototype._staticClick = function (event, pointer) {
        if (event.target.nodeName == 'INPUT' && event.target.type == 'text') {
            event.target.focus();
        }
        this.staticClick(event, pointer);
    };
    Unidragger.prototype.staticClick = function (event, pointer) {
        this.emitEvent('staticClick', [this, event, pointer]);
    };
    Unidragger.getPointerPoint = function (pointer) {
        return {
            x: pointer.pageX !== undefined ? pointer.pageX : pointer.clientX,
            y: pointer.pageY !== undefined ? pointer.pageY : pointer.clientY
        };
    };
    Unidragger.getPointerPoint = Unipointer.getPointerPoint;
    return Unidragger;

}));

(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('flickity/js/drag', [
            'classie/classie',
            'eventie/eventie',
            './flickity',
            'unidragger/unidragger',
            'fizzy-ui-utils/utils'
        ], function (classie, eventie, Flickity, Unidragger, utils) {
            return factory(window, classie, eventie, Flickity, Unidragger, utils);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('desandro-classie'),
            require('eventie'),
            require('./flickity'),
            require('unidragger'),
            require('fizzy-ui-utils')
        );
    } else {
        window.Flickity = window.Flickity || {};
        window.Flickity.dragPrototype = factory(
            window,
            window.classie,
            window.eventie,
            window.Flickity,
            window.Unidragger,
            window.fizzyUIUtils
        );
    }

}(window, function factory(window, classie, eventie, Flickity, Unidragger, utils) {
    // handle IE8 prevent default
    function preventDefaultEvent(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }
    // ----- defaults ----- //
    utils.extend(Flickity.defaults, {
        draggable: true,
        touchVerticalScroll: true
    });
    // ----- create ----- //
    Flickity.createMethods.push('_createDrag');
    // -------------------------- drag prototype -------------------------- //
    var proto = {};
    utils.extend(proto, Unidragger.prototype);
    // --------------------------  -------------------------- //
    proto._createDrag = function () {
        this.on('activate', this.bindDrag);
        this.on('uiChange', this._uiChangeDrag);
        this.on('childUIPointerDown', this._childUIPointerDownDrag);
        this.on('deactivate', this.unbindDrag);
    };
    proto.bindDrag = function () {
        if (!this.options.draggable || this.isDragBound) {
            return;
        }
        classie.add(this.element, 'is-draggable');
        this.handles = [this.viewport];
        this.bindHandles();
        this.isDragBound = true;
    };
    proto.unbindDrag = function () {
        if (!this.isDragBound) {
            return;
        }
        classie.remove(this.element, 'is-draggable');
        this.unbindHandles();
        delete this.isDragBound;
    };
    proto.hasDragStarted = function (moveVector) {
        return Math.abs(moveVector.x) > 3;
    };
    proto._uiChangeDrag = function () {
        delete this.isFreeScrolling;
    };
    proto._childUIPointerDownDrag = function (event) {
        preventDefaultEvent(event);
        this.pointerDownFocus(event);
    };
    // -------------------------- pointer events -------------------------- //
    proto.pointerDown = function (event, pointer) {
        this._dragPointerDown(event, pointer);
        // kludge to blur focused inputs in dragger
        var focused = document.activeElement;
        if (focused && focused.blur && focused != this.element) {
            focused.blur();
        }
        this.pointerDownFocus(event);
        // stop if it was moving
        this.velocity = 0;
        classie.add(this.viewport, 'is-pointer-down');
        // bind move and end events
        this._bindPostStartEvents(event);
        this.dispatchEvent('pointerDown', event, [pointer]);
    };
    var touchStartEvents = {
        touchstart: true,
        MSPointerDown: true
    };
    var focusNodes = {
        INPUT: true,
        SELECT: true
    };
    proto.pointerDownFocus = function (event) {
        // focus element, if not touch, and its not an input or select
        if (this.options.accessibility && !touchStartEvents[event.type] &&
            !focusNodes[event.target.nodeName]) {
            this.element.focus();
        }
    };
    proto.pointerMove = function (event, pointer) {
        var moveVector = this._dragPointerMove(event, pointer);
        this.touchVerticalScrollMove(event, pointer, moveVector);
        this._dragMove(event, pointer, moveVector);
        this.dispatchEvent('pointerMove', event, [pointer, moveVector]);
    };
    proto.pointerUp = function (event, pointer) {
        delete this.isTouchScrolling;
        classie.remove(this.viewport, 'is-pointer-down');
        this.dispatchEvent('pointerUp', event, [pointer]);
        this._dragPointerUp(event, pointer);
    };
    // -------------------------- vertical scroll -------------------------- //
    var touchScrollEvents = {
        // move events
        // mousemove: true,
        touchmove: true,
        MSPointerMove: true
    };
    // position of pointer, relative to window
    function getPointerWindowY(pointer) {
        var pointerPoint = Unidragger.getPointerPoint(pointer);
        return pointerPoint.y - window.pageYOffset;
    }
    proto.touchVerticalScrollMove = function (event, pointer, moveVector) {
        if (!this.options.touchVerticalScroll || !touchScrollEvents[event.type]) {
            return;
        }
        // don't start vertical scrolling until pointer has moved 16 pixels in a direction
        if (!this.isTouchScrolling && Math.abs(moveVector.y) > 16) {
            // start touch vertical scrolling
            // scroll & pointerY when started
            this.startScrollY = window.pageYOffset;
            this.pointerWindowStartY = getPointerWindowY(pointer);
            // start scroll animation
            this.isTouchScrolling = true;
        }
        if (!this.isTouchScrolling) {
            return;
        }
        // scroll window
        var scrollDelta = this.pointerWindowStartY - getPointerWindowY(pointer);
        var scrollY = this.startScrollY + scrollDelta;
        window.scroll(window.pageXOffset, scrollY);
    };
    proto.dragStart = function (event, pointer) {
        this.dragStartPosition = this.x;
        this.startAnimation();
        this.dispatchEvent('dragStart', event, [pointer]);
    };
    proto.dragMove = function (event, pointer, moveVector) {
        this.previousDragX = this.x;
        var movedX = moveVector.x;
        var direction = this.options.rightToLeft ? -1 : 1;
        this.x = this.dragStartPosition + movedX * direction;
        if (!this.options.wrapAround && this.cells.length) {
            var originBound = Math.max(-this.cells[0].target, this.dragStartPosition);
            this.x = this.x > originBound ? (this.x - originBound) * 0.5 + originBound : this.x;
            var endBound = Math.min(-this.getLastCell().target, this.dragStartPosition);
            this.x = this.x < endBound ? (this.x - endBound) * 0.5 + endBound : this.x;
        }
        this.previousDragMoveTime = this.dragMoveTime;
        this.dragMoveTime = new Date();
        this.dispatchEvent('dragMove', event, [pointer, moveVector]);
    };
    proto.dragEnd = function (event, pointer) {
        this.dragEndFlick();
        if (this.options.freeScroll) {
            this.isFreeScrolling = true;
        }
        var index = this.dragEndRestingSelect();
        if (this.options.freeScroll && !this.options.wrapAround) {
            var restingX = this.getRestingPosition();
            this.isFreeScrolling = -restingX > this.cells[0].target &&
                -restingX < this.getLastCell().target;
        } else if (!this.options.freeScroll && index == this.selectedIndex) {
            index += this.dragEndBoostSelect();
        }
        this.select(index);
        this.dispatchEvent('dragEnd', event, [pointer]);
    };
    proto.dragEndFlick = function () {
        if (!isFinite(this.previousDragX)) {
            return;
        }
        var timeDelta = this.dragMoveTime - this.previousDragMoveTime;
        if (timeDelta) {
            timeDelta /= 1000 / 60;
            var xDelta = this.x - this.previousDragX;
            this.velocity = xDelta / timeDelta;
        }
        delete this.previousDragX;
    };
    proto.dragEndRestingSelect = function () {
        var restingX = this.getRestingPosition();
        var distance = Math.abs(this.getCellDistance(-restingX, this.selectedIndex));
        var positiveResting = this._getClosestResting(restingX, distance, 1);
        var negativeResting = this._getClosestResting(restingX, distance, -1);
        var index = positiveResting.distance < negativeResting.distance ?
            positiveResting.index : negativeResting.index;
        if (this.options.contain && !this.options.wrapAround) {
            index = Math.abs(index - this.selectedIndex) <= 1 ? this.selectedIndex : index;
        }
        return index;
    };
    proto._getClosestResting = function (restingX, distance, increment) {
        var index = this.selectedIndex;
        var minDistance = Infinity;
        var condition = this.options.contain && !this.options.wrapAround ?
            function (d, md) { return d <= md; } : function (d, md) { return d < md; };
        while (condition(distance, minDistance)) {
            index += increment;
            minDistance = distance;
            distance = this.getCellDistance(-restingX, index);
            if (distance === null) {
                break;
            }
            distance = Math.abs(distance);
        }
        return {
            distance: minDistance,
            index: index - increment
        };
    };
    proto.getCellDistance = function (x, index) {
        var len = this.cells.length;
        var isWrapAround = this.options.wrapAround && len > 1;
        var cellIndex = isWrapAround ? utils.modulo(index, len) : index;
        var cell = this.cells[cellIndex];
        if (!cell) {
            return null;
        }
        var wrap = isWrapAround ? this.slideableWidth * Math.floor(index / len) : 0;
        return x - (cell.target + wrap);
    };
    proto.dragEndBoostSelect = function () {
        var distance = this.getCellDistance(-this.x, this.selectedIndex);
        if (distance > 0 && this.velocity < -1) {
            // if moving towards the right, and positive velocity, and the next attractor
            return 1;
        } else if (distance < 0 && this.velocity > 1) {
            return -1;
        }
        return 0;
    };
    proto.staticClick = function (event, pointer) {
        var clickedCell = this.getParentCell(event.target);
        var cellElem = clickedCell && clickedCell.element;
        var cellIndex = clickedCell && utils.indexOf(this.cells, clickedCell);
        this.dispatchEvent('staticClick', event, [pointer, cellElem, cellIndex]);
    };
    utils.extend(Flickity.prototype, proto);
    return Flickity;
}));

(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('tap-listener/tap-listener', [
            'unipointer/unipointer'
        ], function (Unipointer) {
            return factory(window, Unipointer);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('unipointer')
        );
    } else {
        window.TapListener = factory(
            window,
            window.Unipointer
        );
    }

}(window, function factory(window, Unipointer) {
    function TapListener(elem) {
        this.bindTap(elem);
    }
    TapListener.prototype = new Unipointer();
    TapListener.prototype.bindTap = function (elem) {
        if (!elem) {
            return;
        }
        this.unbindTap();
        this.tapElement = elem;
        this._bindStartEvent(elem, true);
    };
    TapListener.prototype.unbindTap = function () {
        if (!this.tapElement) {
            return;
        }
        this._bindStartEvent(this.tapElement, true);
        delete this.tapElement;
    };
    var isPageOffset = window.pageYOffset !== undefined;
    TapListener.prototype.pointerUp = function (event, pointer) {
        var pointerPoint = Unipointer.getPointerPoint(pointer);
        var boundingRect = this.tapElement.getBoundingClientRect();
        // standard or IE8 scroll positions
        var scrollX = isPageOffset ? window.pageXOffset : document.body.scrollLeft;
        var scrollY = isPageOffset ? window.pageYOffset : document.body.scrollTop;
        var isInside = pointerPoint.x >= boundingRect.left + scrollX &&
            pointerPoint.x <= boundingRect.right + scrollX &&
            pointerPoint.y >= boundingRect.top + scrollY &&
            pointerPoint.y <= boundingRect.bottom + scrollY;
        if (isInside) {
            this.emitEvent('tap', [this, event, pointer]);
        }
    };
    TapListener.prototype.destroy = function () {
        this.pointerDone();
        this.unbindTap();
    };
    return TapListener;

}));
(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('flickity/js/prev-next-button', [
            'eventie/eventie',
            './flickity',
            'tap-listener/tap-listener',
            'fizzy-ui-utils/utils'
        ], function (eventie, Flickity, TapListener, utils) {
            return factory(window, eventie, Flickity, TapListener, utils);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('eventie'),
            require('./flickity'),
            require('tap-listener'),
            require('fizzy-ui-utils')
        );
    } else {
        window.Flickity = window.Flickity || {};
        window.Flickity.PrevNextButton = factory(
            window,
            window.eventie,
            window.Flickity,
            window.TapListener,
            window.fizzyUIUtils
        );
    }

}(window, function factory(window, eventie, Flickity, TapListener, utils) {
    var svgURI = 'http://www.w3.org/2000/svg';
    var supportsInlineSVG = (function () {
        var supports;
        function checkSupport() {
            if (supports !== undefined) {
                return supports;
            }
            var div = document.createElement('div');
            div.innerHTML = '<svg/>';
            supports = (div.firstChild && div.firstChild.namespaceURI) == svgURI;
            return supports;
        }
        return checkSupport;
    })();
    function PrevNextButton(direction, parent) {
        this.direction = direction;
        this.parent = parent;
        this._create();
    }
    PrevNextButton.prototype = new TapListener();
    PrevNextButton.prototype._create = function () {
        this.isEnabled = true;
        this.isPrevious = this.direction == -1;
        var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
        this.isLeft = this.direction == leftDirection;
        var element = this.element = document.createElement('button');
        element.className = 'flickity-prev-next-button';
        element.className += this.isPrevious ? ' previous' : ' next';
        element.setAttribute('type', 'button');
        Flickity.setUnselectable(element);
        if (supportsInlineSVG()) {
            var svg = this.createSVG();
            element.appendChild(svg);
        } else {
            this.setArrowText();
            element.className += ' no-svg';
        }
        var _this = this;
        this.onCellSelect = function () {
            _this.update();
        };
        this.parent.on('cellSelect', this.onCellSelect);
        this.on('tap', this.onTap);
        this.on('pointerDown', function onPointerDown(button, event) {
            _this.parent.childUIPointerDown(event);
        });
    };
    PrevNextButton.prototype.activate = function () {
        this.update();
        this.bindTap(this.element);
        eventie.bind(this.element, 'click', this);
        this.parent.element.appendChild(this.element);
    };
    PrevNextButton.prototype.deactivate = function () {
        this.parent.element.removeChild(this.element);
        TapListener.prototype.destroy.call(this);
        eventie.unbind(this.element, 'click', this);
    };
    PrevNextButton.prototype.createSVG = function () {
        var svg = document.createElementNS(svgURI, 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        var path = document.createElementNS(svgURI, 'path');
        path.setAttribute('d', 'M 50,0 L 60,10 L 20,50 L 60,90 L 50,100 L 0,50 Z');
        path.setAttribute('class', 'arrow');
        var arrowTransform = this.isLeft ? 'translate(15,0)' :
            'translate(85,100) rotate(180)';
        path.setAttribute('transform', arrowTransform);
        svg.appendChild(path);
        return svg;
    };
    PrevNextButton.prototype.setArrowText = function () {
        var parentOptions = this.parent.options;
        var arrowText = this.isLeft ? parentOptions.leftArrowText : parentOptions.rightArrowText;
        utils.setText(this.element, arrowText);
    };
    PrevNextButton.prototype.onTap = function () {
        if (!this.isEnabled) {
            return;
        }
        this.parent.uiChange();
        var method = this.isPrevious ? 'previous' : 'next';
        this.parent[method]();
    };
    PrevNextButton.prototype.handleEvent = utils.handleEvent;
    PrevNextButton.prototype.onclick = function () {
        var focused = document.activeElement;
        if (focused && focused == this.element) {
            this.onTap();
        }
    };
    PrevNextButton.prototype.enable = function () {
        if (this.isEnabled) {
            return;
        }
        this.element.disabled = false;
        this.isEnabled = true;
    };
    PrevNextButton.prototype.disable = function () {
        if (!this.isEnabled) {
            return;
        }
        this.element.disabled = true;
        this.isEnabled = false;
    };
    PrevNextButton.prototype.update = function () {
        var cells = this.parent.cells;
        if (this.parent.options.wrapAround && cells.length > 1) {
            this.enable();
            return;
        }
        var lastIndex = cells.length ? cells.length - 1 : 0;
        var boundIndex = this.isPrevious ? 0 : lastIndex;
        var method = this.parent.selectedIndex == boundIndex ? 'disable' : 'enable';
        this[method]();
    };
    PrevNextButton.prototype.destroy = function () {
        this.deactivate();
    };
    utils.extend(Flickity.defaults, {
        prevNextButtons: true,
        leftArrowText: '‹',
        rightArrowText: '›'
    });
    Flickity.createMethods.push('_createPrevNextButtons');
    Flickity.prototype._createPrevNextButtons = function () {
        if (!this.options.prevNextButtons) {
            return;
        }
        this.prevButton = new PrevNextButton(-1, this);
        this.nextButton = new PrevNextButton(1, this);
        this.on('activate', this.activatePrevNextButtons);
    };
    Flickity.prototype.activatePrevNextButtons = function () {
        this.prevButton.activate();
        this.nextButton.activate();
        this.on('deactivate', this.deactivatePrevNextButtons);
    };
    Flickity.prototype.deactivatePrevNextButtons = function () {
        this.prevButton.deactivate();
        this.nextButton.deactivate();
        this.off('deactivate', this.deactivatePrevNextButtons);
    };
    Flickity.PrevNextButton = PrevNextButton;
    return PrevNextButton;

}));

(function (window, factory) {
    if (typeof define == 'function' && define.amd) {
        define('flickity/js/page-dots', [
            'eventie/eventie',
            './flickity',
            'tap-listener/tap-listener',
            'fizzy-ui-utils/utils'
        ], function (eventie, Flickity, TapListener, utils) {
            return factory(window, eventie, Flickity, TapListener, utils);
        });
    } else if (typeof exports == 'object') {
        module.exports = factory(
            window,
            require('eventie'),
            require('./flickity'),
            require('tap-listener'),
            require('fizzy-ui-utils')
        );
    } else {
        window.Flickity = window.Flickity || {};
        window.Flickity.PageDots = factory(
            window,
            window.eventie,
            window.Flickity,
            window.TapListener,
            window.fizzyUIUtils
        );
    }

}(window, function factory(window, eventie, Flickity, TapListener, utils) {
    function PageDots(parent) {
        this.parent = parent;
        this._create();
    }
    PageDots.prototype = new TapListener();
    PageDots.prototype._create = function () {
        // create holder element
        this.holder = document.createElement('ol');
        this.holder.className = 'flickity-page-dots';
        Flickity.setUnselectable(this.holder);
        // create dots, array of elements
        this.dots = [];
        // update on select
        var _this = this;
        this.onCellSelect = function () {
            _this.updateSelected();
        };
        this.parent.on('cellSelect', this.onCellSelect);
        // tap
        this.on('tap', this.onTap);
        // pointerDown
        this.on('pointerDown', function onPointerDown(button, event) {
            _this.parent.childUIPointerDown(event);
        });
    };
    PageDots.prototype.activate = function () {
        this.setDots();
        this.updateSelected();
        this.bindTap(this.holder);
        // add to DOM
        this.parent.element.appendChild(this.holder);
    };
    PageDots.prototype.deactivate = function () {
        // remove from DOM
        this.parent.element.removeChild(this.holder);
        TapListener.prototype.destroy.call(this);
    };
    PageDots.prototype.setDots = function () {
        // get difference between number of cells and number of dots
        var delta = this.parent.cells.length - this.dots.length;
        if (delta > 0) {
            this.addDots(delta);
        } else if (delta < 0) {
            this.removeDots(-delta);
        }
    };
    PageDots.prototype.addDots = function (count) {
        var fragment = document.createDocumentFragment();
        var newDots = [];
        while (count) {
            var dot = document.createElement('li');
            dot.className = 'dot';
            fragment.appendChild(dot);
            newDots.push(dot);
            count--;
        }
        this.holder.appendChild(fragment);
        this.dots = this.dots.concat(newDots);
    };
    PageDots.prototype.removeDots = function (count) {
        // remove from this.dots collection
        var removeDots = this.dots.splice(this.dots.length - count, count);
        // remove from DOM
        for (var i = 0, len = removeDots.length; i < len; i++) {
            var dot = removeDots[i];
            this.holder.removeChild(dot);
        }
    };
    PageDots.prototype.updateSelected = function () {
        // remove selected class on previous
        if (this.selectedDot) {
            this.selectedDot.className = 'dot';
        }
        // don't proceed if no dots
        if (!this.dots.length) {
            return;
        }
        this.selectedDot = this.dots[this.parent.selectedIndex];
        this.selectedDot.className = 'dot is-selected';
    };
    PageDots.prototype.onTap = function (instance, event) {
        var target = event.target;
        if (target.nodeName != 'LI') {
            return;
        }
        this.parent.uiChange();
        var index = utils.indexOf(this.dots, target);
        this.parent.select(index);
    };
    PageDots.prototype.destroy = function () {
        this.deactivate();
    };
    Flickity.PageDots = PageDots;
    utils.extend(Flickity.defaults, {
        pageDots: true
    });
    Flickity.createMethods.push('_createPageDots');
    Flickity.prototype._createPageDots = function () {
        if (!this.options.pageDots) {
            return;
        }
        this.pageDots = new PageDots(this);
        this.on('activate', this.activatePageDots);
        this.on('cellAddedRemoved', this.onCellAddedRemovedPageDots);
        this.on('deactivate', this.deactivatePageDots);
    };
    Flickity.prototype.activatePageDots = function () {
        this.pageDots.activate();
    };
    Flickity.prototype.onCellAddedRemovedPageDots = function () {
        this.pageDots.setDots();
    };
    Flickity.prototype.deactivatePageDots = function () {
        this.pageDots.deactivate();
    };
    Flickity.PageDots = PageDots;
    return PageDots;
}));