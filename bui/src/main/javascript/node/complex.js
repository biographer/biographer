
(function(bui) {
    var identifier = 'Complex';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Complex} Complex
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Complex) {
        return identifier + Complex.id();
    };
    var generatePathData = function(node, width, height, shift) {
        var cornerRadius = bui.settings.style.complexCornerRadius;

        var sx = 0, sy = 0;
        if (shift !== undefined){
            sx = shift.x;
            sy = shift.y;
        }
        return ['M', width / 2 +sx, sy,
                'H', width - cornerRadius +sx,
                'L', width +sx, cornerRadius +sx,
                'V', height - cornerRadius +sy,
                'L', width - cornerRadius +sx, height +sy,
                'H', cornerRadius +sy,
                'L', sx, height - cornerRadius +sy,
                'V', cornerRadius +sy,
                'L', cornerRadius +sx, sy,
                'H', width / 2 +sx].join(' ');
    };
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier);
        privates.path.setAttributeNS(null, 'd', generatePathData(node,width,height));
        if (privates.is_multimer === true){
            privates.multimer_path.setAttributeNS(null, 'd', generatePathData(node,width,height,{x:10,y:10}));
        }
        if (privates.is_cloned === true){
            privates.clone_path.setAttributeNS(null, 'd', generatePathData(node,width,height));
            privates.clippath_path.setAttributeNS(null, 'width', width);
            privates.clippath_path.setAttributeNS(null, 'height', height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(height/3));
        }
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.path);
    };
    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @class
     * Class for SBGN complexes.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Complex = function() {
        bui.Labelable.apply(this, arguments);
        
        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
         this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.complex);
        var privates = this._privates(identifier);
        privates.is_multimer = false;
        privates.is_cloned = false;
    };

    bui.Complex.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 90,
        _minHeight : 90,
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
                    if (flag===true){
                        var size = this.size();
                        privates.multimer_path = document.createElementNS(bui.svgns, 'path');
                        container.insertBefore(privates.multimer_path, container.firstChild);
                        sizeChanged.call(this, this, size.width, size.height);
                    }else{
                        container.removeChild(privates.multimer_path);
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
                    if (flag===true){
                        privates.clone_path = document.createElementNS(bui.svgns, 'path');
                        privates.clone_path.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_path);
                        privates.clone_path.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect');
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_path);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this;
            }
            return privates.is_cloned;
        },
        /**
         * Automatically layout child elements using a simple table layout
         * strategy. You can change the strategy's settings through the first
         * parameter. The structure of this object should be like
         * bui.settings.style.complexTableLayout.
         * @param {Object} [settings] Settings for the layout process.
         *   Defaults to bui.settings.style.complexTableLayout when not
         *   provided.
         */
        tableLayout : function(settings) {
            if (settings === undefined) {
                settings = bui.settings.style.complexTableLayout;
            }

            if (settings.showBorder === true) {
                this.removeClass(bui.settings.css.classes.hideBorder);
            } else {
                this.addClass(bui.settings.css.classes.hideBorder);
            }

            // the items of the table array represent rows. Row items represent
            // columns
            var table = [[]];

            var children = this.childrenWithoutAuxiliaryUnits();

            var maxColumnsOrRow = Math.max(1,
                    Math.round(Math.sqrt(children.length)));

            var addToTable;

            if (settings.restrictNumberOfColumns === true) {
                /**
                 * @private
                 */
                addToTable = function(node) {
                    var lastRow = table[table.length - 1];

                    if (lastRow.length === maxColumnsOrRow) {
                        lastRow = [];
                        table.push(lastRow);
                    }

                    lastRow.push(node);
                };
            } else {
                var lastRow = 0;
                /**
                 * @private
                 */
                addToTable = function(node) {
                    var row = table[lastRow];

                    if (row === undefined) {
                        row = [];
                        table[lastRow] = row;
                    }

                    row.push(node);

                    lastRow++;

                    if (lastRow >= maxColumnsOrRow) {
                        lastRow = 0;
                    }
                };
            }

            var subComplexSettings = {};
            // copy original settings
            for (var key in settings) {
                if (settings.hasOwnProperty(key)) {
                    subComplexSettings[key] = settings[key];
                }
            }
            subComplexSettings.padding *= 0.7;
            subComplexSettings.restrictNumberOfColumns =
                    !subComplexSettings.restrictNumberOfColumns;

            if (subComplexSettings.padding < 4) {
                subComplexSettings.showBorder = false;
                subComplexSettings.padding = 0;
            }

            for (var i = 0; i < children.length; i++) {
                var node = children[i];

                if (node instanceof bui.Complex) {
                    node.tableLayout(subComplexSettings);
                }

                addToTable(node);
            }

            var totalWidth = Number.MIN_VALUE,
                    totalHeight = settings.padding;

            for (var rowId = 0; rowId < table.length; rowId++) {
                var row = table[rowId];

                var totalColumnWidth = settings.padding,
                        highestColumn = Number.MIN_VALUE;

                for (var columnId = 0; columnId < row.length; columnId++) {
                    // each column holds a node, i.e. a bui.Node instance
                    var columnNode = row[columnId];

                    var size = columnNode.size();
                    highestColumn = Math.max(size.height, highestColumn);

                    columnNode.position(totalColumnWidth, totalHeight);

                    // this probably needs to go to the end of the loop
                    totalColumnWidth += size.width + settings.padding;
                }
                totalHeight += highestColumn + settings.padding;
                totalWidth = Math.max(totalWidth, totalColumnWidth);
            }
            this.size(totalWidth, totalHeight);
        },
        toJSON : function() {
          var json = bui.Complex.superClazz.prototype.toJSON.call(this),
                  privates = this._privates(identifier),
                  dataFormat = bui.settings.dataFormat;
          if (privates.is_cloned) {
            json.data.clonemarker=true;
          } else {
            delete json.data.clonemarker;
          }
          if (privates.is_multimer) {
            json.data.multimer=true;
          } else {
            delete json.data.multimer;
          }

          return json;
        },

    };

    bui.util.setSuperClass(bui.Complex, bui.Labelable);
})(bui);
