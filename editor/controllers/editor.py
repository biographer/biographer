
def index():
    response.files.append(URL(request.application, 'static/css', 'visualization-html.css'))
    response.files.append(URL(request.application, 'static/css', 'editor.css'))
    #response.files.append(URL(request.application, 'static/js', 'jquery-1.6.min.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery.simulate.js'))
    response.files.append(URL(request.application, 'static/js', 'jquery-ui-1.8.15.custom.min.js'))
    response.files.append(URL(request.application, 'static/js', 'biographer-ui.js'))
    return dict()
