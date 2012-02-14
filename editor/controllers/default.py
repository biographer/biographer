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
    response.files.append(URL(request.application, 'static/css', 'jquery-ui-1.8.13.css'))
    response.files.append(URL(request.application, 'static/js', 'jquery.simulate.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery.simplemodal.1.4.1.min.js'))
    response.files.append(URL(request.application, 'static/js', 'd3.js'))
    response.files.append(URL(request.application, 'static/js', 'd3.layout.js'))
    response.files.append(URL(request.application, 'static/js', 'd3.geom.js'))
    #response.files.append(URL(request.application, 'static/js', 'biographer-ui.js'))#import in view
    #response.files.append(URL('script.js'))#import in view
    #print request.vars
    if (request.vars.import_file != None and request.vars.import_file != '') or request.vars.jgraph or request.vars.jsbgn:
        action,graph,json_string = None,None,None
        if request.vars.jgraph or request.vars.jsbgn:
            result = import_file(request.vars.jgraph or request.vars.jsbgn)
        else:
            result = import_file(request.vars.import_file.file.read().strip(), request.vars.import_file.filename)
        if result:
            action, graph, json_string = result
            if action and graph and json_string:
                undoRegister(action, graph, json_string)
        else:
            response.flash = 'failed importing %s'%request.vars.import_file.filename
    #----------------------------------
    elif request.vars.biomodel_id:
        biomodel_id = None
        import re
        if re.match('^(BIOMD|MODEL)\d{10}$', request.vars.biomodel_id):
            biomodel_id = request.vars.biomodel_id
        else:
            try:
                int_id = request.vars.biomodel_id
                biomodel_id = 'BIOMD%.10d'%int_id
            except TypeError:
                response.error = 'Invalid BioModel Id. The id should be a number or follow the pattern ^(BIOMD|MODEL)\d{10}$'
        #----------------------------------
        if biomodel_id:
            model_content = None
            model_path = os.path.join(request.folder, 'static', 'data_models')
            if not os.path.exists(model_path):
                os.mkdir(model_path)
            if biomodel_id+'.xml' in os.listdir(model_path) and not request.vars.force:
                model_content = open(os.path.join(model_path, biomodel_id+'.xml'), 'r').read()
                response.flash = 'Loaded %s from cache.'%biomodel_id
            else:
                try:
                    model_content = _download('http://www.ebi.ac.uk/biomodels-main/download?mid=%s'%biomodel_id)
                    if model_content:
                        open(os.path.join(model_path, biomodel_id+'.xml'), 'w').write(model_content)
                except ContentTooShortError:
                    response.flash = 'Failed downloading %s: Content Too Short'%biomodel_id
            #----------------------------------
            if model_content:
                action, graph, json_string  = import_file(model_content, biomodel_id)
                if action and graph and json_string:
                    undoRegister(action, graph, json_string)


    return dict()

def debug():
    if session.debug == None:
        session.debug = True;
    else:
        session.debug = not session.debug
    redirect(URL('index'))
def reset():
    session.editor_autosave = None
    session.editor_histroy_undo = None
    session.editor_histroy_redo = None
    redirect(URL('index'))

def script():
    return dict()

def import_graph():
    response.generic_patterns = ['json']
    action,graph,json_string = None,None,None
    if request.vars.type == 'reactome_id':
        import_Reactome( request.vars.identifier )
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
    import os
    import subprocess
    #-------------------
    if request.vars.layout == "biographer":
        infile = os.path.join(request.folder, "static","tmp.bgin")
        outfile = os.path.join(request.folder, "static","tmp.bgout")
        print request.vars.data
        open(infile, 'w').write(request.vars.data)
        executable = os.path.join(request.folder, "static","layout")
        p = subprocess.Popen([executable,infile,outfile],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        p.communicate()
        layout_output = open(outfile, 'r').readlines()
        return layout_output

    elif request.vars.layout == 'graphviz':
        import biographer
        reload(biographer)#TODO remove in production mode
        bioGraph = biographer.Graph()
        bioGraph.importJSON( session.editor_autosave )
        bioGraph.exportGraphviz( folder=os.path.join(request.folder, "static/graphviz"), useCache=True, updateNodeProperties=True )
        #-------------------
        json_string = bioGraph.exportJSON()
        graph = simplejson.loads(json_string)
    action = 'applied automatic biographer layout'
    return undoRegister(action, graph, json_string)
    #-------------------


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
    def fix_svg(svg_data):
        import re
        import os
        stylesheet_contents = open(os.path.join(request.folder, 'static' , 'css', 'visualization-svg.css'), 'r').read()
        out = re.sub('@import url[^<]*', stylesheet_contents, svg_data)
        return '<?xml version="1.0" encoding="UTF-8"?>\n%s'%out
    if request.vars.json:
        file_type = 'json'
        out = request.vars.json
    elif request.vars.svg:
        file_type = 'svg'
        out = fix_svg(request.vars.svg)
    elif request.vars.format in 'png jpg pdf tiff'.split():
        file_type = request.vars.format
        java = "/usr/bin/java"  # FIXME java executable, this should be configurable shomewhere
        import os
        from subprocess import Popen, PIPE
        from shlex import split
        jar = os.path.join( request.folder, "static","Exporter","svg-export-0.2.jar" )
        applet = java+" -jar "+jar+" -si -so -f "+request.vars.format
        result = Popen(split(applet), stdin=PIPE, stdout=PIPE).communicate(fix_svg(request.vars.svg_data))      # call Ben's Java Exporter Applet
        out = result[0] # stdout
        print "image export errors: ",result[1]	# stderr

    if not file_type:
        return ''
    response.headers['Content-Type'] = gluon.contenttype.contenttype(".%s"%file_type)
    filename = "%s.%s" % ('graph', file_type)
    response.headers['Content-disposition'] = "attachment filename=\"%s\"" % filename
    return out
    response.write(out,escape=False)

def render():
    in_url = request.args(0) or request.vars.q
    try:
        #import urllib2
        file_content = _download(in_url)
    except urllib2.HTTPError, e:
        return 'error getting %s: %s'%(in_url,e)
    action, graph, json_string = import_file(file_content,'')
    if action and graph and json_string:
        undoRegister(action, graph, json_string)
    response.files.append(URL(request.application, 'static/css', 'visualization-html.css'))
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    return dict()

def sbgnml_test():
    import os
    test_path = os.path.join(request.folder, 'static', 'test-files')
    items = []
    #for dn in ['PD']:
    for dn in ['PD', 'ER', 'AF']:
        subitems = []
        items.append(H1(dn))
        for fn in os.listdir(os.path.join(test_path, dn)):
            if fn.endswith('.sbgn'):
                if fn == 'mapk_cascade.sbgn':#FIXME
                    print sbgnml2jsbgn(open(os.path.join(test_path,dn,fn),'r').read())
                    continue
                subitems.append(
                        TR( TH( A(fn, _href=URL('render', vars = dict(q='http://%s%s'%(request.env.http_host,URL(request.application, 'static/test-files/%s'%dn,fn)))), _target="_blank"), _colspan=2)),
                    )
                subitems.append(
                    TR(
                        TD(IMG(_src=URL(request.application, 'static/test-files/'+dn, fn[:-5]+'.png'), _alt='sbgn image', _style='max-width: 300px')),
                        TD(IFRAME(_src=URL('render', vars = dict(q='http://%s%s'%(request.env.http_host,URL(request.application, 'static/test-files/%s'%dn,fn)))), _width="500px", _height="200px", _scrolling="no", _frameBorder="0")),
                        ),
                    )
                subitems.append(
                    TR(TH(HR(),_colspan=2)),
                    )
        items.append(TABLE(subitems))
        items.append(HR())
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    return dict(table = TAG[''](items))

def sbtml_test():
    import os
    test_path = os.path.join(request.folder, 'static', 'sbml-test')
    items = []
    for fn in os.listdir(os.path.join(test_path, dn)):
        if fn.startswith('BIOMD') and fn.endswith('.xml'):
            subitems.append(
                    TR( TH( A(fn, _href=URL('render', vars = dict(q='http://%s%s'%(request.env.http_host,URL(request.application, 'static/test-files/%s'%dn,fn)))), _target="_blank"), _colspan=2)),
                )
            subitems.append(
                TR(
                    TD(IMG(_src=URL(request.application, 'static/test-files/'+dn, fn[:-5]+'.png'), _alt='sbgn image', _style='max-width: 300px')),
                    TD(IFRAME(_src=URL('render', vars = dict(q='http://%s%s'%(request.env.http_host,URL(request.application, 'static/test-files/%s'%dn,fn)))), _width="500px", _height="200px", _scrolling="no", _frameBorder="0")),
                    ),
                )
            subitems.append(
                TR(TH(HR(),_colspan=2)),
                )
    items.append(TABLE(subitems))
    items.append(HR())
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    return dict(table = TAG[''](items))

def user():
    """
    exposes:
    http://..../[app]/default/user/login 
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    """
    return dict(form=auth())

