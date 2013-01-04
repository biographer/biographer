(function(bui) {
    var identifier = 'Spline';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Spline} spline
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(spline) {
        return identifier + spline.id();
    };

    /**
     * @private
     * Source changed event listener
     */
    var sourceChanged = function(node, source) {
        var privates = this._privates(identifier);
        privates.sourceHelperLine.target(source);
    };

    /**
     * @private
     * Target changed event listener
     */
    var targetChanged = function(node, target) {
        var privates = this._privates(identifier);
        privates.targetHelperLine.target(target);
    };

    /**
     * @private
     * Visibility changed event listener
     */
    var visibilityChanged = function(node, visible) {
        if (visible === false) {
            this.layoutElementsVisible(false);
        }
    };

    /**
     * @private mouse click listener
     */
    var lineMouseClick = function(event) {
        if (event.ctrlKey === true) {
            this.layoutElementsVisible(!this.layoutElementsVisible());
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.Spline = function(args){
        bui.Spline.superClazz.apply(this, arguments);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.Spline.prototype = {
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            privates.layoutElementsVisible = true;
            privates.points=[];
            privates.sourceSplineHandlePos={x:0,y:0};
            privates.targetSplineHandlePos={x:0,y:0};
            this._line = document.createElementNS(bui.svgns, 'path');
            this.graph().edgeGroup().appendChild(this._line);
            this.addClass(bui.settings.css.classes.invisible);

            var listener = this._splineHandleChanged
                    .createDelegate(this);
            privates.sourceSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(privates.layoutElementsVisible);
            privates.targetSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(privates.layoutElementsVisible);

            privates.sourceHelperLine = this.graph()
                    .add(bui.StraightLine)
                    .lineStyle(bui.AbstractLine.Style.dotted)
                    .hoverEffect(false)
                    .source(privates.sourceSplineHandle)
                    .visible(privates.layoutElementsVisible);

            privates.targetHelperLine = this.graph()
                    .add(bui.StraightLine)
                    .lineStyle(bui.AbstractLine.Style.dotted)
                    .hoverEffect(false)
                    .source(privates.targetSplineHandle)
                    .visible(privates.layoutElementsVisible);

            jQuery(this._line).click(lineMouseClick.createDelegate(this));
        },
        /**
         * @private spline handle position changed; update control point vectors
         */
        _splineHandleChanged : function() {
           var privates = this._privates(identifier);
           if (privates.positioningSplineHandles) return;
              privates.sourceSplineHandlePos.x=privates.sourceSplineHandle.absoluteCenter().x-this.source().absoluteCenter().x;
              privates.sourceSplineHandlePos.y=privates.sourceSplineHandle.absoluteCenter().y-this.source().absoluteCenter().y;
           for (var i=0;i<privates.points.length;i++){
                 privates.points[i].x=privates.points[i].splineHandle.absoluteCenter().x-privates.points[i].point.absoluteCenter().x;
                 privates.points[i].y=privates.points[i].splineHandle.absoluteCenter().y-privates.points[i].point.absoluteCenter().y;
           }
              privates.targetSplineHandlePos.x=privates.targetSplineHandle.absoluteCenter().x-this.target().absoluteCenter().x;
              privates.targetSplineHandlePos.y=privates.targetSplineHandle.absoluteCenter().y-this.target().absoluteCenter().y;
           this._sourceOrTargetDimensionChanged();
           /*           var changed=false;
           if (privates.sourceSplineHandlePos.x!=privates.sourceSplineHandle.absoluteCenter().x-this.source().absoluteCenter().x){
              privates.sourceSplineHandlePos.x=privates.sourceSplineHandle.absoluteCenter().x-this.source().absoluteCenter().x;
              changed=true;
           }
           if (privates.sourceSplineHandlePos.y!=privates.sourceSplineHandle.absoluteCenter().y-this.source().absoluteCenter().y){
              privates.sourceSplineHandlePos.y=privates.sourceSplineHandle.absoluteCenter().y-this.source().absoluteCenter().y;
              changed=true;
           }
           for (var i=0;i<privates.points.length;i++){
              if (privates.points[i].x!=privates.points[i].SplineHandle.absoluteCenter().x-privates.points[i].point.absoluteCenter().x){
                  privates.points[i].x=privates.points[i].SplineHandle.absoluteCenter().x-privates.points[i].point.absoluteCenter().x;
                  changed=true;
              }
              if (privates.points[i].y!=privates.points[i].SplineHandle.absoluteCenter().y-privates.points[i].point.absoluteCenter().y){
                  privates.points[i].y=privates.points[i].SplineHandle.absoluteCenter().y-privates.points[i].point.absoluteCenter().y;
                  changed=true;
              }
           }
           if (privates.targetSplineHandlePos.x!=privates.targetSplineHandle.absoluteCenter().x-this.target().absoluteCenter().x){
               privates.targetSplineHandlePos.x=privates.targetSplineHandle.absoluteCenter().x-this.target().absoluteCenter().x;
               changed=true;
           }
           if (privates.targetSplineHandlePos.y!=privates.targetSplineHandle.absoluteCenter().y-this.target().absoluteCenter().y){
               privates.targetSplineHandlePos.y=privates.targetSplineHandle.absoluteCenter().y-this.target().absoluteCenter().y;
               changed=true;
           }
           if (changed) { // this detects whether SplineHandle is changed external (not via _sourceOrTargetDimensionChanged itself)
              this._sourceOrTargetDimensionChanged();
           }*/
        },
        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
            var target = this.target(),
                    source = this.source();

            if (target !== null && source !== null) {

                var privates = this._privates(identifier);
                privates.positioningSplineHandles=true;
                privates.sourceSplineHandle.absolutePositionCenter(source.absoluteCenter().x+privates.sourceSplineHandlePos.x,
                                                         source.absoluteCenter().y+privates.sourceSplineHandlePos.y);
                for (var i=0;i<privates.points.length;i++){
                    privates.points[i].splineHandle.absolutePositionCenter(privates.points[i].point.absoluteCenter().x+privates.points[i].x,
                                                                           privates.points[i].point.absoluteCenter().y+privates.points[i].y)
                }
                privates.targetSplineHandle.absolutePositionCenter(target.absoluteCenter().x+privates.targetSplineHandlePos.x,
                                                    target.absoluteCenter().y+privates.targetSplineHandlePos.y);
                                                    
                var sourceSplineHandle = privates.sourceSplineHandle,
                        targetSplineHandle = privates.targetSplineHandle;

                var sourcePosition = source
                        .calculateLineEnd(sourceSplineHandle),
                        targetPosition = target
                                .calculateLineEnd(targetSplineHandle);
                // repositon splineHandles if they ar within the node
                var dx=sourcePosition.x-source.absoluteCenter().x,
                    dy=sourcePosition.y-source.absoluteCenter().y;
                if (Math.abs(dx)>=Math.abs(privates.sourceSplineHandlePos.x)){
                   privates.sourceSplineHandlePos.x=dx*1.2;
                   privates.sourceSplineHandlePos.y=dy*1.2;
                   privates.sourceSplineHandle.absolutePositionCenter(source.absoluteCenter().x+privates.sourceSplineHandlePos.x,
                                                                      source.absoluteCenter().y+privates.sourceSplineHandlePos.y);
                }
                dx=targetPosition.x-target.absoluteCenter().x,
                dy=targetPosition.y-target.absoluteCenter().y;
                if (Math.abs(dx)>=Math.abs(privates.targetSplineHandlePos.x)){
                   privates.targetSplineHandlePos.x=dx*1.2;
                   privates.targetSplineHandlePos.y=dy*1.2;
                   privates.targetSplineHandle.absolutePositionCenter(target.absoluteCenter().x+privates.targetSplineHandlePos.x,
                                                                      target.absoluteCenter().y+privates.targetSplineHandlePos.y);
                }
                privates.positioningSplineHandles=false;
                var sourceSplineHandlePosition = sourceSplineHandle
                                .absoluteCenter(),
                        targetSplineHandlePosition = targetSplineHandle
                                .absoluteCenter();

                var data = ['M' ,
                        sourcePosition.x,
                        sourcePosition.y,
                        'C',
                        sourceSplineHandlePosition.x,
                        sourceSplineHandlePosition.y]
                for (var i=0;i<privates.points.length;i++){
                   var p=privates.points[i];
                   data.push.apply(data,[p.point.absoluteCenter().x+p.x,
                               p.point.absoluteCenter().y+p.y,
                               p.point.absoluteCenter().x,
                               p.point.absoluteCenter().y,
                               'S']);
                }
                data.push.apply(data,[targetSplineHandlePosition.x,
                        targetSplineHandlePosition.y,
                        targetPosition.x,
                        targetPosition.y]);


                this._line.setAttributeNS(null, 'd', data.join(' '));
            }
        },

        /**
         * Show or hide the layout elements of this Spline. The layout
         * elements include two edgeSplineHandles and two lines. The handles
         * are used to modify the shape of the line while the two lines are
         * used as visual assistance.
         *
         * @param {Boolean} [visible] Pass true to show layout elements, false
         *   to hide them.
         * @return {bui.Spline|Boolean} Fluent interface in case you don't pass
         *   a parameter, the current visibility otherwise.
         */
        layoutElementsVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.layoutElementsVisible = visible;

                privates.sourceSplineHandle.visible(visible);
                privates.targetSplineHandle.visible(visible);
                for (var i=0;i<privates.points.length;i++){
                   privates.points[i].splineHandle.visible(visible);
                   privates.points[i].helperLine.visible(visible);
                   privates.points[i].point.visible(visible);
                }
                privates.sourceHelperLine.visible(visible);
                privates.targetHelperLine.visible(visible);

                return this;
            }

            return privates.layoutElementsVisible;
        },

        /**
         * Set the additional spline point positions and optionally animate them.
         * 
         * @param {Object[]} positions An array of positions, i.e. [x1,y1,x2,y2,...]
         *   contains the spline point coordinates except source and target positions (these are directly taken form source and target)
         * @param {Number} [duration] Optional duration for an animation. The
         *   default value assumes no animation. Refer to {@link bui.Node#move}
         *   for additional information about this parameter.
         * @return {bui.Spline} Fluent interface
         */
        setSplinePoints : function(positions, duration) {
           var privates = this._privates(identifier);
           var dl=positions.length/2-privates.points.length;
           if (dl<0){
              for (var i=privates.points.length-dl;i<privates.points.length;i++){
                 delete privates.points[i].splineHandle;
                 delete privates.points[i].helperLine;
                 delete privates.points[i].point;
              }
           }
           if (dl>0){
              var listener = this._sourceOrTargetDimensionChanged
              .createDelegate(this);
              var listener2 = this._splineHandleChanged
              .createDelegate(this);
              for (var i=privates.points.length;i<positions.length/2;i++){
                 privates.points[i]={x:0,y:0};
                  privates.points[i].splineHandle=this.graph()
                     .add(bui.SplineEdgeHandle)
                     .bind(bui.Node.ListenerType.absolutePosition,
                       listener2,
                       listenerIdentifier(this))
                       .visible(privates.layoutElementsVisible);
                  privates.points[i].point=this.graph()
                     .add(bui.EdgeHandle)
                     .bind(bui.Node.ListenerType.absolutePosition,
                       listener,
                       listenerIdentifier(this))
                       .visible(privates.layoutElementsVisible);
                  privates.points[i].helperLine=this.graph()
                       .add(bui.StraightLine)
                       .lineStyle(bui.AbstractLine.Style.dotted)
                       .hoverEffect(false)
                       .source(privates.points[i].splineHandle)
                       .target(privates.points[i].point)
                       .visible(privates.layoutElementsVisible);
              }
           }
           for (var i=0;i<positions.length;i+=2){
              var n=i/2;
              privates.points[n].point.moveAbsoluteCenter(bui.util.toNumber(positions[i]),bui.util.toNumber(positions[i+1]),duration);
           }
        },
        /**
         * Set the spline handle positions and optionally animate them.
         * 
         * @param {Object[]} positions An array of positions, i.e. [x1,y1,x2,y2,...]
         *   contains the spline handle coordinates relative to the spline points.
         * @param {Number} [duration] Optional duration for an animation. The
         *   default value assumes no animation. Refer to {@link bui.Node#move}
         *   for additional information about this parameter.
         * @return {bui.Spline} Fluent interface
         */
        setSplineHandlePositions : function(positions, duration) {
            var privates = this._privates(identifier);
            var target = this.target(),
                    source = this.source();
            privates.sourceSplineHandlePos.x=bui.util.toNumber(positions[0]);
            privates.sourceSplineHandlePos.y=bui.util.toNumber(positions[1]);
            for (var i=2;i<positions.length-2;i+=2){
               var n=(i-2)/2;
               if (privates.points[n]){
                  privates.points[n].x=bui.util.toNumber(positions[i]);
                  privates.points[n].y=bui.util.toNumber(positions[i+1]);
               } else {
                  throw "not enough spline points set for spline handles"
               }
            }
            privates.targetSplineHandlePos.x=bui.util.toNumber(positions[i]);
            privates.targetSplineHandlePos.y=bui.util.toNumber(positions[i+1]);
            this._sourceOrTargetDimensionChanged();
            return this;
        },

        /**
         * This emulates the behavior of Edge 
         */
        marker : function(markerID){
          if (markerID !== undefined){
            return bui.Spline.superClazz.prototype.marker.call(this,markerID);
          } else {
            return bui.Spline.superClazz.prototype.markerId.call(this);
          }
        },

        // overridden
        toJSON : function() {
            var json = bui.Spline.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            var handles = [privates.sourceSplineHandlePos.x,privates.sourceSplineHandlePos.y];
            var points = [];
            for (var i=0;i<privates.points.length;i++){
               var pos=privates.points[i].point.absoluteCenter()
               points.push.apply(points,[pos.x,pos.y]);
               handles.push.apply(handles,[privates.points[i].x,privates.points[i].y]);
            }
            handles.push.apply(handles,[privates.targetSplineHandlePos.x,privates.targetSplineHandlePos.y]);
            updateJson(json, dataFormat.edge.handles, handles);
            updateJson(json, dataFormat.edge.points, points);
            //updateJson(json, dataFormat.edge.type, 'curve');

            return json;
        }
    };

    bui.util.setSuperClass(bui.Spline, bui.AbstractLine);
})(bui);
