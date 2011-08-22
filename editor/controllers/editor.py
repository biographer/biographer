def index():
    response.files.append(URL(request.application, 'static/css', 'visualization-html.css'))
    response.files.append(URL(request.application, 'static/css', 'editor.css'))
    response.files.append(URL(request.application, 'static/css', 'jquery-ui-1.8.13.css'))
    response.files.append(URL(request.application, 'static/js', 'jquery.simulate.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    #response.files.append(URL(request.application, 'static/js', 'biographer-ui.js'))
    response.files.append(URL(request.application, 'editor', 'script.js'))
    if request.vars.json_file != None and request.vars.json_file != '':
        session.editor_autosave = request.vars.json_file.file.read()
    return dict()

def script():
    return dict()

def autosave():
    session.editor_autosave = request.vars.json

def export():
    import gluon.contenttype
    print 'export: ', request.vars
    if request.vars.json:
        file_type = 'json'
        out = request.vars.json
    if request.vars.svg:
        file_type = 'svg'
        out = request.vars.svg
    response.headers['Content-Type'] = gluon.contenttype.contenttype(".%s"%file_type)
    filename = "%s.%s" % ('graph', file_type)
    response.headers['Content-disposition'] = "attachment; filename=\"%s\"" % filename
    return out
    response.write(out,escape=False)
