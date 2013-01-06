editor_config = {
    url_undo_push : '{{=URL("undo_push")}}',
    url_undo : '{{=URL('undo.json')}}',
    url_redo : '{{=URL('redo.json')}}',
    url_layout : '{{=URL('layout')}}',
    url_import : '{{=URL('import_graph.json')}}',
    loading_img : '{{=TAG[''](IMG(_alt="processing layout",_src=URL(request.application, "static/images", "loading.gif")),BR(),"...")}}',
    images_base_path : '/{{=request.application}}/static/images/editor/',
    bui_visualization_css_file : '{{=URL(request.application, "static/biographer-editor/css", "visualization-svg.css")}}'
}