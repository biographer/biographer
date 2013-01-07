(function(bui) {
    var identifier = 'bui.Edge';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Edge} edge
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(edge) {
        return identifier + edge.id();
    };
    /**
     * @private
     * Function used to update SVG representation of Edge
     */
    
    var updateEdge = function(){
      var privates = this._privates(identifier);
      if (this.source() == null || this.target() == null) return;
 
//       if (privates.source.parent() == privates.target.parent()){
//         // if source and target have same parent, make all points also children
//         for (var i=0;i<privates.points.length;i++){
//           var p=privates.points[i].point;
//           if (p.parent() !== privates.source.parent()){
//             var pos=p.absoluteCenter();
//             p.parent(privates.source.parent());
//             p.absoluteCenter(pos);
//           }
//           if (privates.isSpline){
//             var h=privates.points[i].splineHandle;
//             }
//           }
//         }
//       }
      if (privates.isSpline) {
        updateSpline.call(this);
      } else {
        updateStraight.call(this);
      }
    };
    
    /**
     * @private
     * Function to calculate Spline from controlpoints and create SVG. Called by updateEdge for spline edges. Also updates spline handle positions if edge points are modified.
     */
    var updateSpline = function(){
      var privates = this._privates(identifier);

      var source = this.source();
      var target = this.target();
      

      // calculate intersect point of line defined by spline handle and border of node ( this is where the edge is supposed to start or end)
      var sourcePosition = source.calculateLineEnd(source.absoluteCenter().x+privates.sourceSplineHandleVec.x,
                                                source.absoluteCenter().y+privates.sourceSplineHandleVec.y),
          targetPosition = target.calculateLineEnd(target.absoluteCenter().x+privates.targetSplineHandleVec.x,
                                                target.absoluteCenter().y+privates.targetSplineHandleVec.y);

      // repositon splineHandles if they are within the node
      var dx=sourcePosition.x-source.absoluteCenter().x,
          dy=sourcePosition.y-source.absoluteCenter().y;
      if (Math.abs(dx)>=Math.abs(privates.sourceSplineHandleVec.x)){
          privates.sourceSplineHandleVec.x=dx*1.2;
          privates.sourceSplineHandleVec.y=dy*1.2;
      }
      dx=targetPosition.x-target.absoluteCenter().x,
      dy=targetPosition.y-target.absoluteCenter().y;
      if (Math.abs(dx)>=Math.abs(privates.targetSplineHandleVec.x)){
          privates.targetSplineHandleVec.x=dx*1.2;
          privates.targetSplineHandleVec.y=dy*1.2;
      }

      var sourceSplineHandle = privates.sourceSplineHandle,
          targetSplineHandle = privates.targetSplineHandle;
      privates.positioningSplineHandles=true; // this is to indicate that position changes of spline handles are not user interactions
      // now set spline handle positions according to source, target and edge point positions
      sourceSplineHandle.absolutePositionCenter(source.absoluteCenter().x+privates.sourceSplineHandleVec.x,
                                                source.absoluteCenter().y+privates.sourceSplineHandleVec.y);
      for (var i=0;i<privates.points.length;i++){
          privates.points[i].splineHandle.absolutePositionCenter(privates.points[i].point.absoluteCenter().x+privates.points[i].dx,
                                                                 privates.points[i].point.absoluteCenter().y+privates.points[i].dy)
      }
      targetSplineHandle.absolutePositionCenter(target.absoluteCenter().x+privates.targetSplineHandleVec.x,
                                                target.absoluteCenter().y+privates.targetSplineHandleVec.y);
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
          data.push.apply(data,[p.point.absoluteCenter().x+p.dx,
                      p.point.absoluteCenter().y+p.dy,
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
    /**
     * @private
     * Function to calculate straight path from controlpoints and create SVG. Called by updateEdge for straight edges. 
     */
    var updateStraight= function(){
      var privates = this._privates(identifier);
      var source = this.source();
      var target = this.target();
      
      var num=privates.points.length;
      if (bui.settings.straightenEdges){
        if((num> 0)){
          var sp = source.absoluteCenter();
          var tp = target.absoluteCenter();
          var lx = tp.x-sp.x;
          var ly = tp.y-sp.y;
          for(var i = 0; i<num; i++){
              privates.points[i].point.absolutePositionCenter(sp.x+((i+1)*lx/(num+1)),sp.y+((i+1)*ly/(num+1)));
          }
        }
      }

      // calculate intersect point of line defined first or last line segment and border of node ( this is where the edge is supposed to start or end)
      var sourcePosition = source.calculateLineEnd(num==0 ? target : privates.points[0].point),
          targetPosition = target.calculateLineEnd(num==0 ? source : privates.points[num-1].point);
      // create Path data
      var data= ['M', sourcePosition.x, sourcePosition.y];
      for (var i=0;i<num;i++){
        var p=privates.points[i];
        data.push('L',p.point.absoluteCenter().x, p.point.absoluteCenter().y);
      }
      data.push('L', targetPosition.x, targetPosition.y);
      this._line.setAttributeNS(null, 'd', data.join(' '));
    }
    /**
     * @private
     * handler for reacting on user interaction with spline handle
     */
    var splineHandleChanged = function() {
      console.log("splineHandleChanged");
      var privates = this._privates(identifier);
      if (privates.positioningSplineHandles) return; // if spline handles are modified internally return

      privates.sourceSplineHandleVec.x=privates.sourceSplineHandle.absoluteCenter().x-this.source().absoluteCenter().x;
      privates.sourceSplineHandleVec.y=privates.sourceSplineHandle.absoluteCenter().y-this.source().absoluteCenter().y;
      for (var i=0;i<privates.points.length;i++){
        privates.points[i].dx=privates.points[i].splineHandle.absoluteCenter().x-privates.points[i].point.absoluteCenter().x;
        privates.points[i].dy=privates.points[i].splineHandle.absoluteCenter().y-privates.points[i].point.absoluteCenter().y;
      }
      privates.targetSplineHandleVec.x=privates.targetSplineHandle.absoluteCenter().x-this.target().absoluteCenter().x;
      privates.targetSplineHandleVec.y=privates.targetSplineHandle.absoluteCenter().y-this.target().absoluteCenter().y;

      updateSpline.call(this); // update spline (no need to call updateEdge?)
    };

    /**
     * @private
     * function called when straight edge is transformed into spline. Calculates initial spline handle positions and creates them. updates SVG.
     */
    var makeSpline = function(){
      var privates = this._privates(identifier);
      
      if (privates.isSpline) return;
      privates.isSpline=true;
      
      // calculate some feasible values for all spline handles
      if (privates.sourceSplineHandleVec == undefined){
        var t=(privates.points.length ? privates.points[0].point.absoluteCenter() : this.target().absoluteCenter());
        privates.sourceSplineHandleVec={x:(t.x-this.source().absoluteCenter().x)/4,y:(t.y-this.source().absoluteCenter().y)/4};
      }
      if (privates.targetSplineHandleVec == undefined){
        var t=(privates.points.length ? privates.points[privates.points.length-1].point.absoluteCenter() : this.source().absoluteCenter());
        privates.targetSplineHandleVec={x:(t.x-this.target().absoluteCenter().x)/4,y:(t.y-this.target().absoluteCenter().y)/4};
      }
      for (var i=0;i<privates.points.length;i++){
        var t1=(i==0 ? this.source().absoluteCenter() : privates.points[i-1].point.absoluteCenter());
        var t2=(i==privates.points.length-1 ? this.target().absoluteCenter() : privates.points[i+1].point.absoluteCenter());
        privates.points[i].dx=-(t2.x-t1.x)/4;
        privates.points[i].dy=-(t2.y-t1.y)/4;
      }
      
      // create spline handles and add listener
      var listener = splineHandleChanged.createDelegate(this);
      privates.sourceSplineHandle = this.graph()
              .add(bui.SplineEdgeHandle)
              .bind(bui.Node.ListenerType.absolutePosition,
                      listener,
                      listenerIdentifier(this))
              .edge(this)
              .visible(privates.layoutElementsVisible);
      privates.targetSplineHandle = this.graph()
              .add(bui.SplineEdgeHandle)
              .bind(bui.Node.ListenerType.absolutePosition,
                      listener,
                      listenerIdentifier(this))
              .edge(this)
              .visible(privates.layoutElementsVisible);
      for (var i=0;i<privates.points.length;i++){
        privates.points[i].splineHandle=this.graph()
                .add(bui.SplineEdgeHandle)
                .bind(bui.Node.ListenerType.absolutePosition,
                  listener,
                  listenerIdentifier(this))
                .edge(this)
                .visible(privates.layoutElementsVisible);
      }
      // create spline handle helper lines
      privates.sourceHelperLine = this.graph()
              .add(bui.StraightLine)
              .lineStyle(bui.AbstractLine.Style.dotted)
              .hoverEffect(false)
              .target(this.source())
              .source(privates.sourceSplineHandle)
              .visible(privates.layoutElementsVisible);

      privates.targetHelperLine = this.graph()
              .add(bui.StraightLine)
              .lineStyle(bui.AbstractLine.Style.dotted)
              .hoverEffect(false)
              .target(this.target())
              .source(privates.targetSplineHandle)
              .visible(privates.layoutElementsVisible);
      for (var i=0;i<privates.points.length;i++){
        privates.points[i].helperLine=this.graph()
                .add(bui.StraightLine)
                .lineStyle(bui.AbstractLine.Style.dotted)
                .hoverEffect(false)
                .source(privates.points[i].splineHandle)
                .target(privates.points[i].point)
                .visible(privates.layoutElementsVisible);
      }
      updateSpline.call(this);
    }
    /**
     * @private
     * function called when spline edge is transformed into straight edge. updates SVG.
     */
    var makeStraight = function(){
      var privates = this._privates(identifier);
      if (!privates.isSpline) return;
      for (var i=0;i<privates.points.length;i++){
        var p=privates.points[i];
        p.splineHandle.unbindAll(listenerIdentifier(this));
        p.splineHandle.remove();
        p.helperLine.remove();
      }
      privates.sourceSplineHandle.unbindAll(listenerIdentifier(this));
      privates.sourceSplineHandle.remove();
      privates.targetSplineHandle.unbindAll(listenerIdentifier(this));
      privates.targetSplineHandle.remove();
      privates.sourceHelperLine.remove();
      privates.targetHelperLine.remove();
      privates.isSpline=false;
      updateStraight.call(this);
    }
    /**
     * @private
     * function to find closest point on edge to given x,y position (for inserting edge point on right position
     * @param {x,y} position of new point
     * @return {idx} index of point after new point
     */
    var findClosest = function(x,y){ 
      var privates = this._privates(identifier);
      if (privates.points.length==0) return 0;
      var mind=-1;
      var closest=-1;
      for (var i=0;i<=privates.points.length;i++){
        var p1=(i==0 ? this.source().absolutePositionCenter() : privates.points[i-1].point.absolutePositionCenter());
        var p2=(i==privates.points.length ? this.target().absolutePositionCenter() : privates.points[i].point.absolutePositionCenter());
        var a={x: p2.x-p1.x, y: p2.y-p1.y};
        var b={x: x-p1.x , y: y-p1.y};
        var d=(a.x*b.y-a.y*b.x)/Math.sqrt(a.x*a.x+a.y*a.y); // distance to connecting lines
        var s=a.x*b.x+a.y*b.y;
        if (s<0) { // new point before p1
          d=Math.sqrt(b.x*b.x+b.y*b.y);
        } else {
          b={x: x-p2.x , y: y-p2.y};
          s=-a.x*b.x-a.y*b.y;
          if (s<0){ // new point behind p2
            d=Math.sqrt(b.x*b.x+b.y*b.y);
          }
        }
        if (mind==-1 || mind>d){
          mind=d;
          closest=i;
        }
      }
      return closest;
    }
    /**
     * @private
     * function to add a point to edge. 
     * 
     * @param {x,y} position of new point
     * @param {type} type of edge point (nothing or "Ourcome")
     * @param {position} index at which to insert in list of points
     * @param {dx,dy} spline handle vector if edge is spline
     * @return {idx} index of point after new point
     */
    var _addPoint = function(x, y, type, position, dx, dy){
      var privates = this._privates(identifier);
      
      if (position<0) { // position -1 is after last element
        position=privates.points.length+1+position;
      };
      
      var point = undefined;
      
      point = this.graph()
                  .add(bui.EdgeHandle)
                  .edge(this);
      
      if (type == "Outcome"){
          point.addClass('Outcome');// the stylesheet must fill the circle black
          point.size(12,12);
          point.visible(this.visible());
      } else {
          point.visible(privates.layoutElementsVisible)
               .addClass('edgeHandle');   //let the stylesheet make it grey
      }
                  
      point.absolutePositionCenter(x, y);
      
      var pth={point: point}; // object which contains all point data

      if (privates.isSpline){
        if (dx == undefined || dy == undefined || (dx==0 && dy==0)){ // make some feasible default spline handles
          var t1=(position==0? this.source().absolutePositionCenter() : privates.points[position-1].point.absolutePositionCenter());
          var t2=(position==privates.points.length? this.target().absolutePositionCenter() : privates.points[position].point.absolutePositionCenter());
          pth.dx=-(t2.x-t1.x)/4;
          pth.dy=-(t2.y-t1.y)/4;
        } else {
          pth.dx=dx;
          pth.dy=dy;
        }
        pth.splineHandle = this.graph()
              .add(bui.SplineEdgeHandle)
              .bind(bui.Node.ListenerType.absolutePosition,
                      splineHandleChanged.createDelegate(this),
                      listenerIdentifier(this))
              .edge(this)
              .visible(privates.layoutElementsVisible);
        pth.helperLine=this.graph()
                .add(bui.StraightLine)
                .lineStyle(bui.AbstractLine.Style.dotted)
                .hoverEffect(false)
                .source(pth.splineHandle)
                .target(pth.point)
                .visible(privates.layoutElementsVisible);

      }
      point.bind(bui.Node.ListenerType.absolutePosition, updateEdge.createDelegate(this), listenerIdentifier(this))
      point.bind(bui.Drawable.ListenerType.remove,
              this.removePoint.createDelegate(this),
              listenerIdentifier(this));

      privates.points.splice(position, 0, pth); // add point at position position
      return point;
      
    }
    /**
     * @private
     * listener to source or target movement. checks if source and target move syncronously. if yes, moves all edge points as well;
     */
    var detectWholeEdgeMove = function(node,x,y){
      var privates = this._privates(identifier);
      var type=(node==this.source() ? "source" : "target");
      var dx=0,dy=0;
      if (privates.detectMove.prev[type]){
        dx=x-privates.detectMove.prev[type].x;
        dy=y-privates.detectMove.prev[type].y;
      }
      if ((dx>0 || dy>0) && dx==privates.detectMove.last.dx && dy==privates.detectMove.last.dy && privates.detectMove.last.type != type){
        // source and target moved by same amount
        for (var i=0;i<privates.points.length;i++){
          var pos=privates.points[i].point.absolutePositionCenter();
          privates.points[i].point.absolutePositionCenter(pos.x+dx,pos.y+dy);
        }
      }
      privates.detectMove.prev[type]={x:x,y:y};
      privates.detectMove.last={type:type,dx:dx,dy:dy};
    }
    /**
     * @private
     * Source changed event listener
     */
    var sourceChanged = function(node, source) {
        var privates = this._privates(identifier);
        if (privates.isSpline) privates.sourceHelperLine.target(source);
        source.bind(bui.Node.ListenerType.absolutePosition,
                    detectWholeEdgeMove.createDelegate(this),
                    listenerIdentifier(this));
    };

    /**
     * @private
     * Target changed event listener
     */
    var targetChanged = function(node, target) {
        var privates = this._privates(identifier);
        if (privates.isSpline) privates.targetHelperLine.target(target);
        target.bind(bui.Node.ListenerType.absolutePosition,
                    detectWholeEdgeMove.createDelegate(this),
                    listenerIdentifier(this));
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
        if (event.shiftKey === true){
           var scale = 1 / this.graph().scale(),
                graph = this.graph(),
                graphTranslate = graph.translate(),
                graphHtmlTopLeft = graph.htmlTopLeft();

            this.addPoint(((event.pageX - graphHtmlTopLeft.x) * scale) - graphTranslate.x,
                          ((event.pageY - graphHtmlTopLeft.y) * scale) - graphTranslate.y);
            this.layoutElementsVisible(true);
        }
    };

    /**
     * @class
     * An edge which contains multiple segments, can be spline or straight
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.Edge = function(args){
        bui.Edge.superClazz.apply(this, arguments);
    };

    bui.Edge.prototype = {
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            this._line = document.createElementNS(bui.svgns, 'path');
            this.graph().edgeGroup().appendChild(this._line);
//            this.addClass(bui.settings.css.classes.invisible);
            privates.layoutElementsVisible = false;
            privates.points = [];
            privates.marker = null;
            privates.lineStyle = null;
            privates.isSpline = false;
            privates.detectMove={prev:{}};

            this.bind(bui.AttachedDrawable.ListenerType.source,
                    sourceChanged.createDelegate(this),
                    listenerIdentifier(this));
            this.bind(bui.AttachedDrawable.ListenerType.target,
                    targetChanged.createDelegate(this),
                    listenerIdentifier(this));
            this.bind(bui.Drawable.ListenerType.visible,
                    visibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
            jQuery(this._line).click(lineMouseClick.createDelegate(this));
            
        },
        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
	    console.log("_sourceOrTargetDimensionChanged");
            updateEdge.call(this);
        },
        /**
        * method to add a point to edge. 
        * 
        * @param {x,y} position of new point
        * @param {type} type of edge point (nothing or "Ourcome")
        * @param {position} index at which to insert in list of points
        * @param {dx,dy} spline handle vector if edge is spline
        * @return {bui.Node} created EdgeHandle
        */
        addPoint : function(x,y,type,position,dx,dy){
          var privates = this._privates(identifier);
          if (x==undefined){
            var p1=this.source().absolutePositionCenter();
            var p2=(privates.points.length ? privates.points[0].point.absolutePositionCenter() : this.target().absolutePositionCenter());
            x=(p1.x+p2.x)/2;
            y=(p1.y+p2.y)/2;
          }
          if (position==undefined) position=findClosest.call(this,x,y);
          var point=_addPoint.call(this,x,y,type,position,dx,dy);
          updateEdge.call(this);
          return point;
        },
        /**
        * method to get point at specified index
        * 
        * @param {Number} index of point
        * @return {bui.EdgeHandle} the point
        */
        getPoint : function(idx){
          return this._privates(identifier).points[idx].point;
        },
        /**
        * method to get index of a spcified point in list of edge points
        * 
        * @param {bui.EdgeHandle} point the point
        * @return {Number} index of point
        */
        getPosition : function(point){
          var privates = this._privates(identifier);
          var pos=-1;
          for (var i=0;i<privates.points.length;i++){
            if (privates.points[i].point == point) pos=i;
          }
          return pos;
        },
        /**
        * method to remove a point from edge. 
        * 
        * @param {point} index of point or the point itself
        * @return {bui.Edge} fluent interface
        */
        removePoint: function (point) {
          var privates = this._privates(identifier);
          var index=-1;
          if (Object.prototype.toString.call(point).slice(8,-1) == "Number"){
            index=point;
          } else {
            for (var i=0;i<privates.points.length;i++){
              if (privates.points[i].point==point) index=i;
            }
          }
          if (index<0) return;
          if (index>=privates.points.length) return;
          var pth=privates.points.splice(index, 1)[0];
          pth.point.unbindAll(listenerIdentifier(this));
          pth.point.remove();
          if (privates.isSpline) {
            pth.splineHandle.unbindAll(listenerIdentifier(this));
            pth.splineHandle.remove();
            pth.helperLine.remove();
          }
          updateEdge.call(this);
          return this;
        },

         /**
         * check or set whether Edge is spline or straight
         *
         * @param {Boolean} [setSpline] Pass true for splines, false
         *   for straight lines.
         * @return {bui.Spline|Boolean} Fluent interface in case you pass
         *   a parameter, the current spline status otherwise.
         */
        spline : function(setSpline) {
            var privates = this._privates(identifier);
            if (setSpline !== undefined) {
              
              if (privates.isSpline!=setSpline){
                if (setSpline) {
                  makeSpline.call(this);
                } else {
                  makeStraight.call(this);
                }
              }
              return this;
            } else {
              return privates.isSpline;
            }
        },
         /**
         * set source spline handle vector
         *
         * @param {int,int} [dx,dy] vector to be set
         * @return {bui.Edge|{x,y}} Fluent interface in case you pass
         *   a parameter, the current spline vector otherwise.
         */
 
        sourceSplineHandle : function(dx,dy){
          var privates = this._privates(identifier);
          if (dx == undefined) {
            return privates.sourceSplineHandleVec;
          } else {
            privates.sourceSplineHandleVec={x:dx,y:dy};
	    updateSpline.call(this);
            return this;
          }
        },
         /**
         * set target spline handle vector
         *
         * @param {int,int} [dx,dy] vector to be set
         * @return {bui.Edge|{x,y}} Fluent interface in case you pass
         *   a parameter, the current spline vector otherwise.
         */
        targetSplineHandle : function(dx,dy){
          var privates = this._privates(identifier);
          if (dx == undefined) {
            return privates.targetSplineHandleVec;
          } else {
            privates.targetSplineHandleVec={x:dx,y:dy};
	    updateSpline.call(this);
            return this;
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

                if (privates.isSpline) {
		  privates.sourceSplineHandle.visible(visible);
		  privates.targetSplineHandle.visible(visible);
                  privates.sourceHelperLine.visible(visible);
                  privates.targetHelperLine.visible(visible);
		}
		for (var i=0;i<privates.points.length;i++){
       if (visible || ! privates.points[i].point.hasClass("Outcome")) privates.points[i].point.visible(visible);
                  if (privates.isSpline){
		     privates.points[i].splineHandle.visible(visible);
		     privates.points[i].helperLine.visible(visible);
		   } 
                }

                return this;
            }

            return privates.layoutElementsVisible;
        },

        /**
         * Set the line style. Available line style can be retrieved through
         * the {@link bui.AbstractLine.Style} object.
         *
         * @param {Object} style A property of {@link bui.AbstractLine.Style}.
         * @return {bui.AbstractLine} Fluent interface
         * @example
         * edge.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            var privates = this._privates(identifier);
            privates.lineStyle = style;
            redrawLines.call(this);
            return this;
        },
        toJSON : function() {
            var json = bui.Edge.superClazz.prototype.toJSON.call(this),
                dataFormat = bui.settings.dataFormat,
                privates = this._privates(identifier);

            var handles = [], points = [], pointtypes = [];
            if (privates.isSpline) handles.push(privates.sourceSplineHandleVec.x,privates.sourceSplineHandleVec.y);
            if (privates.points.length > 0) {
              
              for (var i = 0; i < privates.points.length; i++) {
                var position = privates.points[i].point.absoluteCenter();
                points.push(position.x,position.y);
                if (privates.isSpline) {
                  var ps = privates.points[i].splineHandle.absoluteCenter();
                  handles.push(ps.x-position.x,ps.y-position.y);
                }
                if (privates.points[i].point.hasClass('Outcome')){
                  pointtypes[i]='Outcome';
                }
              }
            }
            if (privates.isSpline) handles.push(privates.targetSplineHandleVec.x,privates.targetSplineHandleVec.y);
            if (points.length) updateJson(json, dataFormat.edge.points, points);
            if (handles.length) updateJson(json, dataFormat.edge.handles, handles);
            if (pointtypes.length) updateJson(json, dataFormat.edge.pointtypes, pointtypes);

            //console.log('rock edge '+JSON.stringify(json));

            return json;
        }

    };

    bui.util.setSuperClass(bui.Edge, bui.AbstractLine);
})(bui);
