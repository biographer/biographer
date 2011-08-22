//-------------------------------------------
function save() {
    $.ajax({
	    url: '{{=URL("autosave")}}',
	    data : {json: JSON.stringify(graph.toJSON())},
	    success: function( data ) {
		    $('.flash').html('Saved current graph.').fadeIn().delay(800).fadeOut();
            return true;
	    }
	   });
}
var t;
var timer_is_on=0;
var intervall = 30000;//every 2 seconds
var last_export = '';
function autosaveHeartBeat(no_save) {
    if (no_save != true){
	    //autosave json graph if graph was modified
	    var jsong = JSON.stringify(graph.toJSON());
	    if (jsong != last_export){
		    save();
		    last_export = jsong;

	    }
    }
    t=setTimeout("autosaveHeartBeat()",intervall);
}
function doHeartBeat() {
    if (!timer_is_on) {
      timer_is_on=1;
      autosaveHeartBeat(true);
      }
}
//-------------------------------------------
var selected_nodes = [];
var select_mode = false;
function nodeSelect(drawable, select_status) {
    if (select_mode == 'edge'){
	    $('#edge_message').html('please select a second node');
	    selected_nodes.push(drawable);
	    if (selected_nodes.length>=2){
		$('#edge_message').html('');
		//draw edge now
		new_edge = graph.add(bui[$('#select_edge_spline').val()])
			    .source(selected_nodes[0])
			    .target(selected_nodes[1])
			    .visible(true);
	        if($('#select_edge_spline').val()=='Spline') new_edge.setSplineHandlePositions([
			{x:selected_nodes[0].position().x-30,y:selected_nodes[0].position().y-60},
			{x:selected_nodes[1].position().x-30,y:selected_nodes[1].position().y-60}
			], 300);
		if($('#edge_marker').val() !='none'){
			new_edge.marker(bui.connectingArcs[$('#edge_marker').val()].id);
		}
		selected_nodes = []
		select_mode = false;
	    }
    } else if (select_mode == 'edit'){
	if ( $('#edit_label').val() != '' ) drawable.label($('#edit_label').val());
	if ( $('#unit_of_information').val() != '' ) {
            graph.add(bui.UnitOfInformation)
                .position(-10, -10)
                .parent(drawable)
                .label($('#unit_of_information').val())
                .visible(true);
	}
	if($('input[name="node_color"]:checked').val() != 'none'){
		drawable.removeClass();
		drawable.addClass($('input[name="node_color"]:checked').val());
	}
	$('#edit_message').html('');
	select_mode = false;
	if( $('#autoclear').is(':checked')) $('#edit_label').val('');
    } else if (select_mode == 'del'){
	$('#edit_message').html('');
	drawable.remove();
	select_mode = false;
    }
}
var canvaspos = null;
var graph = null;
function drop_fkt(event, ui, element){
		if(ui.helper.hasClass('symbol_box')){
            //calculate position of new node
			var pos_top = ui.offset.top-canvaspos.top;
			var pos_left = ui.offset.left-canvaspos.left;
            //set size of new node
			var size = {};
			if(ui.helper.attr('id')=='Process'){
				size = {h:20, w:20};
			}else if((ui.helper.attr('id')=='Compartment')||(ui.helper.attr('id')=='Complex')){
				size = {h:100, w:100};
			}else {
				size = {h:50, w:50};
			}
            //create new node
			new_node = graph.add(bui[ui.helper.attr('id')])
				.position(pos_left, pos_top)
				.size(size.h, size.w)
				.visible(true)
            //add parent if the drop is within a container like complex or compartment
            if ($(element).attr('id').indexOf('placeholder') == 0){
                var drawable_parent = graph.drawables()[$(element).attr('id').substring(12)]
                new_node.parent(drawable_parent)
                //alert('parent_id '+parent_id);
                if (drawable_parent.identifier() == 'Complex'){
                    drawable_parent.tableLayout();
                } else {
                    pos_top = pos_top-drawable_parent.position().y
                    pos_left = pos_left-drawable_parent.position().x
                    new_node.position(pos_left, pos_top)
                }
            }
            //do not add lable to complex but anything else
			if(ui.helper.attr('id')!='Complex'){
				new_node.label(ui.helper.parent().parent().find('.label').val());
			}
            //autoclear text boxes
			if( ui.helper.parent().parent().find('.autoclear').is(':checked')) ui.helper.parent().parent().find('.label').val('');
            //set click listener on new node
			new_node.bind(bui.Node.ListenerType.click, nodeSelect, 'node_select');
            //set droppable listener on new node
            $('#placeholder_'+new_node.id()).droppable({ 
                hoverClass: 'drop_hover',
                over : function(){$('#canvas').droppable("disable");},
                out : function(){$('#canvas').droppable("enable");},
                drop: function(event, ui){drop_fkt(event, ui, this);},
            });
			//make all drawables placeholders invisible
			var all_drawables = graph.drawables();
			for (var key in all_drawables) {
			    drawable = all_drawables[key]
			    if (drawable.drawableType()=='node'){
				drawable.placeholderVisible(false);
			    }
			}
            $('.droppable').droppable("enable");
		}
}
$(document).ready(function() {
    //=========================
    $("#json_file").change(function(){
        $('#import_form').submit();
    });
    //=========================
    $('#load_json_string').click(function(){
        all_drawables = graph.drawables(); 
        for (var key in all_drawables) {
            all_drawables[key].remove();
        }
        delete graph;
        graph = new bui.Graph($('#canvas')[0]);
        //alert($('#json_string').val());
        bui.importFromJSON(graph, JSON.parse($('#json_string').val()));
    });
    //=========================
    $('#edit_all_nodes, #edit_no_nodes').click(function(){
            var visible = $(this).attr('id')=='edit_all_nodes';
			var all_drawables = graph.drawables();
			for (var key in all_drawables) {
			    drawable = all_drawables[key]
			    if (drawable.drawableType()=='node'){
                    drawable.placeholderVisible(visible);
			    }
			}
    });
    //=========================
    $('#save').click(function(){
			var all_drawables = graph.drawables();
			for (var key in all_drawables) {
			    drawable = all_drawables[key]
			    if (drawable.drawableType()=='node'){
				drawable.placeholderVisible(false);
			    }
			}
    });
    //=========================
    $('#save').click(function(){
	    save();
    });
    //=========================
    $('#edit_node').click(function(){
	$('#edit_message').html('click on a node to edit its properties');
	select_mode = 'edit';
    });
    //=========================
    $('#del_node').click(function(){
	$('#edit_message').html('click on a node to remove it');
	select_mode = 'del';
    });
    //=========================
    $('#del_edge').click(function(){
	$('#edit_message').html('click on a edge/spline to remove it');
	select_mode = 'del';
    });
    //=========================
    $('#draw_edge_spline').click(function(){
	$('#edge_message').html('click on two nodes to draw an edge between them');
	select_mode = 'edge';
    });
    //=========================
    $('#export_json').click(function(){
        alert(JSON.stringify(graph.toJSON()));
    	//$('#export_form').html('<input type="hidden" name="json" value=\''+JSON.stringify(graph.toJSON())+'\' />').submit();
    });
    //=========================
    $('#export_svg').click(function(){
    	$('#export_form').html('<input type="hidden" name="svg" value=\''+$('#canvas>div').html()+'\' />').submit();
    });
    canvaspos = $('#canvas').position();
	$('.editor_draggable').draggable({
		zIndex: 2,
		revert: true, 
		    start: function() {
			//make all drawables placeholders visible
			var all_drawables = graph.drawables();
			for (var key in all_drawables) {
			    drawable = all_drawables[key]
			    if (((drawable.identifier()=='Complex')&& !$(this).hasClass('no_drop_complex'))||(drawable.identifier()=='Compartment')){
				drawable.placeholderVisible(true);
			    }/*else {
				drawable.placeholderVisible(false);
                }*/
			}
		    }, 
	    });
});
