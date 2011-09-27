from gluon.contrib import simplejson

def undoRegister(action, graph, json_string):
    if session.editor_histroy_undo == None:
        session.editor_histroy_undo = []
    item = dict(action = action, graph = graph)
    session.editor_histroy_redo = []
    session.editor_histroy_undo.append( item )
    session.editor_autosave = json_string
    return item

def index():
    response.files.append(URL(request.application, 'static/css', 'visualization-html.css'))
    response.files.append(URL(request.application, 'static/css', 'editor.css'))
    response.files.append(URL(request.application, 'static/css', 'jquery-ui-1.8.13.css'))
    response.files.append(URL(request.application, 'static/js', 'jquery.simulate.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery.simplemodal.1.4.1.min.js'))
    #response.files.append(URL(request.application, 'static/js', 'biographer-ui.js'))
    response.files.append(URL(request.application, 'editor', 'script.js'))
    if request.vars.import_file != None and request.vars.import_file != '':
        action,graph,json_string = None,None,None
        file_content = request.vars.import_file.file.read().strip()
        if file_content.startswith('{') and file_content.endswith('}'):#basic check
            json_string = file_content
            try:
                graph = simplejson.loads(file_content)
            except simplejson.JSONDecodeError:
                action = 'loaded %s but could not parse json'%request.vars.import_file.filename
                graph = dict(nodes = [], edges = [])
            else:
                action = 'loaded %s'%request.vars.import_file.filename
        elif file_content.startswith('<?xml'):
            import biographer
            bioGraph = biographer.Graph()
            bioGraph.importSBML( file_content )
            json_string = bioGraph.exportJSON()
            #print 'sbml2json: ',json_string
            graph = simplejson.loads(json_string)
            action = 'loaded %s'%request.vars.import_file.filename
        if action and graph and json_string:
            undoRegister(action, graph, json_string)
    return dict()

def script():
    return dict()

def import_graph():
    response.generic_patterns = ['json']
    action,graph,json_string = None,None,None
    if request.vars.type=='biomodel':
        importBioModel( request.vars.identifier )
        json_string = session.bioGraph.exportJSON()
        graph = simplejson.loads(json_string)
        action = 'Imported BioModel: %s'%request.vars.identifier
    elif request.vars.type == 'reactome_id':
        importReactome( request.vars.identifier )
        json_string = session.bioGraph.exportJSON()
        graph = simplejson.loads(json_string)
        action = 'Imported Reactome Id: %s'%request.vars.identifier
        print 'reactome_id xxx ',action, json_string

    if action and graph and json_string:
        return undoRegister(action, graph, json_string)
    raise HTTP(500, 'could not import')


def layout():
    response.generic_patterns = ['html','json']
    if not request.vars.layout:
        raise HTTP(500, 'not layout algorithm specified')
    #-------------------
    import biographer
    import os
    import subprocess
    reload(biographer)#TODO remove in production mode
    bioGraph = biographer.Graph()
    bioGraph.importJSON( session.editor_autosave )
    #-------------------
    if request.vars.layout == "biographer":
        executable = os.path.join(request.folder, "static","layout")
        infile = os.path.join(request.folder, "static","tmp.bgin")
        outfile = os.path.join(request.folder, "static","tmp.bgout")
        open(infile, 'w').write(bioGraph.exportLayout())
        #return bioGraph.exportLayout()
        executable = os.path.join(request.folder, "static","layout")
        p = subprocess.Popen([executable,infile,outfile],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        p.communicate()
        layout_output = open(outfile, 'r').readlines()
        graph = simplejson.loads(bioGraph.exportJSON())
        importLayout(graph, layout_output)
        json_string = simplejson.dumps(graph)
        #return PRE(XML(simplejson.dumps(graph)))
        #print 'exit'
        #bioGraph.importLayout( open(outfile, 'r').read() )					# import STDOUT

    elif request.vars.layout == 'graphviz':
        pass
        bioGraph.exportGraphviz( folder=os.path.join(request.folder, "static/graphviz"), useCache=True, updateNodeProperties=True )
        #-------------------
        json_string = bioGraph.exportJSON()
        graph = simplejson.loads(json_string)
    action = 'applied automatic biographer layout'
    return undoRegister(action, graph, json_string)
    #-------------------

def clear():
    session.editor_autosave = None
    session.editor_histroy_undo = None
    session.editor_histroy_redo = None

def autosave():
    session.editor_autosave = request.vars.json

def undo_push():
    session.editor_autosave = request.vars.graph
    #create history
    if session.editor_histroy_undo == None:
        session.editor_histroy_undo = []
    session.editor_histroy_redo = []
    #pop if history is "full"
    if len(session.editor_histroy_undo)>=100:
        session.editor_histroy_undo.pop(0)
    #add current result to history
    session.editor_histroy_undo.append( dict(action = request.vars.action, graph = simplejson.loads(request.vars.graph)) )

def undo():
    response.generic_patterns = ['json']
    if session.editor_histroy_undo:
        item = session.editor_histroy_undo.pop()
        session.editor_histroy_redo.append(item)
    if not session.editor_histroy_undo:
        last_graph = dict(nodes = [], edges = [])
    else:
        last_graph = session.editor_histroy_undo[-1]['graph']
    session.editor_autosave = simplejson.dumps(last_graph)
    return last_graph

def redo():
    response.generic_patterns = ['json']
    item = session.editor_histroy_redo.pop()
    session.editor_histroy_undo.append(item)
    session.editor_autosave = simplejson.dumps(item['graph'])
    return item

def export():
    import gluon.contenttype
    file_type = False
    if request.vars.json:
        file_type = 'json'
        out = request.vars.json
    if request.vars.svg:
        import re
        import os
        file_type = 'svg'
        stylesheet_contents = open(os.path.join(request.folder, 'static' , 'css', 'visualization-svg.css'), 'r').read()
        out = re.sub('@import url[^<]*', stylesheet_contents, request.vars.svg)
        out = '<?xml version="1.0" encoding="UTF-8"?>\n%s'%out
    if not file_type:
        return ''
    response.headers['Content-Type'] = gluon.contenttype.contenttype(".%s"%file_type)
    filename = "%s.%s" % ('graph', file_type)
    response.headers['Content-disposition'] = "attachment filename=\"%s\"" % filename
    return out
    response.write(out,escape=False)
