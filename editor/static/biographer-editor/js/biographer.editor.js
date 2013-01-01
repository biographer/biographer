function Editor(){
    //=========================
    this.graph = null;
    //=========================
    this.t;
    this.timer_is_on=0;
    this.intervall = 60000;//every 60 seconds
    this.last_save = '';
    this.cur_mode = 'cursor';
    this.selected_nodes = [];
    this.selected_edges = [];
    //=========================
    //doHeartBeat();
    //=========================
    this.x = 1;
    this.canvaspos = $('#canvas').position();
    this.loading_img = '<img src="'+$('script[src*="js/biographer.editor.js"]').attr('src').replace('js/biographer.editor.js', 'img/loading.gif')+'" alt="loading" >';
    this.bui_visualization_css_file = $('script[src*="js/biographer.editor.js"]').attr('src').replace('js/biographer.editor.js', 'css/visualization-svg.css');
    this.images_base_path = $('script[src*="js/biographer.editor.js"]').attr('src').replace('js/biographer.editor.js', 'img/');
    this.init();
}
//-------------------------------------------
Editor.prototype = {
    save: function(action) {
        if (action == 'manual' || action == 'auto'){
            var now = new Date();
            var pretty_date = [ now.getFullYear(), '-', now.getMonth() + 1, '-', now.getDate(), ' ', now.getHours(), ':', now.getMinutes(), ':', now.getSeconds() ].join('');
            this.undoPush(action+' save '+pretty_date);
        }else if (action !== undefined){
            this.undoPush(action);
        }
    },
    autosaveHeartBeat: function(no_save) {
        var this_editor = this;
        if (no_save !== true){
            //autosave json graph if graph was modified
            this.save('auto');
        }
        this_editor.t=setTimeout("autosaveHeartBeat()",intervall);
    },
    doHeartBeat: function() {
        if (!this.timer_is_on) {
          this.timer_is_on=1;
          this.autosaveHeartBeat(true);
          }
    },
    //-------------------------------------------
    // replace graph with new graph defined by json object
    redrawGraph: function(graph_json){
       // clear graph
        if (this.graph){
          var all_drawables = this.graph.drawables();
          var key;
          for (key in all_drawables) {
              all_drawables[key].remove(); 
          }
        } else {
          this.graph = new bui.Graph($('#canvas')[0]);
        }
        // create new graph
        bui.importFromJSON(this.graph, graph_json);
        //add edge select listner to all nodes
        all_drawables = this.graph.drawables();
        for (key in all_drawables) {
          if (all_drawables.hasOwnProperty(key)){
            if(all_drawables[key].drawableType()=='node'){
                all_drawables[key].bind(bui.Node.ListenerType.click, editor.drawableSelect());
            }else{
                all_drawables[key].bind(bui.AbstractLine.ListenerType.click, editor.drawableSelect());
            }
          }
        }
        var this_editor = this; // closure this object for drop callback below
        
    },
    //-------------------------------------------
    // show last action as tooltip to undo button
    showUndoRedo: function(){
        var newArray,html_history;
        //console.log(editor_config.history_undo);
        if(editor_config.history_undo.length > 1){
            $('#undo').removeClass('disabled');
            newArray = editor_config.history_undo.slice();
            html_history = '';
            for (var i = newArray.length - 1; i >= 0; i--) {
                html_history += newArray[i].action+'<br/>';
            }
            $('#undo>div').html(html_history);
        }else{
            $('#undo').addClass('disabled');
            $('#undo>div').html('undo');
        }
        if(editor_config.history_redo.length > 0){
            $('#redo').removeClass('disabled');
            $('#redo>div').html(editor_config.history_redo.join('<br/>'));
            newArray = editor_config.history_redo.slice();
            html_history = '';
            for (var i = newArray.length - 1; i >= 0; i--) {
                html_history += newArray[i].action+'<br/>';
            }
            $('#redo>div').html(html_history);
        }else{
            $('#redo').addClass('disabled');
            $('#redo>div').html('redo');
        }
    },
    //-------------------------------------------
    // add a new state to undo list
    undoPush: function(action){
        var editor = this;
        var jsong = JSON.stringify(this.graph.toJSON());
        if (jsong == this.last_save){
            $('.flash').html('Saved: nothing changed, woooah').fadeIn().delay(800).fadeOut();
            return false;
        }
        //editor.undoRegister(action, jsong);
        editor_config.history_undo.push({action: action, graph: jsong});
        editor_config.history_redo = [];
        this.showUndoRedo();
        this.last_save = jsong;
        $.ajax({
            url: editor_config.url_undo_push,
            data : {graph: jsong, action: action },
            type: 'POST',
            success: function( data ) {
                $('.flash').html('Saved '+action).fadeIn().delay(800).fadeOut();
            },
            error: function (){
                $('.flash').html('Could not save last action to session history');
            }
        });
    },
    //-------------------------------------------
    // reset to last state in undo list
    undo: function(){
        if(editor_config.history_undo.length < 1) return;
        var history_obj = editor_config.history_undo.pop();
        this.redrawGraph(JSON.parse(editor_config.history_undo.slice(-1)[0].graph));
        editor_config.history_redo.push(history_obj);
        this.showUndoRedo();
        $.ajax({
            url: editor_config.url_undo,
            success: function( data ) {
                $('.flash').html('Undo: '+history_obj.action).fadeIn().delay(800).fadeOut();
            },
            error: function (){
                $('.flash').html('Could not save undo action to session history');
            }
        });
    },
    redo: function(){
        if(editor_config.history_redo.length < 1) return;
        var this_editor = this;
        var history_obj = editor_config.history_redo.pop();
        editor_config.history_undo.push(history_obj);
        this_editor.showUndoRedo();
        this_editor.redrawGraph(JSON.parse(history_obj.graph));
        $.ajax({
            url: editor_config.url_undo,
            success: function( data ) {
                $('.flash').html('Redo: '+history_obj.action).fadeIn().delay(800).fadeOut();
            },
            error: function (){
                $('.flash').html('Could not save redo action to session history');
            }
        });
    },
    //-------------------------------------------
    // set cursor symbol (next to arrow) according to edit mode
    setMode: function(mode){
        if (this.cur_mode == 'node'){
            $("body").unbind('click');
        }
        if (mode == this.cur_mode) return;
        this.cur_mode = mode;
        //console.log('set cur_mode: '+this.cur_mode);
        $('#canvas').unbind('mousemove');
        $('.follow').hide();
        $('.active').removeClass('active');
        var mode2id = {'edit':'wrench', 'Edge':'edge', 'Spline':'spline', 'focus':'focus', 'move': 'move', 'selection': 'selection'};
        if ((mode === undefined)||(mode == 'cursor')){
            $('#cursor').addClass('active');
            this.enable_selection();
        }else{
            $('#'+mode).addClass('active');
            $('#follow_'+mode2id[mode]).show();
            $("#canvas").mousemove(function(e){
                $('#follow_'+mode2id[mode]).css('top', e.clientY+15).css('left', e.clientX+15);
            });
        }
        if ( this.cur_mode == 'move' ){
                this.disable_selection();
        }else if ((mode == 'Edge')||(mode == 'Spline')){
            for (var i = this.selected_nodes.length - 1; i >= 0; i--) {
                this.selected_nodes[i].selected = false;
                this.selected_nodes[i].removeClass('selected');
            }
            this.selected_nodes = [];    
            $('.flash').html('<h2>Please click on two nodes to create an edge<h2>').fadeIn().delay(5000).fadeOut();
        }
    },
    //-------------------------------------------
    // general handler for clicks on nodes
    // depends on current edit mode
    drawableSelect: function() {
        var this_editor = this; // closure for this object
        return function(drawable, select_status){
            if(drawable.drawableType()=='node'){
                if ((this_editor.cur_mode == 'cursor')||(this_editor.cur_mode == 'Edge')||(this_editor.cur_mode == 'Spline')){
                    if ((this_editor.shifted == true)||(this_editor.cur_mode == 'Edge')||(this_editor.cur_mode == 'Spline')){
                        //shif key is down
                        //add all drawable to selection, if already selected remove selection
                        if (drawable.selected === true){
                                for (var i = this_editor.selected_nodes.length - 1; i >= 0; i--) {
                                    if (drawable == this_editor.selected_nodes[i]){
                                        drawable.selected = false;
                                        drawable.removeClass('selected');
                                        this_editor.selected_nodes.splice(i, 1);
                                        break;
                                    }
                                }
                        }else{
                                drawable.addClass('selected');
                                drawable.selected = true;
                                this_editor.selected_nodes.push(drawable);
                        }
                    }else{
                        //shift key is not down
                        for (var i = this_editor.selected_nodes.length - 1; i >= 0; i--) {
                                this_editor.selected_nodes[i].selected = false;
                                this_editor.selected_nodes[i].removeClass('selected');
                        }
                        this_editor.selected_nodes = [drawable]
                        drawable.addClass('selected');
                        drawable.selected = true;
                    }
                }
                if ((this_editor.cur_mode == 'Edge')||(this_editor.cur_mode == 'Spline')){
                    if (this_editor.selected_nodes.length>=2){
                        //draw edge now
                        new_edge = this_editor.graph.add(bui[this_editor.cur_mode])
                                .source(this_editor.selected_nodes[0])
                                .target(this_editor.selected_nodes[1])
                                .visible(true);
                        if(this_editor.cur_mode=='Spline') {
                          var dx=this_editor.selected_nodes[1].position().x-this_editor.selected_nodes[0].position().x;
                          var dy=this_editor.selected_nodes[1].position().y-this_editor.selected_nodes[0].position().y;
                          new_edge.setSplineHandlePositions([dx/5,dy/5,-dx/5,-dy/5]);
                        }
                        for (var i = this_editor.selected_nodes.length - 1; i >= 0; i--) {
                            this_editor.selected_nodes[i].selected = false;
                            this_editor.selected_nodes[i].removeClass('selected');
                        }
                        this_editor.selected_nodes = [];
                        //set click listener on new edge
                        new_edge.bind(bui.AbstractLine.ListenerType.click, editor.drawableSelect());

                        this_editor.edgeModal(new_edge, 'created '+this_editor.cur_mode);
                        this_editor.selected_nodes = [];
                    }
                } else if (this_editor.cur_mode == 'edit'){
                    if(drawable.drawableType()=='edge'){
                        this_editor.edgeModal(drawable, 'edited edge');
                    } else {
                        var label = 'Complex';
                        if(drawable.identifier()!='Complex') label = drawable.label();
                        this_editor.nodeModal(drawable, 'edited node '+label);
                    }
                } else if (this_editor.cur_mode == 'focus'){
                    if(drawable.drawableType()=='node') bui.util.alignCanvas(this_editor.graph, drawable.id());
                }
            }else{
                //FIXME 
                if (this_editor.cur_mode == 'del'){
                    console.log('del edge');
                    drawable.remove();
                    this_editor.undoPush('deleted edge '+drawable.drawableType())
                } else if (this_editor.cur_mode == 'edit'){
                    this_editor.edgeModal(drawable, 'edited edge');
                }
            }
        };
    },
    //-------------------------------------------
    // display property editor for nodes
    nodeModal: function(drawable, action) {
        var this_editor = this;
        //do not add lable to complex but anything else
        $('#action').html(action);
        if((drawable.identifier()=='Complex') || (drawable.identifier()=="Association") || (drawable.identifier()=="Dissociation")){
            $('#node_label_row').hide();
        }else{
            $('#node_label_row').show();
            $('#node_label').val(drawable.label());
        }
        if (drawable.multimere == undefined){
            $('.multimere_box').hide();
        }else if (drawable.multimere() == true){
            $('#node_is_multimere').attr('checked', 'checked');
        }else {
            $('#node_is_multimere').removeAttr('checked');
        }
        console.log('clone'+drawable.clonemarker)
        if (drawable.clonemarker == undefined){
            $('.clonemarker_box').hide();
        }else if (drawable.clonemarker() == true){
            $('#node_is_clone').attr('checked', 'checked');
        }else {
            $('#node_is_clone').removeAttr('checked');
        }
        //-----------------
        $('.current_id').attr('id', drawable.id());
        this_editor.modal = $("#node_modal_input").modal({
            overlayClose:true,
            opacity:20,
            onClose: function(){
                if(drawable.identifier()!='Complex'){
                    if ( $('#node_label').val() !== '' ) drawable.label($('#node_label').val()).adaptSizeToLabel();
                }
                if((drawable.identifier()=="Association") || (drawable.identifier()=="Dissociation")){
                    drawable.size(20,20);
                }
                $('.unit_of_information').each(function(){
                    if($(this).val()){
                        this_editor.graph.add(bui.UnitOfInformation)
                        //.position(-10, -10)//TODO do we need this
                        .parent(drawable)
                        .label($(this).val())
                        .adaptSizeToLabel(true)
                        .visible(true);
                    }
                });
                $('.state_variable').each(function(){
                    if($(this).val()){
                        this_editor.graph.add(bui.StateVariable)
                        //.position(-10, -10)//TODO do we need this
                        .parent(drawable)
                        .label($(this).val())
                        .adaptSizeToLabel(true)
                        .visible(true);
                    }
                });
                //-----------------
                if (drawable.multimere != undefined) drawable.multimere($('#node_is_multimere').is(':checked'));
                if (drawable.clonemarker != undefined) drawable.clonemarker($('#node_is_clone').is(':checked'));
                //-----------------
                if(($('input[name="node_color"]:checked').val() != 'none')&&($('input[name="node_color"]:checked').val() !== undefined)){
                    drawable.removeClass();
                    drawable.addClass($('input[name="node_color"]:checked').val());
                }
                this_editor.save($('#action').html());
                $.modal.close();
            }
        });
    },
    //-------------------------------------------
    edgeModal: function(drawable, action) {
        var sel=$('#marker_select_box')[0]; // the select <div>
        $('#action').html(action);
        $('.current_id').attr('id', drawable.id());
        var type=drawable.marker(); // type as specified by sbo in edge
        $('.marker_select').hide();
        if (type){
          $('#' + type).show(); // show the <div> correspnding to the current edge marker
        } else {
          $('#marker_none').show();
        }
        sel.opened=false; // we just introduce some local variables in the select div
        sel.marker=type;
        var this_editor = this;
        this_editor.modal = $("#edge_modal_input").modal({
            overlayClose:true,
            opacity:20,
            onClose: function(){
                if(sel.marker !== 'marker_none'){
                    switch (sel.marker) {
                      case "production" :
                        if (!(drawable.source() instanceof bui.Process)){
                          if (drawable.target() instanceof bui.Process){
                            var h=drawable.source();  // swap source / target
                            drawable.source(drawable.target());
                            drawable.target(h);
                          } else {
                            jQuery('.flash').html("Error: production edge needs connect process to molecule").fadeIn();
                            return;
                          }
                        }
                        break;
                      case "inhibition" :
                      case "catalysis" :
                      case "stimulation" :
                      case "necessaryStimulation" :
                      case "absoluteStimulation" :
                      case "absoluteInhibition" :
                      case "control" :
                        if (!(drawable.target() instanceof bui.Process)){
                          if (drawable.source() instanceof bui.Process){
                            var h=drawable.source();  // swap source / target
                            drawable.source(drawable.target());
                            drawable.target(h);
                          } else {
                            jQuery('.flash').html("Error: edge of this type needs connect molecule process").fadeIn();
                            return;
                          }
                        }
                        break;
                      case "assignment" :
                    }
                      
                    //drawable.json().sbo=bui.util.getSBOForMarkerId(sel.marker);
                    drawable.marker(sel.marker);
                }
                this_editor.save($('#action').html());
                $.modal.close();
            }
        });
        //=========================
        /*$('#edge_modal_input').keydown(function(event){
            if(event.keyCode == 13){
            $.modal.close();
                event.preventDefault();
                return false;
            }
        });*/
    },
    //-------------------------------------------//
    // drops a ui-helper node from node type menu and generates the corresponding graph node
    createNode: function(nodetype, e){
        //calculate position of new node
        var pos_top = e.clientY-this.canvaspos.top;
        var pos_left = e.clientX-this.canvaspos.left;
        //set size of new node
        var size = {};
        if(nodetype=='Process'){
            size = {h:20, w:20};
        }else if((nodetype=='Compartment')||(nodetype=='Complex')){
            size = {h:100, w:100};
        }else {
            size = {h:50, w:50};
        }
        //create new node
        new_node = this.graph.add(bui[nodetype])
            .position(pos_left, pos_top)
            .size(size.h, size.w)
            .visible(true);
        //add parent if the drop is within a container like complex or compartment
        /*
        FIXME add this function again
        if ($(element).attr('id').indexOf('placeholder') === 0){
            var drawable_parent = this.graph.drawables()[$(element).attr('id').substring(12)];
                new_node.parent(drawable_parent);
                //alert('parent_id '+parent_id);
                if (drawable_parent.identifier() == 'Complex'){
                    drawable_parent.tableLayout();
                } else {
                    pos_top = pos_top-drawable_parent.position().y;
                    pos_left = pos_left-drawable_parent.position().x;
                    new_node.position(pos_left, pos_top);
                }
        }
        */
        //-----------------
        this.nodeModal(new_node, 'created '+nodetype);
        //-----------------
        //set click listener on new node
        new_node.bind(bui.Node.ListenerType.click, this.drawableSelect(), 'node_select');
        //set droppable listener on new node
        /*
        FIXME what is this can this be removed?
        $('#placeholder_'+new_node.id()).droppable({
            hoverClass: 'drop_hover',
            over : function(){$('#canvas').droppable("disable");},
            out : function(){$('#canvas').droppable("enable");},
            drop: function(event, ui){dropFkt(event, ui, this);}
        });
        */
        //make all drawables placeholders invisible
        //this.placeholdersVisible(false);
        //$('#canvas').droppable("enable");
    },
    //-------------------------------------------
    // helper function getting a list of first level nodes and edges
    
    get_nodes_edges: function(){
            var nodes = [], edges = [];
            var all_drawables = this.graph.drawables();
            var count = 0;
            for (var key in all_drawables) {
                drawable = all_drawables[key];
                drawable.index = count;
                ++count;
                if ((drawable.identifier()=='bui.EdgeHandle')||(drawable.identifier() == 'bui.Labelable')||(drawable.identifier() == 'Compartment')||(drawable.identifier() == 'bui.StateVariable')||(drawable.identifier() == 'bui.StateVariableER')){
                    //ignore
                }else if (drawable.drawableType()=='node'){
                    var dparent = drawable.parent();
                    if (('absolutePositionCenter' in drawable)&& (!('identifier' in dparent) || dparent.identifier() != 'Complex')){
                        var pos = drawable.absolutePositionCenter();
                        drawable.x = pos.x;
                        drawable.y = pos.y;
                        nodes.push(drawable);
                    }
                }else if(drawable.identifier() == 'bui.Edge'){
                    //----------------------------------
                    if (drawable.source().identifier() == 'bui.EdgeHandle'){
                        if(drawable.source().lparent.target().identifier() == 'bui.StateVariableER'){
                            drawable.lsource = drawable.source().lparent.target().parent();

                        }else if(drawable.source().lparent.target().identifier() == 'bui.EdgeHandle'){
                            if(drawable.source().lparent.target().lparent.target().identifier() == 'bui.StateVariableER'){
                                drawable.lsource = drawable.source().lparent.target().lparent.target().parent();
                            }else {
                                drawable.lsource = drawable.source().lparent.target().lparent.target();
                            }
                        }else {
                            drawable.lsource = drawable.source().lparent.target();
                        }
                    }else if(drawable.source().identifier() == 'bui.StateVariableER'){
                        drawable.lsource = drawable.source().parent();
                    }else {
                        drawable.lsource = drawable.source();
                    }
                    //----------------------------------
                    if (drawable.target().identifier() == 'bui.EdgeHandle'){
                        if(drawable.target().lparent.target().identifier() == 'bui.StateVariableER'){
                            drawable.ltarget = drawable.target().lparent.target().parent();

                        }else if(drawable.target().lparent.target().identifier() == 'bui.EdgeHandle'){
                            if(drawable.target().lparent.target().lparent.target().identifier() == 'bui.StateVariableER'){
                                drawable.ltarget = drawable.target().lparent.target().lparent.target().parent();
                            }else {
                                drawable.ltarget = drawable.target().lparent.target().lparent.target();
                            }

                        }else{
                            drawable.ltarget = drawable.target().lparent.target();
                        }

                    }else if(drawable.target().identifier() == 'bui.StateVariableER'){
                        drawable.ltarget = drawable.target().parent();
                    }else {
                        drawable.ltarget = drawable.target();
                    }
                    edges.push(drawable);
                }
            }
            return {nodes:nodes, edges:edges};
    },
    // select all nodes
    select_all: function(all){
        var all_drawables = this.graph.drawables();
        this.selected_nodes = [];
        for (var key in all_drawables) {
            var drawable = all_drawables[key];
            if (all){
                this.selected_nodes.push(drawable); // FIXME that may result in nodes being more than once in selection list, right?
                drawable.selected = true;
                drawable.addClass('selected');
            }else{
                drawable.selected = false;
                drawable.removeClass('selected');
            }
        }
    },
    //------------------------------------
    // disable box selection mode on graph
    disable_selection: function(){
        //disable listeners
        editor.graph.unbind(bui.Graph.ListenerType.dragStart, 'graphDragStart');
        editor.graph.unbind(bui.Graph.ListenerType.dragMove, 'graphDragMove');
        editor.graph.unbind(bui.Graph.ListenerType.dragEnd, 'graphDragEnd');
        this.graph.enablePanning(true);
        this.box.style.display = 'none';
    },
    //------------------------------------
    // enable box selection mode on graph
    // bind to graph's dragStart/Move/Stop to animate selection box
    enable_selection: function(){
        var this_editor = this;
        this.graph.enablePanning(false);
        /*if(this.cur_mode == 'selection'){
            console.log('rest pan and zoom');
            this.graph.scale(1);
            this.graph.transalte(0,0);
        }*/
        if(this.box === undefined) {
            this.box = document.body.appendChild(document.createElement('div'));

            var canvas = document.getElementById('canvas')
            interact.set(canvas, {
                drag:true,
                checkOnHover: false
            });

            function fireDragStart (event) {
                if (event.target === canvas) {
                    this_editor.graph.fire(bui.Graph.ListenerType.dragStart, [this_editor.graph, event]);
                }
            };

            function fireDragMove (event) {
                if (event.target === canvas) {
                    this_editor.graph.fire(bui.Graph.ListenerType.dragMove, [this_editor.graph, event]);
                }
            };

            function fireDragEnd (event) {
                if (event.target === canvas) {
                    this_editor.graph.fire(bui.Graph.ListenerType.dragEnd, [this_editor.graph, event]);
                }
            };

            canvas.addEventListener('interactdragstart', fireDragStart);
            canvas.addEventListener('interactdragmove', fireDragMove);
            canvas.addEventListener('interactdragend', fireDragEnd);
        }
            
        var box = this.box;
        box.id = 'box';
        box.style.border = 'dashed 1px blue';
        box.style.position = 'absolute';
        $('box').hide();

        this.graph.bind(
            bui.Graph.ListenerType.dragStart,
            function (graph, event) {
                this_editor.selected_nodes = [];
                this_editor.selection_borders = {};
                if ((this_editor.cur_mode == 'cursor') || (this_editor.cur_mode == undefined)){
                    $('box').show();
                    //box.style.display = 'block';
                    box.style.display = '';
                    box.style.left = event.detail.x0;
                    box.style.top = event.detail.y0;
                    box.style.width = Math.max(event.detail.dx, 0) + 'px';
                    box.style.height = Math.max(event.detail.dy, 0) + 'px';
                    
                }else if (this_editor.cur_mode == 'move'){
                    this_editor.selected_nodes_start_pos = {};
                    for (var i = this_editor.selected_nodes.length - 1; i >= 0; i--){
                        var pos = this_editor.selected_nodes[i].absolutePosition();
                        this_editor.selected_nodes_start_pos[this_editor.selected_nodes[i].id()] = {x: pos.x, y: pos.y};
                    }
                }
            },
            'graphDragStart'
        );

        this.graph.bind(
            bui.Graph.ListenerType.dragMove,
            function (graph, event) {
                if ((this_editor.cur_mode == 'cursor') || (this_editor.cur_mode == undefined)){
                    if (event.detail.x0>event.detail.pageX){
                        box.style.left = event.detail.pageX;
                        box.style.width = Math.max(event.detail.x0 - event.detail.pageX) + 'px';
                        this_editor.selection_borders.left = (event.detail.pageX - this_editor.canvaspos.left) / this_editor.graph.scale() - this_editor.graph.translate().x,
                        this_editor.selection_borders.right = (event.detail.x0 - this_editor.canvaspos.left) / this_editor.graph.scale() - this_editor.graph.translate().x;
                    }else{
                        box.style.left = event.detail.x0;
                        box.style.width = Math.max(event.detail.pageX - event.detail.x0) + 'px';
                        this_editor.selection_borders.left = (event.detail.x0 - this_editor.canvaspos.left) / this_editor.graph.scale() - this_editor.graph.translate().x;
                        this_editor.selection_borders.right = (event.detail.pageX - this_editor.canvaspos.left) / this_editor.graph.scale() - this_editor.graph.translate().x;
                    }
                    if (event.detail.y0>event.detail.pageY){
                        box.style.top = event.detail.pageY;
                        box.style.height = Math.max(event.detail.y0 - event.detail.pageY) + 'px';
                        this_editor.selection_borders.bottom = (event.detail.y0 - this_editor.canvaspos.top) / this_editor.graph.scale() - this_editor.graph.translate().y;
                        this_editor.selection_borders.top = (event.detail.pageY - this_editor.canvaspos.top) / this_editor.graph.scale() - this_editor.graph.translate().y;
                    }else{
                        box.style.top = event.detail.y0;
                        box.style.height = Math.max(event.detail.pageY - event.detail.y0) + 'px';
                        this_editor.selection_borders.bottom = (event.detail.pageY - this_editor.canvaspos.top) / this_editor.graph.scale() - this_editor.graph.translate().y;
                        this_editor.selection_borders.top = (event.detail.y0 - this_editor.canvaspos.top) / this_editor.graph.scale() - this_editor.graph.translate().y;
                    }

                    
                    
                    var all_drawables = this_editor.graph.drawables();
                    for (var key in all_drawables) {
                        var drawable = all_drawables[key];
                        if(drawable.drawableType() == 'node'){
                            var pos_top_left_abs = drawable.absolutePosition();
                            var size = drawable.size();
                            var pos_botm_rigt_abs = {x: pos_top_left_abs.x+size.width, y: pos_top_left_abs.y+size.height};
                            //console.log(JSON.stringify(pos_top_left_abs)+JSON.stringify(pos_botm_rigt_abs)+' == '+JSON.stringify(this_editor.selection_borders));
                            if((pos_top_left_abs.x>=this_editor.selection_borders.left) &&
                                (pos_botm_rigt_abs.x<=this_editor.selection_borders.right) &&
                                (pos_top_left_abs.y>=this_editor.selection_borders.top) &&
                                (pos_botm_rigt_abs.y<=this_editor.selection_borders.bottom)){
                                if (drawable.selected != true){
                                    drawable.addClass('selected');
                                    drawable.selected = true;
                                    this_editor.selected_nodes.push(drawable);
                                }
                            }else{
                                if (drawable.selected == true){
                                    drawable.removeClass('selected');
                                    drawable.selected = false;
                                    for (var i = this_editor.selected_nodes.length - 1; i >= 0; i--) {
                                        if (drawable == this_editor.selected_nodes[i]){
                                            this_editor.selected_nodes.splice(i, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }else if (this_editor.cur_mode == 'move'){
                    var move = {x:event.detail.pageX - this_editor.selection_borders.left, y: event.detail.pageY - this_editor.selection_borders.top};
                    for (var i = this_editor.selected_nodes.length - 1; i >= 0; i--){
                        this_editor.selected_nodes[i].absolutePosition(
                            this_editor.selected_nodes_start_pos[this_editor.selected_nodes[i].id()].x+move.x,
                            this_editor.selected_nodes_start_pos[this_editor.selected_nodes[i].id()].y+move.y
                            );
                    }
                }
            },
            'graphDragMove'
        );

        this.graph.bind(
            bui.Graph.ListenerType.dragEnd,
            function (graph, event) {
                $('box').hide();
                box.style.display = 'none';
            },
            'graphDragEnd'
        );
    },
    //set the SBGN language
    set_language: function(){
        var language_current = $('.language_current').html();
        $('.tools_drag li').each(function(){
            if (! $(this).hasClass(language_current)){
                $(this).hide();
            } else {
                $(this).show();
            }
        });
        $('.marker_select_box .marker_select').each(function(){
           if (! $(this).hasClass(language_current)){
                $(this).hide();
            } else {
                $(this).show();
            }
        });
        
    },
    delete_selected_nodes: function(){
        var nn = this.selected_nodes.length;
        for (var i = this.selected_nodes.length - 1; i >= 0; i--) this.selected_nodes[i].remove();
        this.selected_nodes = [];
        this.undoPush('deleted '+nn+' nodes');
    },
    //----------------------------------
    // setup the editor
    init: function(){
        var this_editor = this;
        //=========================
        var $_GET = {};

        // get GET parameters from url
        document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
            function decode(s) { return decodeURIComponent(s.split("+").join(" ")); }
            $_GET[decode(arguments[1])] = decode(arguments[2]);
        });

        if('layout' in $_GET){
            $.ajax({
                url: editor_config.url_layout,
                data: {jsbgn: JSON.stringify(editor_config.graphData), layout: 'biographer', data:bui.layouter.makeLayouterFormat(editor_config.graphData), filename: $_GET['filename']},
                type: 'POST',
                success: function(data) {
                    //console.log(data);
                    bui.layouter.fromLayouterFormat(editor_config.graphData,data);
                    this_editor.undoPush('applied automatic biographer layout');
                    this_editor.redrawGraph(editor_config.graphData);
                    //bui.importUpdatedNodePositionsFromJSON(graph, editor_config.graphData, 300)
                    }
            });
        }
        this.showUndoRedo();
 
        
        //=========================
        $('#hide_handles').click(function(){
            if (this_editor.edge_handles_visible === undefined){
                this_editor.edge_handles_visible = false;
            }
            this_editor.edge_handles_visible = !this_editor.edge_handles_visible;
            var all_drawables = this_editor.graph.drawables();
            for (var key in all_drawables) {
                drawable = all_drawables[key];
                if (drawable.identifier()=='bui.Edge'){
                    drawable.edgeHandlesVisible(this_editor.edge_handles_visible);
                }
                //drawable.recalculatePoints();
            }
        });
        //=========================
        $('#straighten_and_distribute').click(function(){
            if($(this).hasClass('fkt_active')){
                $(this).removeClass('fkt_active');
                bui.settings.straightenEdges = false;
            } else {
                $(this).addClass('fkt_active');
                bui.settings.straightenEdges = true;
            }

        });
        //=========================
        $('#vertical_gaps_equal, #horizontal_gaps_equal').click(function(){
            // sort drawables
            var sorted_drawables = [];
            for(var i=0; i<this_editor.selected_nodes.length; i++){
                sorted_drawables.push({
                x : this_editor.selected_nodes[i].absolutePosition().x,
                y : this_editor.selected_nodes[i].absolutePosition().y,
                drawable : this_editor.selected_nodes[i]
                });
            }
            if($(this).attr('id')=='vertical_gaps_equal'){
                sorted_drawables.sort(function(a,b) { return a.y - b.y; } );
            }else{
                sorted_drawables.sort(function(a,b) { return a.x - b.x; } );
            }
            //calculate gap space
            var gap_space = 0;
            for (var i=0; i<sorted_drawables.length-1; i++){
                if($(this).attr('id')=='vertical_gaps_equal'){
                    gap_space += sorted_drawables[i+1].drawable.absolutePosition().y - sorted_drawables[i].drawable.absoluteBottomRight().y;
                }else{
                    gap_space += sorted_drawables[i+1].drawable.absolutePosition().x - sorted_drawables[i].drawable.absoluteBottomRight().x;
                }
            }
            //set equal gaps
            var gap_length = gap_space/(sorted_drawables.length-1);
            for (var i=1; i<sorted_drawables.length-1; i++){
                if($(this).attr('id')=='vertical_gaps_equal'){
                    sorted_drawables[i].drawable.absolutePosition(sorted_drawables[i].drawable.absolutePosition().x, sorted_drawables[i-1].drawable.absoluteBottomRight().y+gap_length);
                }else{
                    sorted_drawables[i].drawable.absolutePosition(sorted_drawables[i-1].drawable.absoluteBottomRight().x+gap_length, sorted_drawables[i].drawable.absolutePosition().y);
                }
            }
            this_editor.undoPush('Applied Equal Gaps');
        });
        //=========================
        $('#align_vertical, #align_hoizontal, #align_left, #align_top, #align_right, #align_bottom').click(function(){
            var pos;
            for (var i = 0; i<this_editor.selected_nodes.length; ++i) {
                drawable = this_editor.selected_nodes[i];
                var align_type = $(this).attr('id');
                if ((drawable.drawableType()=='node')&&drawable.selected === true){
                    if((align_type == 'align_hoizontal')||(align_type == 'align_vertical')){
                        if(pos === undefined){
                            pos = drawable.absolutePositionCenter();
                            //alert('horiz vert'+JSON.stringify(pos));
                        }else{
                            if(align_type=='align_hoizontal'){
                                drawable.absolutePositionCenter(drawable.absolutePositionCenter().x,pos.y);
                            }else if(align_type=='align_vertical'){
                                drawable.absolutePositionCenter(pos.x, drawable.absolutePositionCenter().y);
                            }
                        }
                    }else if((align_type == 'align_left')||(align_type == 'align_top')){
                        if(pos === undefined){
                            pos = drawable.absolutePosition();
                            //alert('left top'+JSON.stringify(pos));
                        }else{
                            if(align_type=='align_left'){
                                drawable.absolutePosition(pos.x, drawable.absolutePosition().y);
                            }else if(align_type=='align_top'){
                                drawable.absolutePosition(drawable.absolutePosition().x,pos.y);
                            }
                        }
                    }else if((align_type == 'align_right')||(align_type == 'align_bottom')){
                        if(pos === undefined){
                            pos = drawable.absoluteBottomRight();
                            //alert('right bottom'+JSON.stringify(pos));
                        }else{
                            if(align_type=='align_right'){
                                drawable.absoluteBottomRight(pos.x, drawable.absoluteBottomRight().y);
                            }else if(align_type=='align_bottom'){
                                drawable.absoluteBottomRight(drawable.absoluteBottomRight().x, pos.y);
                            }
                        }
                    }
                }
            }
            this_editor.undoPush('Aligned Nodes');
        });
        //=========================
        $('#clear').click(function(){
            this_editor.redrawGraph({nodes:[],edges:[]});
            //this_editor.graph.clear();//FIXME this does not work
            this_editor.undoPush('Cleared Graph')
        });
        //=========================
        $('#clone').click(function(){
            orig_html = $('#clone').html();
            $('#clone').html(this_editor.loading_img);
            var new_nodes;
            if(this_editor.selected_nodes.length === 0) new_nodes = bui.util.clone(this_editor.graph, 5);
            else new_nodes = bui.util.clone(this_editor, 2, this_editor.selected_nodes);
            for (var i = new_nodes.length - 1; i >= 0; i--) {
                new_nodes[i].bind(bui.Node.ListenerType.click, this_editor.drawableSelect());
            }
            $('#clone').html(orig_html);
            this_editor.undoPush('Cloned Nodes');
        });
        //=========================
        $('#combine').click(function(){
            if(this_editor.selected_nodes.length === 0) bui.util.combine(this_editor.graph, this_editor.selected_nodes);
            this_editor.undoPush('Combined Nodes');
        });
        //=========================
        $('#layout_grid').click(function(evnt){
            nodes_edges = this_editor.get_nodes_edges();
            //orig_html = $('#layout_grid').html();
            //$('#layout_grid').html(this_editor.loading_img).ready(function(){
            bui.grid.init(nodes_edges.nodes,nodes_edges.edges);
            if (!evnt.ctrlKey){
                bui.grid.put_on_grid();
                bui.grid.layout();
            }else{
                bui.grid.put_on_grid();
                bui.grid.render_current();
            }
            this_editor.undoPush('Applied Grid Layout');
            //});
            //$('#layout_grid').html(orig_html);
        });
        //=========================
        $('#layout_force').click(function(){
         
            orig_html = $('#layout_force').html();
            $('#layout_force').html(this_editor.loading_img);
            nodes_edges = this_editor.get_nodes_edges();
            var nodes = [], links = [];
            //alert('in nodes '+nodes.length);
            bui.settings.straightenEdges = false;
            var force = d3.layout.force()
              .charge(-800)
              .linkDistance(150)
              .nodes(nodes_edges.nodes)
              .links(nodes_edges.edges)
              .size([$('#canvas').width(), $('#canvas').height()])
              .start();
            //this_editor.undoPush('Applied Force Directed Layout (D3)');//FIXME this executed to early
        });
        //=========================
        $('#layout_grahviz').click(function(){
            //FIXME!!!
            $.getJSON(editor_config.url_layout+'.json?layout=graphviz', function(data) {
                this_editor.showUndoRedo();
                bui.importUpdatedNodePositionsFromJSON(this_editor.graph, data.graph, 300);
                //redrawGraph(data.graph);
            });
        });
        //=========================
        $('#layout_biographer').click(function(){
            var orig_html = $('#layout_biographer').html();
            $('#layout_biographer').html(this_editor.loading_img);
            editor_config.graphData=this_editor.graph.toJSON();
            $.ajax({
                url: editor_config.url_layout,
                data: bui.layouter.makeLayouterFormat(editor_config.graphData),
                type: 'POST',
                success: function(data) {
                    //console.log(data);
                    bui.layouter.fromLayouterFormat(editor_config.graphData,data);
                    this_editor.undoPush('applied automatic biographer layout');
                    try{
                        this_editor.redrawGraph(editor_config.graphData);
                        this_editor.undoPush('Applied Biographer Flow Layout');
                    }catch(e){
                        jQuery('.flash').html('FAILED '+e).fadeIn();
                    }
                    //bui.importUpdatedNodePositionsFromJSON(graph, editor_config.graphData, 300)
                },
                complete: function(){
                    $('#layout_biographer').html(orig_html);
                }
            });
        });
        //=========================
        $('#undo').click(function(){
            this_editor.undo();
        });
        //=========================
        $('#redo').click(function(){
            this_editor.redo();
        });
        //=========================
        $('#add_unit_of_information').click(function(){
            $('#uoi_group').append(' <br/><input type="text" placeholder="mt:prot" class="unit_of_information" /> ');
            $('#simplemodal-container').css('height', parseInt($('#simplemodal-container').css('height')) + 20);
        });
        //=========================
        $('#add_state_variable').click(function(){
            $('#sv_group').append(' <br/><input type="text" placeholder="P@207" class="state_variable" /> ');
            $('#simplemodal-container').css('height', parseInt($('#simplemodal-container').css('height')) + 20);
        });
        //=========================
        $('.load').click(function(){
            $.ajax({
                url: editor_config.url_import,
                type: 'POST',
                dataType: 'json',
                data : {
                    type : $(this).attr('id'),
                    identifier : $('#'+$(this).attr('id')+'_input').val()
                },
                success: function( data ) {
                    this_editor.undoPush(data.action);
                    this_editor.redrawGraph(data.graph);
                    this_editor.modal.close();
                    return true;
                },
                error: function(xhr, textStatus, errorThrown) {
                    this_editor.modal.close();
                    jQuery('.flash').html(textStatus+' '+xhr.responseText).fadeIn();
                    return true;
                }
            });

        });
        //=========================
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
            $('#import_file_input').change(function(){
                var upload_element = $(this)[0];
                var file = upload_element.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.readAsText(file);//, "UTF-8");//TODO what encoding should be parsed???
                    reader.onload = function (evt) {
                        var content = evt.target.result;
                        //console.log('content: '+content);
                        var doc = sb.io.read(content);
                        if((doc === null)||(doc === undefined)){
                            $('.error').html('libSBGN.js: could not import file').fadeIn().delay(800).fadeOut();
                        }else{
                            this_editor.redrawGraph(JSON.parse(sb.io.write(doc, 'jsbgn')));
                            this_editor.undoPush('loaded graph from JSON string');
                        this_editor.modal.close();
                        }
                    };
                    reader.onerror = function (evt) {
                        console.log("error reading file");
                    };
                }
                return false;
            });
        } else {
            alert('The File APIs are not fully supported in this browser. You will not be able to upload jSBGN/SBGN-ML/SBML files. Please update your browser.');
        }
        $(".biomodels_select li").click(function(){
            var bmid = $(this).attr('bla');
            this_editor.modal.close();
            $('.flash').html('Loading BioModel BIOM'+bmid).fadeIn().delay(800).fadeOut();
            $.ajax({
                url: editor_config.url_import+".json",
                data : {
                    biomodel_id: bmid
                },
                dataType: 'json',
                success: function( data ) {
                    if (data.is_jsbgn == true){
                        this_editor.redrawGraph(JSON.parse(data.graph));
                        this_editor.md5 = data.md5;
                        this_editor.undoPush('loaded layed out BioModel '+bmid);
                        //$('.flash').html('loaded BioModel '+bmid).fadeIn().delay(1600).fadeOut();
                    }else{
                        this_editor.md5 = data.md5
                        var doc = sb.io.read(data.graph);
                        if((doc === null)||(doc === undefined)){
                            $('.error').html('libSBGN.js: could not import file').fadeIn().delay(800).fadeOut();
                        }else{
                            //console.log(sb.io.write(doc, 'jsbgn'));
                            this_editor.redrawGraph(JSON.parse(sb.io.write(doc, 'jsbgn')));
                            this_editor.undoPush('loaded BioModel '+bmid);
                            //$('.flash').html('loaded BioModel '+bmid).fadeIn().delay(1600).fadeOut();
                        }
                    }
                },
                error: function (){
                    $('.error').html('Could not save last action to session history');
                }
            });
            
        });
        $('#reactome').click(function(){
            var reid = $('#reactome_id').val();
            this_editor.modal.close();
            $('.flash').html('Loading Reactome '+reid).fadeIn().delay(1600).fadeOut();
            $.ajax({
                url: editor_config.url_import,
                data : {
                    reactome_id: reid
                },
                success: function( data ) {
                    var doc = sb.io.read(data);
                    if((doc === null)||(doc === undefined)){
                        $('.error').html('libSBGN.js: could not import file').fadeIn().delay(800).fadeOut();
                    }else{
                        this_editor.redrawGraph(JSON.parse(sb.io.write(doc, 'jsbgn')));
                        this_editor.undoPush('loaded Reactome '+reid);
                        //$('.flash').html('loaded Reactome '+reid).fadeIn().delay(1600).fadeOut();
                    }
                },
                error: function (){
                    $('.error').html('Could not save last action to session history');
                }
            });
        });
        //===
        $('#import_file').click(function() {
            this_editor.modal = $("#import_file_modal_input").modal({
                overlayClose:true,
                opacity:20
            });
        });
        //=========================
        $('#load_json_string').click(function(){
            this_editor.redrawGraph(JSON.parse($('#json_string').val()));
            this_editor.undoPush('loaded graph from JSON string');
            this_editor.modal.close();
        });
        //===
        $('#import_str').click(function() {
            this_editor.modal = $("#import_string_modal_input").modal({
                overlayClose:true,
                opacity:20
            });
        });
        /*$('#canvas').bind('mousewheel', function(event,delta){
            var rate;
            if (delta > 0) {
                // mousewheel is going up;
                rate = 0.1;
            } else {
                rate = -0.1;
                // mousewheel is going down
            }
            this_editor.graph.scale(this_editor.graph.scale() + rate);
        });*/
        //=========================
        $('.scale').click(function() {
            var rate = bui.util.toNumber($(this).data('rate'));
            this_editor.graph.scale(this_editor.graph.scale() + rate);
            return false;
        });
        //=========================
        $('#scale1').click(function() {
            this_editor.graph.scale(1);
        });
        //=========================
        $('#fit_to_screen').click(function() {
            this_editor.graph.fitToPage();
            this_editor.graph.reduceTopLeftWhitespace(100);
            return false;
        });
        //=========================
        $('h3.section').click(function(){
            $(this).parent().find('table').slideToggle();
            if($(this).hasClass('up')){
                $(this).removeClass('up').addClass('down');
            }else{
                $(this).removeClass('down').addClass('up');
            }
        });
        //=========================
        $('#edit_all_nodes, #edit_no_nodes').click(function(){
                var visible = $(this).attr('id')=='edit_all_nodes';
                this_editor.select_all(visible);
        });
        $('#canvas').dblclick(function(){
            var visible;
            var all_drawables = this_editor.graph.drawables();
            if(this_editor.selected_nodes.length != Object.keys(all_drawables).length) visible = true;
            else visible = false;
            this_editor.select_all(visible);
        });
        //=========================
        $('.tools_click li').click(function(){
            var mode = $(this).attr('id');
            this_editor.setMode(mode);
        });
        //=========================
        
        $('.marker_select').click(function(){
          if (this.parentNode.opened){ // implement dropbox toggle
            //$('#marker_type').html($(this).attr('id'));
            this.parentNode.marker=$(this).attr('id'); // save current marker type in parent div (select div)
            $('.marker_select').hide();
            $(this).show();
            this.parentNode.opened=false;
          } else {
            $('.marker_select').show();
            this.parentNode.opened=true;
          }
        });
        
        //=========================
        $('#save_to_session').click(function(){
            this_editor.save('manual');
        });
        //=========================
        $('#export_json').click(function(){
            window.location.href="data:text/json;fileName=download.json;charset=UTF-8," + JSON.stringify(this_editor.graph.toJSON());
        });
        //=========================
        $('#export_svg').click(function(){
            $.get(this_editor.bui_visualization_css_file, function(viscss) {
                window.location.href="data:text/svg;fileName=download.svg;charset=UTF-8," + encodeURIComponent($('#canvas svg').parent().html().replace(/@import url[^<]*/, viscss));
            });
        });
        //=========================
        $('#export_other').click(function() {
            this_editor.modal = $("#export_file_modal_input").modal({
                overlayClose:true,
                opacity:20
            });
        });
        //===
        $("#export_format_select").change(function(){
            if($('#export_format_select').val() != '... choose'){
                $('#export_form').html('<input type="hidden" name="format" value=\''+$('#export_format_select').val()+'\' /><input type="hidden" name="svg_data" value=\''+$('#canvas svg').parent().html()+'\' />').submit();
        }
        });
        //=========================
        $('.node').click(function(event){
            event.stopPropagation();//because body gehts hooked up to click event
            this_editor.select_all(false);
            this_editor.setMode('node');
            $('.active').removeClass('active');
            $(this).addClass('active');
            var nodetype = $(this).attr('id');
            $('.follow').hide();
            $('#follow_'+nodetype).show();
            $("#canvas").mousemove(function(e){
                $('#follow_'+nodetype).css('top', e.clientY-3).css('left', e.clientX-3);
            });
            $("body").click(function(e){
                this_editor.createNode(nodetype, e)
            });
            /*
            FIXME must implement this            
            // make compartments, complexes recieve droppable nodes
            $('.Complex, .Compartment').droppable({
                    hoverClass: 'drop_hover',
                    over : function(){$('#canvas').droppable("disable");},
                    out : function(){$('#canvas').droppable("enable");},
                    drop: function(event, ui){this_editor.dropFkt(event, ui, this);}
            });
            */
        });
        /*        
        $('#canvas').droppable({
                hoverClass: 'drop_hover',
                drop: function(event, ui){this_editor.dropFkt(event, ui, this);}
        });
        */
        // Mobile touch Support for drag tools
        // ATTENTION this did not work on the touch device I tested (galxy s3)
        /*var touchDragging = false,
            dragTools = document.querySelector('ul.tools_group.tools_drag');
        
        // catch touchevent and simulate a corresponding mouse event
        function touchToMouse (event) {
            var mouseEvent = document.createEvent('MouseEvents'),
                eventTypes = {
                    touchstart: 'mousedown',
                    touchmove: 'mousemove',
                    touchend: 'mouseup',
                    touchcancel: 'mouseup'
                },
                touch = event.touches[0] || event.changedTouches[0];
            
            mouseEvent.initMouseEvent(eventTypes[event.type], true, false, window, 0,
                touch.screenX || 0,
                touch.screenY || 0,
                touch.clientX || 0,
                touch.clientY || 0,
                false,
                false,
                false,
                false,
                0,
                window);
            
            event.target.dispatchEvent(mouseEvent);
            event.preventDefault();
        }
        
        // bind touch handlers
        dragTools.addEventListener('touchstart', function (event) {
                touchToMouse(event);
                touchDragging = true;
            });

        document.addEventListener('touchmove', function (event) {
                if (touchDragging) {
                    touchToMouse(event);
                }
            });
            
        document.addEventListener('touchend', function (event) {
                if (touchDragging) {
                    touchToMouse(event);
                    touchDragging = false;
                }
            });
        */
        $(".biomodels_start").click(function(){
            $(this).hide();
            $(".biomodels_select").show();
        });
        $(".biomodels_select").hover(
            function (){},
            function (){
                $(this).hide();
                $(".biomodels_start").show();
            }
            );
        $(".biomodels_select li").hover(
            function (e) {
                var ident = $(this).attr('bla');
                //console.log('should show '+ident+' top '+e.clientY+' left '+e.clientX);
                /*$('#'+ident).show();
                $(".biomodels_select").mousemove(function(e){
                    $('#'+ident).css('top', e.clientY+15).css('left', e.clientX+15);
                });*/
            },
            function(){
                $('#'+$(this).attr('bla')).hide();
                $("biomodels_select").unbind('mousemove');
            }
        );
        //-------------------------------------------------
        // get the language and only show glyps for that language
        this.set_language();
        $('.language_selection div').click(function(){
            $('.language_current').html($(this).html());
            $('.language_selection div').removeClass('lang_selected');
            $('.language_selection .'+$(this).html()).addClass('lang_selected');
            this_editor.set_language();
        });
        //-------------------------------------------------
        $('#store_layout').click(function(){
            $.ajax({
                url: editor_config.url_undo_push,
                data : {graph: JSON.stringify(this_editor.graph.toJSON()), action: 'layout stored', md5: this_editor.md5},
                type: 'POST',
                success: function( data ) {
                    $('.flash').html('Saved layout of '+this_editor.md5).fadeIn().delay(800).fadeOut();
                },
                error: function (){
                    $('.flash').html('Could not save layout');
                }
            });
        });
        //-------------------------------------------------
        $('.close_modal').click(function(){
            this_editor.modal.close();
        });
        //-------------------------------------------------
        //this is for touch devices
        $('.language_current').click(function(){
            $('.language_selection').fadeToggle();
        });
        //-------------------------------------------------
        //remove selected nodes if del was pressed on the keyboard
        $(document).keyup(function(event) {
            if (event.keyCode == 46) { // us: del; german: entf
                this_editor.delete_selected_nodes(); 
            }
            //console.log('shift '+event.shiftKey);
            this_editor.shifted = event.shiftKey;
        });
        $(document).keydown(function(event){
            //ctrl + a  select all
            if ((event.ctrlKey || event.metaKey) && event.keyCode == 65) {
                this_editor.select_all(true);
                //event.disableTextSelect();
                event.preventDefault();
                return false;
            }
            //console.log('down shift '+event.shiftKey)
            this_editor.shifted = event.shiftKey
        });
        //-------------------------------------------------
        document.body.onmousewheel = function (event) {
            this_editor.graph.fire(bui.Graph.ListenerType.wheel, [this_editor.graph, event]);
        }
        //-------------------------------------------------
        this_editor.shifted = false;
        $('#del').click(function(){this_editor.delete_selected_nodes();})
    }
};


