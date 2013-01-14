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
    this.active = false;//delayed undo push active?
    this.delayed;//needs to be initialized for saving of delay action
    this.ctrl_delayed;//same as above
    this.shifted = false;//is shift key currently pressed down
    this.colorcombos = [
        ['828277','D4E8C1','8DB87C','F5D769','ED8A3F'],
        ["927B51","A89166","80C31C","BCDD5A","FF7900","FBB36B"],
        ["B96A9A","D889B8","9CC089","D8F3C9","FDE8D7","FFFFFF"],
        ["AEB05D","DCD191","D3A46E","E39871","DF7D60"],
        ["AFCBF3","6195C5","EECD86","E49E7A","E39183"]
        ];
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
    trigger_delayed_undoPush: function(action, delta){
        clearTimeout(this.delayed);
        if(delta === undefined) delta=2500;
        var this_editor = this;
        this.delayed = setTimeout(function() {
            if(this_editor.active === false){
                this_editor.active = true;
                this_editor.undoPush(action);
                this_editor.active = false;
            }
        }, delta);
    },
    //-------------------------------------------
    // replace graph with new graph defined by json object
    redrawGraph: function(graph_json){
       // clear graph
        var all_drawables = this.graph.drawables();
        var key;
        if (this.graph){
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
                var drawable = all_drawables[key];
                this.bindDrawable(drawable)
            }else{
                all_drawables[key].bind(bui.AbstractLine.ListenerType.click, editor.drawableSelect());
            }
          }
        }
        this.setLanguage();
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
            $('#undo .pp').html(html_history);
        }else{
            $('#undo').addClass('disabled');
            $('#undo .pp').html('undo');
        }
        if(editor_config.history_redo.length > 0){
            $('#redo').removeClass('disabled');
            $('#redo .pp').html(editor_config.history_redo.join('<br/>'));
            newArray = editor_config.history_redo.slice();
            html_history = '';
            for (var i = newArray.length - 1; i >= 0; i--) {
                html_history += newArray[i].action+'<br/>';
            }
            $('#redo .pp').html(html_history);
        }else{
            $('#redo').addClass('disabled');
            $('#redo .pp').html('redo');
        }
    },
    //-------------------------------------------
    // add a new state to undo list
    undoPush: function(action){
        var editor = this;
        for(var i=0; i<this.selected_nodes.length; ++i) this.selected_nodes[i].removeClass('selected');
        var drop_drawable = this.graph.drawables()[$('.drop_here').attr('id')];
        if (drop_drawable !== undefined) drop_drawable.removeClass('drop_here');
        var jsong = JSON.stringify(this.graph.toJSON());
        for(var i=0; i<this.selected_nodes.length; ++i) this.selected_nodes[i].addClass('selected');
        if (jsong == this.last_save){
            //$('.flash').html('Saved: nothing changed, woooah').fadeIn().delay(800).fadeOut();
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
            $('.compartment, .complex').unbind('hover');
            var drop_drawable = this.graph.drawables()[$('.drop_here').attr('id')];
            if (drop_drawable !== undefined) drop_drawable.removeClass('drop_here');
        }
        if (mode == this.cur_mode) return;
        this.cur_mode = mode;
        //console.log('set cur_mode: '+this.cur_mode);
        $('#canvas').unbind('mousemove');
        $('.follow').hide();
        $('.active').removeClass('active');
        var mode2id = {'edit':'wrench', 'Edge':'edge', 'focus':'focus', 'move': 'move', 'selection': 'selection'};
        if ((mode === undefined)||(mode == 'cursor')){
            $('#cursor').addClass('active');
            this.enableSelection();
        }else{
            $('#'+mode).addClass('active');
            $('#follow_'+mode2id[mode]).show();
            $("#canvas").mousemove(function(e){
                $('#follow_'+mode2id[mode]).css('top', e.clientY+15).css('left', e.clientX+15);
            });
        }
        if ( this.cur_mode == 'move' ){
                this.disableSelection();
        }else if (mode == 'Edge'){
            for (var i = this.selected_nodes.length - 1; i >= 0; i--) {
                this.selected_nodes[i].selected = false;
                this.selected_nodes[i].removeClass('selected');
            }
            this.selected_nodes = [];
            this.rightMenu();
            $('.flash').html('<h2>Please click on two nodes to create an edge<h2>').fadeIn().delay(5000).fadeOut();
        }
    },
    showColorCombo: function(){
        for(var i=0;i<this.colorcombos.length;++i){
            var combo = [];
            for (var j=0;j<this.colorcombos[i].length;++j){
                combo.push('<div class="combo_color" style="background-color:#'+this.colorcombos[i][j]+'"></div>');
            }
            $('.colorcombos').append('<div class="select_combo" id="'+i+'">combo '+i+'<br>'+(combo.join(' '))+'</div>');
        }
    },
    setColorCombo: function(index){
        index = parseInt(index,10);
        var drawables = this.graph.drawables();
        for (var key in drawables){
            var drwbl = drawables[key];
            if (drwbl.color !== undefined) drwbl.color({border: '#aaa'});
            if(drwbl.identifier() == 'SimpleChemical') drwbl.color({background: "#"+this.colorcombos[index][0]});
            else if(drwbl.identifier() == 'Macromolecule') drwbl.color({background: "#"+this.colorcombos[index][1]});
            else if(drwbl.identifier() == 'UnspecifiedEntity') drwbl.color({background: "#"+this.colorcombos[index][2]});
            else if(drwbl.identifier() == 'Complex') drwbl.color({background: "#"+this.colorcombos[index][3]});
            else if(drwbl.identifier() == 'Process') drwbl.color({background: "#"+this.colorcombos[index][4]});
            else if(drwbl.identifier() == 'EmptySet') drwbl.color({background: "#"+this.colorcombos[index][5]});
        }
        this.undoPush('applied color combo '+index);
    },
    //-------------------------------------------//
    createEdge: function(){
        //draw edge now
        new_edge = this.graph.add(bui[this.cur_mode])
                .source(this.selected_nodes[0])
                .target(this.selected_nodes[1])
                .visible(true);
        for (var i = this.selected_nodes.length - 1; i >= 0; i--) {
            this.selected_nodes[i].selected = false;
            this.selected_nodes[i].removeClass('selected');
        }
        //set click listener on new edge
        new_edge.bind(bui.AbstractLine.ListenerType.click, editor.drawableSelect());
        this.selectAll(false);
        this.select(new_edge);
        this.rightMenue_show(true);
    },
    //-------------------------------------------//
    // drops a ui-helper node from node type menu and generates the corresponding graph node
    createNode: function(nodetype, e){
        //calculate position of new node
        //FIXME need the translated positions similar to selection rectangle
        var pos = this.graph.toGraphCoords( e.pageX-this.canvaspos.left, e.pageY-this.canvaspos.top ) ;
        
        //set size of new node
        var size = {};
        if(nodetype=='Process'){
            size = {h:20, w:20};
        }else if((nodetype=='Compartment')||(nodetype=='Complex')){
            size = {h:100, w:100};
        }else if(nodetype=='VariableValue'){
            size = {h:50, w:20};
        }else if(nodetype=='LogicalOperator'){
            size = {h:20, w:20};
        }else {
            size = {h:50, w:50};
        }
        //create new node
        var drawable = this.graph.add(bui[nodetype])
            .position(pos.x, pos.y)
            .size(size.h, size.w)
            .visible(true);
        if((drawable.identifier()=="Association") || (drawable.identifier()=="Dissociation")){
            drawable.size(20,20);
        }
        //-----------------------------
        //add parent if the drop is within a container like complex or compartment
        this.drawableAddChild(drawable, this.graph.drawables()[$('.drop_here').attr('id')], e);
        //-----------------
        this.bindDrawable(drawable);
        this.selectAll(false);
        this.select(drawable);
        this.rightMenue_show(true);
        this.setMode('cursor');
        this.drawableSelect()(drawable, true);
        $('#node_label').focus();
        this.trigger_delayed_undoPush('created node', 4000);
    },
    //-------------------------------------------//
    // multiple drag move function
    bindDrawable: function(drawable){
        //set click listener on new node
        drawable.bind(bui.Node.ListenerType.click, this.drawableSelect(), 'node_select');
        // Set drag function to move all other selected nodes
        drawable.bind(bui.Node.ListenerType.dragMove,this.multiMove(),'multiple drag');
        // make dragged nodes droppable into complexes and createNode: function(nodetype, e)compartments
        drawable.bind(bui.Node.ListenerType.dragStart,this.dragStartChild(),'dragstart makechild');
        // bind drag stop to save and add child if possible
        drawable.bind(bui.Node.ListenerType.dragEnd,this.dragStopChild(),'dragstop makechild');

        
    },
    //-------------------------------------------//
    dragStartChild: function(){
        var this_editor = this;
        return function(){
            // must do this complicated hover function since hover() does not work since the dragged element is under the mouse
            // from http://stackoverflow.com/questions/5587703/css-hover-how-to-get-lower-divs-to-hover-as-well
            // TODO is ther a better solution??
            $('.compartment, .complex').bind('intersect',function(e){
                var $me = this_editor.graph.drawables()[$(this).attr('id')];
                var pos = $(this).offset();
                var size = $me.size();
                
                if ( e.pageX > pos.left && e.pageY > pos.top && e.pageX < pos.left + size.width && e.pageY < pos.top + size.height ) {
                    $me.addClass('drop_here');
                } else if($me.hasClass('drop_here')) {
                    $me.removeClass('drop_here');
                }
            });
            $('#canvas').mousemove(function(e){
                var evt = jQuery.Event('intersect');
                evt.pageX = e.pageX;
                evt.pageY = e.pageY;
                $.event.trigger(evt);
            });
        };
    },
    dragStopChild: function(){
        var this_editor = this;
        return function(drawable, e){
            $('#canvas').unbind('mousemove');
            $('.compartment, .complex').unbind('intersect');
            if( $('.drop_here').attr('id') !== undefined){
                //-----------------------------
                //add parent if the drop is within a container like complex or compartment
                //FIXME this causes errrooooorrrr
                //this_editor.drawableAddChild(drawable, this_editor.graph.drawables()[$('.drop_here').attr('id')], e);
                //-----------------------------
                var drop_drawable = this_editor.graph.drawables()[$('.drop_here').attr('id')];
                if (drop_drawable !== undefined) drop_drawable.removeClass('drop_here');
                //-------------------------------------------//
                this_editor.undoPush('moved node and changed parent');
            }else{
                this_editor.undoPush('moved node(s)');
            }
        };
    },
    drawableAddChild: function(drawable, parent, e){
        if(parent !== undefined){
            if (drawable.parent().identifier() != 'Graph'){
                drawable.parent().removeChild(drawable);
            }
            drawable.parent(parent);
            if (parent.identifier() == 'Complex'){
                parent.tableLayout();
            } else {
                var pos = this.graph.toGraphCoords( e.pageX-this.canvaspos.left, e.pageY-this.canvaspos.top ) ;
                drawable.absolutePosition(pos.x, pos.y);
            }
        }else {
            drawable.parent(this.graph);
        }
    },
    //-------------------------------------------//
    // multiple drag move function
    multiMove: function(){
        var this_editor = this;
        return function (node, event) {
            if ( (this.cur_mode === 'cursor' || this.cur_mode === undefined) && (node.selected === true) ){
                for (var i = 0; i < this_editor.selected_nodes.length; i++) {
                    var scale = this_editor.graph.scale(),
                        dx = event.detail.dx / scale,
                        dy = event.detail.dy / scale;

                    if (this_editor.selected_nodes[i] instanceof bui.Node &&
                        this_editor.selected_nodes[i] !== node) {
                        this_editor.selected_nodes[i].move(dx, dy);
                    }
                }
            }
        };
    },
    //-------------------------------------------
    // general handler for clicks on nodes
    // depends on current edit mode
    drawableSelect: function() {
        var this_editor = this; // closure for this object
        return function(drawable, select_status){
            if (this_editor.cur_mode in {undefined:1, 'cursor':1, 'Edge':1}){
                if (
                    (this_editor.shifted === true)||
                    ( (this_editor.cur_mode == "Edge") && (drawable.drawableType()=='node') )
                    ){
                    //shif key is down
                    //add all drawable to selection, if already selected remove selection
                    if (drawable.selected === true){
                        this_editor.deselect(drawable);
                    }else{
                        this_editor.select(drawable);
                    }
                }else{
                    //shift key is not down
                    this_editor.selectAll(false);
                    this_editor.select(drawable);
                }
            }
            if (this_editor.cur_mode == 'Edge'){
                if (this_editor.selected_nodes.length>=2){
                    this_editor.createEdge();
                }
            } /*else if (this_editor.cur_mode == 'focus'){//TODO focus is not part of the editor anymore since I do not consider this as a useful feature
                if(drawable.drawableType()=='node') bui.util.alignCanvas(this_editor.graph, drawable.id());
            }*/
            this_editor.rightMenu();
        };
    },
    rightMenu: function(){
        var this_editor = this;
        var i, drawable;
        if(this.cur_mode == 'Edge'){
            $('.rm_node').hide();
            $('.rm_edge').show();
            $('.rm .message').hide();
        }else if(this.selected_nodes>=1 && this.selected_edges>=1){
            //FIXME
            $('.rm_edge').hide();
            $('.rm_node').hide();
            $('.rm .message').show();
        }else if(this.selected_edges.length>=1){
            $('.rm_node').hide();
            $('.rm_edge').show();
            $('.rm .message').hide();
            //===========================================
            $('.selected_marker').removeClass('selected_marker');
            drawable = this.selected_edges[0];
            //===========================================
            if(this.selected_edges.length==1){
                $('#'+drawable.marker()).addClass('selected_marker');
            }
            //===========================================
            if (drawable.spline() === true){
                $('#edge_is_spline').attr('checked', 'checked');
            }else {
                $('#edge_is_spline').removeAttr('checked');
            }
        }else if(this.selected_nodes.length>=1){
            $('.rm_node').show();
            $('.rm_edge').hide();
            $('.rm .message').hide();
            drawable = this.selected_nodes[0];
            //===========================================
            var node_ids = [];
            for(i=0;i<this.selected_nodes.length;++i) node_ids.push(this.selected_nodes[i].id());
            $('#node_id').html(node_ids.join(', '));
            if (this.selected_nodes.length == 1) {
                $('.node_type_box').show();
                $('#node_type').val(drawable.identifier());
            }else{
                $('.node_type_box').hide();
            }
            //===========================================
            if (drawable.parent().label !== undefined && this.selected_nodes.length==1){
                $('.parent_box').show();
                var parent = drawable.parent();
                $('#node_parent').html(parent.label()+' ('+parent.id()+') - '+parent.identifier() );
            }else{$('.parent_box').hide();}
            //===========================================
            if (drawable.color !== undefined){
                $('.color_box').show();
                var cur_color = drawable.color();
                var setcolor = function(target, color){
                    $(target).ColorPickerSetColor(color);
                    $(target + ' div').css('backgroundColor', color);
                };
                if (cur_color.background !== '') setcolor('.color_bg', cur_color.background);
                else setcolor('.color_bg', 'FFFFFF');
                if (cur_color.border !== '') setcolor('.color_bd', cur_color.border);
                else setcolor('.color_bd', '000000');
                if (cur_color.label !== '') setcolor('.color_tx', cur_color.label);
                else setcolor('.color_tx', '000000');
            }else{
                $('.color_box').hide();
            }
            //===========================================
            if(drawable.identifier() in {'Macromolecule':1, 'UnspecifiedEntity': 1} && this.selected_nodes.length == 1){
                $('.uoi_box, .state_variable_box').show();
                var randomnumber = Math.floor(Math.random()*1501);
                $('#sv_group').html('<input type="text" placeholder="P@'+randomnumber+'" class="state_variable" /> ');
                $('#uoi_group').html('<input type="text" placeholder="mt:prot" class="unit_of_information" />');
                var dc = drawable.children();
                var ci = 0, cj = 0;
                for (i=0; i<dc.length; ++i){
                    randomnumber = Math.floor(Math.random()*1501);
                    if (dc[i].identifier() in {'StateVariable':1,'StateVariableER':1} ){
                        if (ci<1) $('.state_variable').val(dc[i].label());
                        else $('#sv_group').append(' <br/><input type="text" class="state_variable" placeholder="P@'+randomnumber+'" value="'+dc[i].label()+'"/> ');
                        ++ci;
                    }
                    if (dc[i].identifier() == "UnitOfInformation" ){
                        if (cj<1) $('.unit_of_information').val(dc[i].label());
                        else $('#uoi_group').append(' <br/><input type="text" class="unit_of_information" value="'+dc[i].label()+'"/> ');
                        ++cj;
                    }
                }
                $('.state_variable').unbind('keyup');
                $('.state_variable').keyup(function(){
                    this_editor.editNode();
                });
                $('.unit_of_information').unbind('keyup');
                $('.unit_of_information').keyup(function(){
                    this_editor.editNode();
                });
            }else{
                $('.uoi_box, .state_variable_box').hide();
            }
            //===========================================
            if (drawable.identifier() in {"Association": 1, "Dissociation":1, "EmptySet":1}){
                $('#node_label_row, .color_tx_box').hide();
                $('#node_label').val('');
            }else{
                $('.color_tx_box').show();
                if(this.selected_nodes.length==1){
                    $('#node_label_row').show();
                    $('#node_label').val(drawable.label());
                }else{
                    $('#node_label_row').hide();
                    $('#node_label').val('');
                }
            }
            //===========================================
            //===========================================
            var showNext = function(nodes, fkt_name){
                var flag = true;
                for (i=0;i<nodes.length;++i){
                    if (nodes[i][fkt_name] === undefined){
                        flag = false;
                        break;
                    }
                }
                if (! flag){
                    $('.'+fkt_name+'_box').hide();
                }else{
                    $('.'+fkt_name+'_box').show();
                    if (drawable[fkt_name]() === true){
                        $('#node_is_'+fkt_name).attr('checked', 'checked');
                    }else {
                        $('#node_is_'+fkt_name).removeAttr('checked');
                    }
                }
            };
            //===========================================
            //===========================================
            showNext(this.selected_nodes, 'multimer');
            //===========================================
            showNext(this.selected_nodes, 'clonemarker');
            //===========================================
            showNext(this.selected_nodes, 'existence');
            //===========================================
            showNext(this.selected_nodes, 'location');
            //===========================================
            //===========================================
        }else{
            $('.rm_edge').hide();
            $('.rm_node').hide();
            $('.rm .message').show();
        }
    },
    editEdge: function(){
        if (this.selected_edges.length >= 1){
            var cur_marker = $('.selected_marker').attr('id');
            for(var i=0;i<this.selected_edges.length >= 1;++i){
                var drawable = this.selected_edges[i];
                //======================================
                drawable.spline($('#edge_is_spline').is(':checked'));
                drawable.layoutElementsVisible(true);
                //======================================
                if(this.graph.language() == "PD"){
                    if (cur_marker == 'production') {
                        if (!(drawable.source() instanceof bui.Process)){
                          if (drawable.target() instanceof bui.Process){
                            var h=drawable.source();  // swap source / target
                            drawable.source(drawable.target());
                            drawable.target(h);
                          } else {
                            jQuery('.flash').html("Error: production edge needs connect process to molecule").fadeIn().delay(1500).fadeOut();
                            return;
                          }
                        }
                    }else if(cur_marker in {"control":1,'stimulation':1,'catalysis':1,'inhibition':1,'necessaryStimulation':1}){
                        if (!(drawable.target() instanceof bui.Process)){
                          if (drawable.source() instanceof bui.Process){
                            var h=drawable.source();  // swap source / target
                            drawable.source(drawable.target());
                            drawable.target(h);
                          } else {
                            jQuery('.flash').html("Error: edge of this type needs connect molecule process").fadeIn().delay(1500).fadeOut();
                            return;
                          }
                        }
                    }
                }
                drawable.marker(cur_marker);
            }
        }
    },
    editNode: function(){
        var this_editor = this;
        if (this_editor.selected_nodes.length >= 1){
            var drawable = this_editor.selected_nodes[0];
            // change the node type by delting the node and creating a new node
            if( this_editor.selected_nodes.length == 1 && $('#node_type').val() != drawable.identifier()){
                // FIXME must be implemented
                //create the new node
                //apply all attributes of old node if possible
                //make edges point to new node
                //delte old node
            }
            // set the label of the node
            if ( ($('#node_label').val() !== '') && (drawable.label !== undefined) ){
                drawable.label($('#node_label').val()).adaptSizeToLabel();
            }
            //-----------------
            if (this_editor.selected_nodes.length==1){
                //set child nodes like StateVariables and UnitsOfInformation
                //brute force remove all children and add them agin, less code :D
                var dc = drawable.children();
                for (var i =0; i<dc.length; ++i){
                    if (dc[i].identifier() in {'StateVariable':1,'StateVariableER':1,'UnitOfInformation':1} ){
                        drawable.removeChild(dc[i]);
                        dc[i].remove();

                    }
                }
                var added_flag = false;
                $('.state_variable').each(function(){
                    if ($(this).val() !== '') {
                        added_flag = true;
                        this_editor.graph.add(bui.StateVariable)
                        .parent(drawable)
                        .label($(this).val())
                        .adaptSizeToLabel(true)
                        .visible(true);
                    }
                });
                //-----------------
                $('.unit_of_information').each(function(){
                    if($(this).val() !== '') {
                        added_flag = true;
                        this_editor.graph.add(bui.UnitOfInformation)
                        .parent(drawable)
                        .label($(this).val())
                        .adaptSizeToLabel(true)
                        .visible(true);
                    }
                });
                if (added_flag) drawable.positionAuxiliaryUnits(); // organise them neatly
            }
            for(i=0;i<this.selected_nodes.length;++i){
                var drawable = this.selected_nodes[i];
                //-----------------
                if (drawable.multimer !== undefined){drawable.multimer($('#node_is_multimer').is(':checked')); }
                if (drawable.clonemarker !== undefined) drawable.clonemarker($('#node_is_clonemarker').is(':checked'));
                if (drawable.existence !== undefined) drawable.exitence($('#node_is_extence').is(':checked'));
                if (drawable.location !== undefined) drawable.location($('#node_is_location').is(':checked'));
                //-----------------
                if(this_editor.color_bg !== undefined) drawable.color( { background: this_editor.color_bg} );
                if(this_editor.color_bd !== undefined) drawable.color( { border: this_editor.color_bd} );
                if(this_editor.color_tx !== undefined) drawable.color( { label: this_editor.color_tx} );
            }
            
            this.trigger_delayed_undoPush('changed node attributes');
        }
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
                if ((drawable.identifier()=='EdgeHandle')||(drawable.identifier() == 'bui.Labelable')||(drawable.identifier() == 'Compartment')||(drawable.identifier() == 'StateVariable')||(drawable.identifier() == 'StateVariableER')){
                    //ignore
                }else if (drawable.drawableType()=='node'){
                    var dparent = drawable.parent();
                    if (('absolutePositionCenter' in drawable)&& (!('identifier' in dparent) || dparent.identifier() != 'Complex')){
                        var pos = drawable.absolutePositionCenter();
                        drawable.x = pos.x;
                        drawable.y = pos.y;
                        nodes.push(drawable);
                    }
                }else if(drawable.identifier() == 'Edge'){
                    //----------------------------------
                    if (drawable.source().identifier() == 'EdgeHandle'){
                        if(drawable.source().lparent.target().identifier() == 'StateVariableER'){
                            drawable.lsource = drawable.source().lparent.target().parent();

                        }else if(drawable.source().lparent.target().identifier() == 'EdgeHandle'){
                            if(drawable.source().lparent.target().lparent.target().identifier() == 'StateVariableER'){
                                drawable.lsource = drawable.source().lparent.target().lparent.target().parent();
                            }else {
                                drawable.lsource = drawable.source().lparent.target().lparent.target();
                            }
                        }else {
                            drawable.lsource = drawable.source().lparent.target();
                        }
                    }else if(drawable.source().identifier() == 'StateVariableER'){
                        drawable.lsource = drawable.source().parent();
                    }else {
                        drawable.lsource = drawable.source();
                    }
                    //----------------------------------
                    if (drawable.target().identifier() == 'EdgeHandle'){
                        if(drawable.target().lparent.target().identifier() == 'StateVariableER'){
                            drawable.ltarget = drawable.target().lparent.target().parent();

                        }else if(drawable.target().lparent.target().identifier() == 'EdgeHandle'){
                            if(drawable.target().lparent.target().lparent.target().identifier() == 'StateVariableER'){
                                drawable.ltarget = drawable.target().lparent.target().lparent.target().parent();
                            }else {
                                drawable.ltarget = drawable.target().lparent.target().lparent.target();
                            }

                        }else{
                            drawable.ltarget = drawable.target().lparent.target();
                        }

                    }else if(drawable.target().identifier() == 'StateVariableER'){
                        drawable.ltarget = drawable.target().parent();
                    }else {
                        drawable.ltarget = drawable.target();
                    }
                    edges.push(drawable);
                }
            }
            return {nodes:nodes, edges:edges};
    },
    select: function (drawable) {
        if (drawable.selected === true) {return;}

        var this_editor = this;
        if (drawable.drawableType() == 'node'){
          this.selected_nodes.push(drawable);
        } else {
            drawable.layoutElementsVisible(true);
            this.selected_edges.push(drawable);
        }
        drawable.selected = true;
        drawable.addClass('selected');
    },
    deselect: function (drawable) {
        if (!drawable.selected) {return;}

        if (drawable.drawableType() == 'node'){
          this.selected_nodes.splice(this.selected_nodes.indexOf(drawable), 1);
        } else {
            drawable.layoutElementsVisible(false);
            this.selected_edges.splice(this.selected_edges.indexOf(drawable), 1);
        }
        drawable.selected = false;
        drawable.removeClass('selected');
    },

    // select all nodes
    selectAll: function(all){
        var all_drawables = this.graph.drawables();
        this.selected_nodes = [];
        for (var key in all_drawables) {
            var drawable = all_drawables[key];
            if (all){
                this.select(drawable);
            }else{
                this.deselect(drawable);
            }
        }
    },
    //------------------------------------
    // disable box selection mode on graph
    disableSelection: function(){
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
    enableSelection: function(){
        var this_editor = this;
        this.graph.enablePanning(false);
        /*if(this.cur_mode == 'selection'){
            console.log('rest pan and zoom');
            this.graph.scale(1);
            this.graph.transalte(0,0);
        }*/
        if(this.box === undefined) {
            this.box = document.body.appendChild(document.createElement('div'));

            var canvas = document.getElementById('canvas');
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
                this_editor.orignially_selected_drawables = this_editor.selected_nodes.slice(0);
                this_editor.orignially_selected_drawables = this_editor.orignially_selected_drawables.concat(this_editor.selected_edges.slice(0));
                this_editor.selection_borders = {};
                if ((this_editor.cur_mode == 'cursor') || (this_editor.cur_mode === undefined)){
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
                if ((this_editor.cur_mode == 'cursor') || (this_editor.cur_mode === undefined)){
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
                        if(drawable.absolutePosition !== undefined){
                            var pos_top_left_abs = drawable.absolutePosition();
                            var pos_botm_rigt_abs = drawable.absoluteBottomRight();
                            //console.log(JSON.stringify(pos_top_left_abs)+JSON.stringify(pos_botm_rigt_abs)+' == '+JSON.stringify(this_editor.selection_borders));
                            if((pos_top_left_abs.x>=this_editor.selection_borders.left) &&
                                (pos_botm_rigt_abs.x<=this_editor.selection_borders.right) &&
                                (pos_top_left_abs.y>=this_editor.selection_borders.top) &&
                                (pos_botm_rigt_abs.y<=this_editor.selection_borders.bottom)){

                                if(this_editor.shifted){
                                    if(this_editor.orignially_selected_drawables.indexOf(drawable) != -1){
                                        this_editor.deselect(drawable);
                                    }else{
                                        this_editor.select(drawable);
                                    }
                                }else{
                                    this_editor.select(drawable);
                                }
                            }else{
                                if(this_editor.shifted){
                                    if(this_editor.orignially_selected_drawables.indexOf(drawable) != -1){
                                        this_editor.select(drawable);
                                    }else{
                                        this_editor.deselect(drawable);
                                    }
                                }else{
                                    this_editor.deselect(drawable);
                                }

                            }
                        }
                    }
                    this_editor.rightMenu();
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
    setLanguage: function(){
        var language_current = this.graph.language();
        $('.language_current').html(language_current);
        $('.language_selection div').removeClass('lang_selected');
        $('.language_selection .'+language_current).addClass('lang_selected');
        console.log('set lang '+language_current);
        $('.tools_drag li, .marker_select, .combomaker tr, #node_type option').each(function(){
            if (! $(this).hasClass(language_current)){
                $(this).hide();
            } else {
                $(this).show();
            }
        });
        
    },
    deleteSelectedNodes: function(){
        var nn = this.selected_nodes.length;
        for (var i = this.selected_nodes.length - 1; i >= 0; i--) this.selected_nodes[i].remove();
        this.selected_nodes = [];
        this.undoPush('deleted '+nn+' nodes');
    },
    /*
    * if not iput toggle
    */
    rightMenue_show: function(show){
        var lm = $('.rm');
        var tw = -1*lm.outerWidth()+parseInt($('.rm_peek').css('width'),10);
        var cw = parseInt(lm.css('right'),10);
        if(cw == tw){
            $('.rm_peek .bg').addClass('out');
            $('.rm_peek .bg').removeClass('in');
        }else{
            $('.rm_peek .bg').removeClass('out');
            $('.rm_peek .bg').addClass('in');            
        }
        //$('.rm_peek .bg').attr('class', cw == tw ? 'out' : 'in');
        if (show == undefined) lm.animate({right: cw == tw ? 0 : tw });
        else if (show == true) lm.animate({right:  0 });
        else lm.animate({right:  tw });
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
        //=========================
        //init menues
        this.showUndoRedo();
        this.rightMenu();
        this.showColorCombo();
        //=========================
        $('#hide_handles').click(function(){
            if (this_editor.edge_handles_visible === undefined){
                this_editor.edge_handles_visible = false;
            }
            this_editor.edge_handles_visible = !this_editor.edge_handles_visible;
            var all_drawables = this_editor.graph.drawables();
            for (var key in all_drawables) {
                drawable = all_drawables[key];
                if (drawable.identifier()=='Edge'){
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
        $('#layer_bottom').click(function(){
            for(var i=0;i<this_editor.selected_nodes.length;++i){
                this_editor.selected_nodes[i].toBack()
            }
        });
        //=========================
        $('#layer_top').click(function(){
            for(var i=0;i<this_editor.selected_nodes.length;++i){
                this_editor.selected_nodes[i].toFront()
            }
        });

        //=========================
        $('#clear').click(function(){
            this_editor.redrawGraph({nodes:[],edges:[]});
            //this_editor.graph.clear();//FIXME this does not work
            this_editor.undoPush('Cleared Graph');
        });
        //=========================
        $('#clone').click(function(){
            orig_html = $('#clone').html();
            $('#clone').html(this_editor.loading_img);
            var new_nodes;
            if(this_editor.selected_nodes.length === 0) new_nodes = bui.util.clone(this_editor.graph, 5);
            else new_nodes = bui.util.clone(this_editor.graph, 2, this_editor.selected_nodes);
            for (var i = new_nodes.length - 1; i >= 0; i--) {
                this_editor.bindDrawable(new_nodes[i]);
            }
            $('#clone').html(orig_html);
            if (new_nodes.length>0) this_editor.undoPush('Cloned nodes, got '+new_nodes.length+' new nodes');
            else $('.flash').html('Could not clone any nodes').fadeIn().delay(1500).fadeOut();
        });
        //=========================
        $('#combine').click(function(){
            if(this_editor.selected_nodes.length !== 0) {
		var new_node = bui.util.combine(this_editor.graph, this_editor.selected_nodes);
		this_editor.bindDrawable(new_node);
		this_editor.selectAll(false);
		this_editor.select(new_node);
	    }
	    else $('.flash').html('Must select nodes to combine').fadeIn().delay(1500).fadeOut();
            this_editor.undoPush('Combined Nodes');
        });
        //=========================
        $('#layout_grid').click(function(evnt){
            for(var key in this_editor.graph.drawables()){
                var drawable = this_editor.graph.drawables()[key];
                if(drawable.identifier() == 'Edge'){
                    drawable.spline('false');
                }
            }
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
                //TODO use this to make it look nice :D ... if too much time on hand
                //bui.Node.bindStatic(bui.Node.ListenerType.click, editor.drawableSelect());//FIXME this does not work, y?
            }
            this_editor.undoPush('Applied Grid Layout');
            //});
            //$('#layout_grid').html(orig_html);
        });
        //=========================
        $('#layout_force').click(function(){
            for(var key in this_editor.graph.drawables()){
                var drawable = this_editor.graph.drawables()[key];
                if(drawable.identifier() == 'Edge'){
                    drawable.spline('false');
                }
            }
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
                    bui.settings.straightenEdges = false;
                    bui.layouter.fromLayouterFormat(editor_config.graphData,data);
                    try{
                        this_editor.redrawGraph(editor_config.graphData);
                        this_editor.undoPush('Applied Biographer Flow Layout');
                    }catch(e){
                        jQuery('.flash').html('FAILED '+e).fadeIn();
                    }
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
        $('#node_label').keyup(function(){
            this_editor.editNode();
        });
        //=========================
        $('.unit_of_information, .state_variable').keyup(function(){
            this_editor.editNode();
        });
        $('#node_is_multimer, #node_is_clonemarker, #node_is_existence, #node_is_location').click(function(){
            this_editor.editNode();
        });
        //=========================
        $('#node_type').change(function(){
           this_editor.editNode(); 
        });
        //=========================
        $('#add_unit_of_information').click(function(){
            $('#uoi_group').append(' <br/><input type="text" placeholder="mt:prot" class="unit_of_information" /> ');
            $('.unit_of_information').unbind('keyup');
            $('.unit_of_information').keyup(function(){
                this_editor.editNode();
            });
        });
        //=========================
        $('#add_state_variable').click(function(){
            $('#sv_group').append(' <br/><input type="text" placeholder="P@207" class="state_variable" /> ');
            $('.state_variable').unbind('keyup');
            $('.state_variable').keyup(function(){
                this_editor.editNode();
            });
        });
        //=========================
        $('.select_combo').click(function(){
            this_editor.setColorCombo($(this).attr('id'));
        });
        //=========================
        $('.color_bg').ColorPicker({
            color: '#ffffff',
            onShow: function (colpkr) {
                $(colpkr).fadeIn(500);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(500);
                return false;
            },
            onChange: function (hsb, hex, rgb) {
                this_editor.color_bg = '#'+hex;
                $('.color_bg div').css('backgroundColor', '#' + hex);
                this_editor.editNode();
            }
        });
        $('.color_bd').ColorPicker({
            color: '#000000',
            onShow: function (colpkr) {
                $(colpkr).fadeIn(500);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(500);
                return false;
            },
            onChange: function (hsb, hex, rgb) {
                this_editor.color_bd = '#'+hex;
                $('.color_bd div').css('backgroundColor', '#' + hex);
                this_editor.editNode();
            }
        });
        $('.color_tx').ColorPicker({
            color: '#000000',
            onShow: function (colpkr) {
                $(colpkr).fadeIn(500);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(500);
                return false;
            },
            onChange: function (hsb, hex, rgb) {
                this_editor.color_tx = '#'+hex;
                $('.color_tx div').css('backgroundColor', '#' + hex);
                this_editor.editNode();
            }
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
        $(".biomodels_select span").click(function(){
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
                    if (data.is_jsbgn === true){
                        this_editor.redrawGraph(JSON.parse(data.graph));
                        this_editor.md5 = data.md5;
                        this_editor.undoPush('loaded layed out BioModel '+bmid);
                        //$('.flash').html('loaded BioModel '+bmid).fadeIn().delay(1600).fadeOut();
                    }else{
                        this_editor.md5 = data.md5;
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
                        this_editor.setLanguage();
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
            this_editor.graph.reduceTopLeftWhitespace(10);
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
                this_editor.selectAll(visible);
        });
        $('#canvas').dblclick(function(){
            var visible;
            var all_drawables = this_editor.graph.drawables();
            if(this_editor.selected_nodes.length != Object.keys(all_drawables).length) visible = true;
            else visible = false;
            this_editor.selectAll(visible);
        });
        //=========================
        $('.tools_click li').click(function(){
            var mode = $(this).attr('id');
            this_editor.setMode(mode);
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
        $('.marker_select').click(function(){
            $('.selected_marker').removeClass('selected_marker');
            $(this).addClass('selected_marker');
            this_editor.editEdge();
        });
        //=========================
        $('.node').click(function(event){
            event.stopPropagation();//because body gehts hooked up to click event
            this_editor.selectAll(false);
            this_editor.setMode('node');
            $('.active').removeClass('active');
            $(this).addClass('active');
            var nodetype = $(this).attr('id');
            $('.follow').hide();
            $('#follow_'+nodetype).show();
            $('.compartment, .complex').hover(
                function(){//hover in
                    this_editor.graph.drawables()[$(this).attr('id')].addClass('drop_here');
                },
                function(){//hover out
                    this_editor.graph.drawables()[$(this).attr('id')].removeClass('drop_here');
                }
            );
            $("#canvas").mousemove(function(e){
                $('#follow_'+nodetype).css('top', e.clientY+10).css('left', e.clientX+10);
            });
            $("#canvas").click(function(e){
                this_editor.createNode(nodetype, e);
            });
        });
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
        $('.language_selection div').click(function(){
            this_editor.graph.language($(this).html());
            this_editor.setLanguage();
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
        //-------------------------------------------------
        //-------------------------------------------------
        // keyboard shourtcuts
        //-------------------------------------------------
        //-------------------------------------------------
        $(document).keyup(function(event) {
            //shift | shift key is not pressed anymore
            if (event.keyCode == 16) {
                this_editor.shifted = false;
            }
            // ctrl | ctrl key is not pressed anymore
            if (event.keyCode == 17) {
                $('.keyboard').attr('style','');
                clearTimeout(this.ctrl_delayed);
            }
        });
        $(document).keydown(function(event){
            //==================================
            //del  | delete selected nodes
            //==================================
            if (event.keyCode == 46) { // us: del; german: entf
                this_editor.deleteSelectedNodes();
            }
            var Opera = /opera/i.test(navigator.userAgent);
            if (Opera) {
                // Opera specific
                //==================================
                //ctrl + m | toggle side menu
                //==================================
                if ((event.ctrlKey || event.metaKey)&&(event.keyCode == 77)) {
                    this_editor.rightMenue_show();
                }
            }else{
                //==================================
                //f4 | toggle side menu
                //==================================
                if (event.keyCode == 115){
                    this_editor.rightMenue_show();
                }
            }
            //==================================
            if (event.ctrlKey || event.metaKey) {
                //==================================
                //ctrl + a  | select all
                if (event.keyCode == 65){
                    this_editor.selectAll(true);
                    event.preventDefault();
                }
                //==================================
                //ctrl + z | undo
                if (event.keyCode == 90){this_editor.undo(); }
                //==================================
                //ctrl + shift + z OR ctrl + y | redo
                if ((event.keyCode == 90 && event.shiftKey)||event.keyCode == 89 ){this_editor.redo(); }
                //==================================
                //crtl + i | import
                if (event.keyCode == 73 ||  event.keyCode == 79){this_editor.modal = $("#import_file_modal_input").modal({overlayClose:true, opacity:20 }); }
                //ctrl + e | export
                if (event.keyCode == 69){this_editor.modal = $("#export_file_modal_input").modal({overlayClose:true, opacity:20 }); }
                //==================================
                //ctrl + 1 | cursor tool
                if (event.keyCode == 49){this_editor.setMode('cursor'); }
                //ctrl + 2 | cursor tool
                if (event.keyCode == 50){this_editor.setMode('move'); }
                //ctrl + 3 | cursor tool
                if (event.keyCode == 51){this_editor.setMode('Edge'); }
                return false;
            }
            // shift | detect if shift key is pressed
            if (event.keyCode == 16) {
                this_editor.shifted = true;
                //interact.simulate('drag', $('#canvas')[0], event);
            }
            // ctrl | ctrl pressed down for a longer time, show keyboard shortcuts
            // TODO this only works in chrom(ium) so far, but is not so important
            if (event.keyCode == 17) {
                clearTimeout(this.ctrl_delayed);
                this.ctrl_delayed = setTimeout(function() {
                    if(10>Math.floor(Math.random()*100)){
                        $('.keyboard').each(function() {
                            $(this).show().delay(Math.floor(Math.random()*1600)).fadeOut('slow');
                        });
                    }else{
                        $('.keyboard').show();
                    }
                }, 400);
                
            }

        });
        //-------------------------------------------------
        //-------------------------------------------------
        
        //-------------------------------------------------
        //catch mouse scroll from whole body for zoom to work outside of the canvas
        document.body.onmousewheel = function (event) {
            this_editor.graph.fire(bui.Graph.ListenerType.wheel, [this_editor.graph, event]);
        };
        //-------------------------------------------------
        // delete selected nodes on click
        $('#del').click(function(){this_editor.deleteSelectedNodes();});
        //-------------------------------------------------
        //slide toggle right menu
        $('.rm_peek').click(function(){this_editor.rightMenue_show(); });
        
    }
};


