(function(bui) {
    // used to identify and compare the graph instances
    var graphCounter = 0;

    var identifier = 'Graph';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Graph} graph
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(graph) {
        return identifier + graph.id();
    };

    /**
     * @private
     * Used to generate the transform attribute value of the _rootGroup
     * element. Extracted to a function as this may be required several
     * times.
     */
    var __setTransformString = function() {
        var privates = this._privates(identifier);
        var value = [
                ['scale(', privates.scale.toString(), ')'].join(''),
                ['translate(', privates.x, ', ', privates.y, ')'].join('')
            ].join(' ');

        privates.rootGroup.setAttribute('transform', value);
    };

    /**
     * @private
     * Extracted because this function is called from the constructor and from
     * rawSVG in order to replace it for the export process.
     */
    var __getStylesheetContents = function() {
        return '@import url("' + bui.settings.css.stylesheetUrl + '\");';
    };

    var gestureStart = function(event) {
        // Only fire if event isn't propagating from a child element
            this.fire(bui.Graph.ListenerType.gestureStart, [this, event]);
    };

    var gestureMove = function(event) {
            this.fire(bui.Graph.ListenerType.gestureMove, [this, event]);
    };

    var gestureEnd = function(event) {
            this.fire(bui.Graph.ListenerType.gestureEnd, [this, event]);
    };

    var dragStart = function(event) {
            this.fire(bui.Graph.ListenerType.dragStart, [this, event]);
    };

    var dragMove = function(event) {
            this.fire(bui.Graph.ListenerType.dragMove, [this, event]);
    };

    var dragEnd = function(event) {
            this.fire(bui.Graph.ListenerType.dragEnd, [this, event]);
    };

    var mouseWheel = function(event) {
        this.fire(bui.Graph.ListenerType.wheel, [this, event]);
    };
    
    var gesturePanAndZoom = function(graph, event) {
        var privates = graph._privates(identifier),
            newScale = privates.scale * (1 + event.ds),
            dx,
            dy;

        if (newScale > 0) {
            // Scaling the graph calls reduceCanvasSize(). This brings it back to place.
            dx = privates.x;
            dy = privates.y;
            
            if (privates.enablePanning) {
                // So that the graph follows the gesture
                dx += event.dx / newScale;
                dy += event.dy / newScale;
            }
        
            if (privates.enableZooming) {
                // So that the graph is scaled with the gesture cordinate as the center
                dx -= ((event.pageX - privates.rootOffset.x) * event.ds) / newScale;
                dy -= ((event.pageY - privates.rootOffset.y) * event.ds) / newScale;
                
                graph.scale(newScale);
            }
            graph.translate(dx, dy);
        }
     };
     
    // create eventListener delegate functions
    var panStart = function (graph, event) {
        var privates = graph._privates(identifier);
        
        if (!privates.enablePanning) {
            return event;
        }
        privates.panPosition = graph.translate();
    };
    
    var panMove = function (graph, event) {
        var privates = graph._privates(identifier);
        
        if (!privates.enablePanning) {
            return event;
        }
        
        if ((event.type === 'dragmove' && this.highPerformance()) ||
            (event.type === 'dragend' && !this.highPerformance())) {
            
            privates.panPosition.x += event.dx / privates.scale;
            privates.panPosition.y += event.dy / privates.scale;

            this.translate(privates.panPosition.x, privates.panPosition.y);
        }
    };
    
    var wheelZoom = function (graph, event) {
        var privates = graph._privates(identifier);
        
        if (!privates.enableZooming || !event.altKey) {
            return event;
        }
        
        event.preventDefault();
        
        var wheelDelta = event.wheelDelta || event.deltaY * -1 || event.detail,
            ds = 0.2 * (wheelDelta > 0? 1: -1),
            newScale = privates.scale * (1 + ds),
            dx,
            dy;

        if (newScale > 0 && wheelDelta !== 0) {
            // Scaling the graph calls reduceCanvasSize(). This brings it back to place.
            dx = privates.x;
            dy = privates.y;
        
            // So that the graph is scaled with the gesture cordinate as the center
            dx -= ((event.pageX - privates.rootOffset.x) * ds) / newScale;
            dy -= ((event.pageY - privates.rootOffset.y) * ds) / newScale;
            
            graph.scale(newScale);
            graph.translate(dx, dy);
        }
    };

    /**
     * @private
     * Extracted from the constructor to improve readability
     */
    var __initialPaintGraph = function() {
        var privates = this._privates(identifier);

        var div = document.createElement('div');
        privates.container.appendChild(div);

        privates.root = document.createElementNS(bui.svgns, 'svg');
        privates.root.setAttribute('xmlns', bui.svgns);
        privates.root.setAttribute('id', privates.id);
        div.appendChild(privates.root);

        var offset = jQuery(privates.root).offset();
        privates.rootOffset = {
            x : offset.left,
            y : offset.top
        };

        privates.rootDimensions = {
            width : jQuery(privates.root).width(),
            height : jQuery(privates.root).height()
        };

        privates.defsGroup = document.createElementNS(bui.svgns, 'defs');
        privates.root.appendChild(privates.defsGroup);

        privates.css = document.createElementNS(bui.svgns, 'style');
        privates.css.setAttribute('type', 'text/css');
        privates.css.textContent = __getStylesheetContents();
        privates.root.appendChild(privates.css);

        privates.rootGroup = document.createElementNS(bui.svgns, 'g');
        __setTransformString.call(this);
        privates.root.appendChild(privates.rootGroup);

        privates.nodeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.nodeGroup);

        privates.edgeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.edgeGroup);

        privates.connectingArcs = {};

        privates.stateVarLocation = document.createElementNS(bui.svgns, 'pattern');
        privates.stateVarLocation.setAttribute('id', 'stateVariableLocation');
        privates.stateVarLocation.setAttribute('patternUnits','objectBoundingBox');
        privates.stateVarLocation.setAttribute('x','0');
        privates.stateVarLocation.setAttribute('y', '0');
        privates.stateVarLocation.setAttribute('width', '14');
        privates.stateVarLocation.setAttribute('height', '14');
        privates.locationRect = document.createElementNS(bui.svgns, 'path');
        privates.locationRect.setAttribute('d' , 'M0,14 L14,0 M7,7 L14,14 Z');
        privates.locationRect.setAttribute('style', "stroke-width:2;stroke:rgb(0,0,0)")
        privates.stateVarLocation.appendChild(privates.locationRect);
        privates.defsGroup.appendChild(privates.stateVarLocation);

        for (var i in bui.connectingArcs) {
            if (bui.connectingArcs.hasOwnProperty(i)) {
                var ca = bui.connectingArcs[i]();
                var id = bui.connectingArcs[i].id;
                privates.connectingArcs[id] = ca;

                privates.defsGroup.appendChild(ca.element);
                privates.defsGroup.appendChild(ca.hoverElement);
            }
        }
        
        privates.root.addEventListener(
                ('onmousewheel' in document)
                ? 'mousewheel'
                : 'wheel',
                mouseWheel.createDelegate(this));
            
        // Add interact.js event listeners
        
        
        // Set as interactable
        interact.set(privates.root, {
                draggable   : true,
                gestureable : true,
                autoScroll  : false,
                actionCheck : function (event) {
                    return 'drag';
                },
				checkOnHover: false
            })
            .bind('gesturemove', gestureMove.createDelegate(this))
            .bind('dragstart', dragStart.createDelegate(this))
            .bind('dragmove', dragMove.createDelegate(this))
            .bind('dragend', dragEnd.createDelegate(this));
    };

    /**
     * @private
     * This function makes sure that each node fits onto the SVG canvas.
     * In order to do so it's a observer of the nodes' position and size
     * events.
     */
    var __assertCanvasSize = function(node) {
        var privates = this._privates(identifier);

        var bottomRight = node.absoluteBottomRight();

        if (bottomRight.x > privates.rootDimensions.width) {
            privates.rootDimensions.width = bottomRight.x + privates.x;
            privates.root.setAttribute('width', bottomRight.x + privates.x);
        }

        if (bottomRight.y > privates.rootDimensions.height) {
            privates.rootDimensions.height = bottomRight.y + privates.y;
            privates.root.setAttribute('height', bottomRight.y + privates.y);
        }
    };

    /**
     * @private
     * Generic drawable remove listener.
     */
    var __removed = function(drawable) {
        delete this._privates(identifier).drawables[drawable.id()];
    };

    /**
     * @class
     * This class controls the whole graph and is responsible for the
     * management of nodes and edges, i.e. drawables.
     *
     * @extends bui.Observable
     * @constructor
     *
     * @param {HTMLElement} container where the graph should go
     */
    bui.Graph = function(container) {
        bui.Graph.superClazz.call(this);

        this._addType(bui.Graph.ListenerType);

        var privates = this._privates(identifier);
        privates.id = bui.settings.idPrefix.graph + graphCounter++;
        privates.container = container;
        if ( container == null ) {    // don't break here, just throw a message
            console.error('Warning: Invalid container element specified. Using document.body instead.');
            privates.container = document.body;
        }
        privates.drawables = {};
        privates.idCounter = 0;
        privates.scale = 1;
        privates.x = 0;
        privates.y = 0;
        privates.enablePanning = true;
        privates.enableZooming = true;
        privates.highPerformance = bui.settings.initialHighPerformance;

        this.bind(bui.Graph.ListenerType.dragStart,
                panStart.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.dragMove,
                panMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.dragEnd,
                panMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.gestureMove,
                gesturePanAndZoom.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.wheel,
                wheelZoom.createDelegate(this),
                listenerIdentifier(this));

        __initialPaintGraph.call(this);
    };

    bui.Graph.prototype = {
	identifier : function() {
	    return identifier;
	},
        /**
         * @description
         * Retrieve the graph's id.
         *
         * @return {String} graph id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * Retrieve the SVG element's offset relative to the document
         *
         * @return {Object} an object with x and y properties
         */
        htmlTopLeft : function() {
            return this._privates(identifier).rootOffset;
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        topLeft : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        absolutePosition : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * @description
         * Retrieve the container which was provided to this object during
         * the creation.
         *
         * @return {HTMLElement} The container of this graph
         */
        container : function() {
            return this._privates(identifier).container;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all egdes are placed.
         *
         * @return {SVGGElement} Edge container
         */
        edgeGroup : function() {
            return this._privates(identifier).edgeGroup;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all nodes are placed.
         *
         * @return {SVGGElement} Node container
         */
        nodeGroup : function() {
            return this._privates(identifier).nodeGroup;
        },
        /**
         * Return the defs group of the svg so node classes can draw clone markers, ...
         *
         * @return {} SVG defsGroup
         */
        defsGroup : function() {
            return  this._privates(identifier).defsGroup;
        },

        /**
         * @description
         * Use this method to deactivate (suspend) redrawing of the SVG. This
         * function is most useful when multiple changes are made to the SVG
         * to improve performance significantly.
         *
         * @param {Integer} duration how long you wish to suspend redrawing
         * @return {Object} A suspend handle which can be passed to
         *   {@link bui.Graph#unsuspendRedraw} to enable redrawing.
         */
        suspendRedraw : function(duration) {
            if (bui.settings.staticSVG) return 0; 
            return this._privates(identifier).root.suspendRedraw(duration);
        },

        /**
         * @description
         * Used to enable redrawing. You can either unsuspend a specific
         * suspension by passing the suspend handle to this function or
         * unsuspend all by passing no parameter.
         *
         * @param {Object} [handle] the suspend handle. Can be omitted to
         *   unsuspend all.
         * @return {bui.Graph} Fluent interface
         */
        unsuspendRedraw : function(handle) {
            if (bui.settings.staticSVG) return; 
            if (handle !== undefined) {
                this._privates(identifier).root.unsuspendRedraw(handle);
            } else {
                this._privates(identifier).root.unsuspendRedrawAll();
            }

            return this;
        },

        /**
         * @description
         * Used to enable/disable panning of a graph from gesture or dragging
         *
         * If you omit the parameter a value for whether panning is
         * enabled is returned.
         *
         * @param {Boolean} [pan] True to enable panning or
         *   false to disable.
         * @return {bui.Graph|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the graph will be returned.
         */
        enablePanning : function(pan) {
            var privates = this._privates(identifier);

            if (pan !== undefined) {
                if (privates.enablePanning !== pan) {
                    privates.enablePanning = pan;
                }
                return this;
            }

            return privates.enablePanning;
        },

        /**
         * @description
         * Used to enable/disable zooming of a graph from mouse Wheel
         * or pinch gesture
         *
         * If you omit the parameter a value for whether zooming is
         * enabled is returned.
         *
         * @param {Boolean} [zoom] True to enable zooming or
         *   false to disable.
         * @return {bui.Graph|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the graph will be returned.
         */
        enableZooming : function(zoom) {
            var privates = this._privates(identifier);

            if (zoom !== undefined) {
                if (privates.enableZooming !== zoom) {
                    privates.enableZooming = zoom;
                }
                return this;
            }

            return privates.enableZooming;
        },

        /**
         * @description
         * Scale the graph by passing a number to this function. To have the
         * standard scale level pass one (1) to this function. To double the
         * size pass two (2).
         *
         * You can also retrieve the current scale by calling this function
         * without parameters.
         *
         * @param {Number} [scale] The new scale, one (1) means 100%.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current scale is returned
         */
        scale : function(scale) {
            var privates = this._privates(identifier);

            if (scale !== undefined) {
                if (scale !== privates.scale) {
                    privates.scale = scale;

                    __setTransformString.call(this);
                    this.reduceCanvasSize();

                    this.fire(bui.Graph.ListenerType.scale, [this, scale]);
                }

                return this;
            }

            return privates.scale;
        },

        /**
         * @description
         * Transate the graph or retrieve the current translation
         *
         * @param {Number} [x] The new translation in x-axis.
         * @param {Number} [y] The new translation in y-axis.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current translation is returned
         */
        translate : function(x, y) {
            var privates = this._privates(identifier);

            if (x !== undefined && y !== undefined) {
                if (x !== privates.x || y !== privates.y) {
                    privates.x = x;
                    privates.y = y;

                    __setTransformString.call(this);
                    this.reduceCanvasSize();

                    this.fire(bui.Graph.ListenerType.translate, [this, x, y]);
                }

                return this;
            }

            return {
                x: privates.x,
                y: privates.y
            };
        },

        /**
         * @description
         * Get the graph coordinates that correspond to a point on the page
         * This does not take into account the offset of the graph's SVG Element
         *
         * @param {Number} [x] The x value of the cordinates
         * @param {Number} [y] The y value of the cordinates
         * @return {Object} An object with properties x and y which are the transformed coordinates
         */
        toGraphCoords : function(x, y) {
            var privates = this._privates(identifier);

            return {
                x: x / privates.scale - privates.x,
                y: y / privates.scale - privates.y
            };
        },

        /**
         * @description
         * Get the page coordinates that correspond to a point on the graph
         * This does not take into account the offset of the graph's SVG Element
         *
         * @param {Number} [x] The x value of the cordinates
         * @param {Number} [y] The y value of the cordinates
         * @return {Object} An object with properties x and y which are the transformed coordinates
         */
        toPageCoords : function(x, y) {
            var privates = this._privates(identifier);

            return {
                x: (x + privates.x) * privates.scale,
                y: (y + privates.y) * privates.scale
            };
        },

        /**
        /**
         * Fit the Graph to the viewport, i.e. scale the graph down to show
         * the whole graph or (in the case  of a very small graph) scale it
         * up.
         *
         * @return {bui.Graph} Fluent interface
         */
        fitToPage : function() {
            var dimensions = this._privates(identifier).rootDimensions;
            
            this.translate(0,0);
            this.scale(1);

            var viewportWidth = $(window).width();
            var viewportHeight = $(window).height();

            var scale = Math.min(viewportWidth / dimensions.width,
                    viewportHeight / dimensions.height);
            this.scale(scale);

            return this;
        },

        /**
         * @description
         * Add a drawable to this graph by calling this function with the
         * constructor of a drawable type. The object will be completely
         * instantiated and associated to the graph, thus ready to be used.
         *
         * @param {Function} constructor The constructor function for the
         *   drawable.
         * @param {Object} [params] Parameters which should be supplied to the
         *   constructor.
         * @return {bui.Drawable} The constructed drawable object.
         */
        add : function(constructor, id, params) {
            var privates = this._privates(identifier);
            var drawable = null;
            var counter_id = privates.idCounter++;

            if (params === undefined) {
                params = {};
            }

            if (id == undefined)
                params.id = 'drawable'+counter_id
            else
                params.id = id;
            if (privates.drawables.hasOwnProperty(id)) console.log("graph: adding duplicate id " + id);
            
            params.graph = this;

            drawable = new constructor(params);

            privates.drawables[drawable.id()] = drawable;

            drawable.bind(bui.Drawable.ListenerType.remove,
                    __removed.createDelegate(this),
                    listenerIdentifier(this));

            // every node type has a bottomRight property. We use this to
            // identify them.
            if (drawable.bottomRight !== undefined) {
                drawable.bind(bui.Node.ListenerType.position,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                drawable.bind(bui.Node.ListenerType.size,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                this.reduceCanvasSize.call(this, drawable);
            }

            this.fire(bui.Graph.ListenerType.add, [drawable]);

            return drawable;
        },

        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        
        clear : function() {
           var privates = this._privates(identifier);
           for (var i in privates.drawables){
              privates.drawables[i].remove();
           }
           //privates.idCounter=0;
        },
 
        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        reduceCanvasSize : function() {
            var privates = this._privates(identifier);

            var maxX = Number.MIN_VALUE,
                    maxY = Number.MIN_VALUE;

            for (var i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    var drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        var bottomRight = drawable.absoluteBottomRight();

                        maxX = Math.max(maxX, bottomRight.x + privates.x);
                        maxY = Math.max(maxY, bottomRight.y + privates.y);
                    }
                }
            }

            var padding = bui.settings.style.graphReduceCanvasPadding;
            maxX = Math.max((maxX + padding) * privates.scale, padding);
            maxY = Math.max((maxY + padding) * privates.scale, padding);

            privates.rootDimensions.width = maxX;
            privates.root.setAttribute('width', maxX);

            privates.rootDimensions.height = maxY * privates.scale;
            privates.root.setAttribute('height', maxY);
        },

        /**
         * Retrieve the connecting arcs.
         *
         * @return {Object} You will retrieve the connecting arcs
         * in the following form:
         * {
         *   stimulation : { // id of the connecting arc type
         *     id : 'foo', // the id with which the marker can be referenced
         *     element : {} // instance of SVGMarkerElement
         *   },
         *   // more types may be here
         * }
         */
        connectingArcs : function() {
            return this._privates(identifier).connectingArcs;
        },

        /**
         * Return the raw SVG.
         *
         * Please note that the execution of this method may take a while as an
         * additional HTTP request needs to be made in order to retrieve the
         * stylesheet. The result is the complete SVG with embedded CSS.
         *
         * @return {String} The raw SVG as it can be used to save / export it.
         */
        rawSVG : function() {
            var inner = this._privates(identifier).root.parentNode.innerHTML;

            var css = '';

            jQuery.ajax({
                        url : bui.settings.css.stylesheetUrl,
                        async : false,
                        dataType : 'text',
                        success : function(data) {
                            css = data;
                        }
                    });

            inner = inner.replace(__getStylesheetContents(), css);

            return inner;
        },
 
 
         /**
         * replace the css import directive in svg by an actual css code and return SVG.
         *
         *
         * @return {String} The raw SVG as it can be used to save / export it.
         */
         cssSVG : function(css) {
            var inner = this._privates(identifier).root.parentNode.innerHTML;
            
            inner = inner.replace(__getStylesheetContents(), css);
            
            return inner;
         },
 
        /**
         * A graph supports a high and low performance mode. This has
         * implications on the way dragging and resizing is realized. When in
         * high performance mode the SVG will be changed while dragging or
         * resizing the node. In low performance mode this will only be done
         * at the end of the dragging or resizing.
         *
         * @param {Boolean} [highPerformance] Set the performance for this
         *   graph to high (true) or low (false). Omit to retrieve current
         *   performance setting.
         * @return {Boolean|bui.Graph} If you pass a boolean to this function
         *   it will set the new value and return the instance of the object
         *   on which you called the function (fluent interface). If you don't
         *   pass a parameter the current setting will be removed.
         */
        highPerformance : function(highPerformance) {
            var privates = this._privates(identifier);

            if (highPerformance !== undefined) {
                privates.highPerformance = highPerformance;
                return this;
            }

            return privates.highPerformance;
        },

        /**
         * Retrieve an object which holds references to all the graph's
         * drawables.
         *
         * @return {Object} Key/value store of the graph's drawables. The keys
         *   are the drawable's IDs. The value is the drawable instance
         *   reference.
         */
        drawables : function() {
            return this._privates(identifier).drawables;
        },

        /**
         * Export the whole graph to JSON.
         *
         * @return {Object} The exported graph.
         */
        toJSON : function(useDataObject) {
            var json = {sbgnlang:bui.settings.SBGNlang}, edges = [], nodes = [];

            var dataFormat = bui.settings.dataFormat;
            updateJson(json, dataFormat.nodes, nodes);
            updateJson(json, dataFormat.edges, edges);

            var drawables = this._privates(identifier).drawables;

            for (var key in drawables) {
                if (drawables.hasOwnProperty(key) &&
                        drawables[key].includeInJSON !== false) {
                    var drawable = drawables[key];

                    if (drawable.drawableType() === 'node') {
                        nodes.push(drawable.toJSON());
                    } else {
                        edges.push(drawable.toJSON());
                    }
                }
            }

            return json;
        },

        /**
         * Reduce the whitespace on top and left hand side of the graph. This
         * isn't done automatically through the
         * {@link bui.Graph#reduceCanvasSize} method as this would probably
         * confuse the user.
         *
         * @param {Boolean} [duration] Pass a duration in milliseconds to
         *   animate the whitespace reduction. Defaults to no animation.
         * @return {bui.Graph} Fluent interface
         */
        reduceTopLeftWhitespace : function(duration) {
            duration = duration || 0;
            var padding = bui.settings.style.graphReduceCanvasPadding,
                    privates = this._privates(identifier),
                    minX = Number.MAX_VALUE,
                    minY = Number.MAX_VALUE,
                    i,
                    drawable,
                    topLeft;

            for (i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        topLeft = drawable.absolutePosition();

                        minX = Math.min(minX, topLeft.x);
                        minY = Math.min(minY, topLeft.y);
                    }
                }
            }

            minX = Math.max(minX - padding, 0) * -1;
            minY = Math.max(minY - padding, 0) * -1;

            if (minX !== 0 || minY !== 0) {
                for (i in privates.drawables) {
                    if (privates.drawables.hasOwnProperty(i)) {
                        drawable = privates.drawables[i];

                        if (drawable.bottomRight !== undefined &&
                                drawable.hasParent() === false) {
                            topLeft = drawable.position();

                            drawable.move(minX, minY, duration);
                        }
                    }
                }
            }

            return this;
        },
        /**
         * get or set the language
         * fluent interface
         *
         * @return string current SBGN language
         */
         language : function(lang){
            if(lang === undefined){
                return bui.settings.SBGNlang;
            }
            if(lang in {'ER':1,'PD':1,'AF':1}) bui.settings.SBGNlang = lang;
            return this;
         },
         modificationSupport: function(enable){
            bui.settings.enableModificationSupport = enable;
         }
    };

    bui.util.setSuperClass(bui.Graph, bui.Observable);

    /**
     * @namespace
     * Observable properties of the Graph class
     */
    bui.Graph.ListenerType = {
        /** @field */
        add : bui.util.createListenerTypeId(),
        /** @field */
        scale : bui.util.createListenerTypeId(),
        /** @field */
        translate : bui.util.createListenerTypeId(),
        /** @field */
        dragStart : bui.util.createListenerTypeId(),
        /** @field */
        dragMove : bui.util.createListenerTypeId(),
        /** @field */
        dragEnd : bui.util.createListenerTypeId(),
        /** @field */
        gestureStart : bui.util.createListenerTypeId(),
        /** @field */
        gestureMove : bui.util.createListenerTypeId(),
        /** @field */
        gestureEnd : bui.util.createListenerTypeId(),
        /** @field */
        wheel : bui.util.createListenerTypeId()
    };
})(bui);
