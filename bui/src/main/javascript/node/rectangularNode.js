(function(bui) {
    var identifier = 'RectangularNode';

    // generate a path's arc data parameter
    // http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
    var arcParameter = function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag,
                              x, y) {
        return [rx,
                ',',
                ry,
                ' ',
                xAxisRotation,
                ' ',
                largeArcFlag,
                ',',
                sweepFlag,
                ' ',
                x,
                ',',
                y].join('');
    };

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the rectangular shape
     * @param {Number} height Height of the rectangular shape
     * @param {Number} tr Top border radius of the rectangular shape
     * @param {Number} br Bottom border radius of the rectangular shape
     * @return {String} a path's data attribute value
     */
    var generatePathData = function(width, height, tr, br, shift) {
        var data = [];

        var sx = 0, sy = 0
        if (shift != undefined){
            sx = shift.x;
            sy = shift.y
        }
        // start point in top-middle of the rectangle
        data.push('M' + (width / 2 + sx) +  ',' + sy);

        // next we go to the right
        data.push('H' + (width - tr + sx));

        if (tr > 0) {
            // now we draw the arc in the top-right corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, width+sx, tr+sy));
        }

        // next we go down
        data.push('V' + (height - br + sy));

        if (br > 0) {
            // now we draw the arc in the lower-right corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, width - br +sx,
                    height+sy));
        }

        // now we go to the left
        data.push('H' + (br+sx));

        if (br > 0) {
            // now we draw the arc in the lower-left corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, sx, height - br+sy));
        }

        // next we go up
        data.push('V' + (tr+sy));

        if (tr > 0) {
            // now we draw the arc in the top-left corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, tr+sx, sy));
        }

        // and we close the path
        data.push('Z');

        return data.join(' ');
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private position / size listener
     */
    var formChanged = function() {
        var privates = this._privates(identifier);
        var size = this.size();
        privates.rect.setAttributeNS(null, 'd', generatePathData(size.width,
                size.height, privates.topRadius, privates.bottomRadius));
        if (privates.is_multimer == true){
            privates.multimer_rect.setAttributeNS(null, 'd', generatePathData(size.width, 
                size.height, privates.topRadius, privates.bottomRadius, {x: 9, y:9}));
        }
        if (privates.is_cloned == true){
            privates.clone_rect.setAttributeNS(null, 'd', generatePathData(size.width, 
                size.height, privates.topRadius, privates.bottomRadius));
            privates.clippath_path.setAttributeNS(null, 'width', size.width);
            privates.clippath_path.setAttributeNS(null, 'height', size.height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(size.height/3));
        }

    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.rect.style.setProperty('fill', color.background);
        privates.rect.style.setProperty('stroke', color.border);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.rect = document.createElementNS(bui.svgns, 'path');
        var size = this.size();
        formChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.rect);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.RectangularNode = function() {
        bui.RectangularNode.superClazz.apply(this, arguments);
        this._addType(bui.RectangularNode.ListenerType);

        var listener = formChanged.createDelegate(this);
        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                listener,
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.topRadius,
                listener,
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.bottomRadius,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.topRadius = 0;
        privates.bottomRadius = 0;
        privates.is_multimer = false;
        privates.is_cloned = false;

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.rectangle);
    };

    bui.RectangularNode.prototype = {
        
        identifier : function() {
            return identifier;
        },
        /**
         * Set this node's radius for both upper corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        topRadius : function(radius) {
            var privates = this._privates(identifier);

            if (radius !== undefined) {
                if (privates.topRadius !== radius) {
                    privates.topRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.topRadius,
                            [this, radius]);
                }

                return this;
            }

            return privates.topRadius;
        },

        /**
         * Set this node's radius for both lower corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        bottomRadius : function(radius) {
            var privates = this._privates(identifier);

            if (radius !== undefined) {
                if (privates.bottomRadius !== radius) {
                    privates.bottomRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.bottomRadius,
                            [this, radius]);
                }

                return this;
            }

            return privates.bottomRadius;
        },
        /**
         * Set this node's multimer state.
         *
         * @param {Bool} [flag] optional flag to set multimer state
         * @return {bui.RectangularNode|Bool} Fluent interface if you pass
         *   a parameter, the current multimer status otherwise.
         */
        multimer : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined) {
                if (flag!=privates.is_multimer){
                    var container = this.nodeGroup();
                    privates.is_multimer = flag;
                    if (flag==true){
                        privates.multimer_rect = document.createElementNS(bui.svgns, 'path');
                        container.insertBefore(privates.multimer_rect, container.firstChild);
                        formChanged.call(this);
                    }else{
                        container.removeChild(privates.multimer_rect);
                    }
                }
                return this;
            }
            return privates.is_multimer;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag==true){
                        privates.clone_rect = document.createElementNS(bui.svgns, 'path');
                        privates.clone_rect.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_rect);
                        privates.clone_rect.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect')
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        formChanged.call(this);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_rect);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this
            }
            return privates.is_cloned;
        },
        toJSON : function() {
          var json = bui.RectangularNode.superClazz.prototype.toJSON.call(this),
                  privates = this._privates(identifier),
                  dataFormat = bui.settings.dataFormat;

          if (privates.is_multimer) {
            json.data.multimer=true;
          } else {
            delete json.data.multimer;
          }

          return json;
        }

    };

    bui.util.setSuperClass(bui.RectangularNode, bui.Labelable);

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.RectangularNode.ListenerType = {
        /** @field */
        topRadius : bui.util.createListenerTypeId(),
        /** @field */
        bottomRadius : bui.util.createListenerTypeId()
    };
})(bui);
