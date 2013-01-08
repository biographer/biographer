def index():
    '''
    check if there is a user in the db
    if yes edit the user if admin
    if not create the user and create a admin group and add the user to the admin group
    '''
    #check if there are users
    first_user = db(db.auth_user.id == 1).select().first()
    #------------------------------------
    #created all the groups that are needed
    if not auth.id_group('admin'):
        auth.add_group('admin', 'Administrator,manager of this app. You can add more than one memeber to this group')
    #------------------------------------
    #if first user is not admin, make him admin
    if first_user and not auth.has_membership(user_id = first_user, role = 'admin'):
        auth.add_membership('admin', first_user)
    #------------------------------------
    #if there is a first user but the current user is not logged in as admin
    if first_user and not auth.has_membership('admin'):
        return 'first user exists, you need to login as admin to configure the first user'
    #------------------------------------
    #if there is no first user, return a form to create him
    if not first_user:
        def on_accept(form):
            auth.add_membership('admin', form.vars.id)
            auth.login_bare(form.vars.email, request.vars.password)
            redirect(URL(request.application, 'default', 'index'))
        form = crud.create(db.auth_user, onaccept = on_accept)
    else:
        #if the current user is admin
        if auth.has_membership(role = 'admin'):
            def on_accept():
                response.flash = 'saved user'
            form = crud.update(db.auth_user, first_user, onaccept = on_accept)
        else:
            #get admin users
            admin_users = ['%(first_name)s %(last_name)s'%u for u in db(db.auth_user.id>0).select() if auth.has_membership(role = 'admin', user_id = u)]
            return TAG['']('A admin user exists, please login as admin to complete the setup', BR(), 'Admin users are: ',UL([LI(aun) for aun in admin_users]))
    return dict(form = form)

def setup_smtp():
    '''
    get the mail config from the config file and create a from to edit it
    '''
    if not auth.has_membership(role = 'admin'):
        return 'You need to login as admin to configure the SMTP server.'
    form = form_factory(
            Field('server', default = app_config.get('smtp','server')),
            Field('login', default = app_config.get('smtp', 'login'), widget=SQLFORM.widgets.password.widget, label="Login (user:pass)"),
            Field('sender', default = app_config.get('smtp', 'sender')),
            )
    if form.accepts(request.vars, keepvalues = True):
        app_config.set('smtp','server', form.vars.server)
        app_config.set('smtp', 'login', form.vars.login)
        app_config.set('smtp', 'sender', form.vars.sender)
        response.flash = 'smtp config saved'
    return form
def setup_java():
    if not auth.has_membership(role = 'admin'):
        return 'You need to login as admin to configure the JAVA path'
    form = form_factory(
            Field('java_path', default = app_config.get('java','path')),
            )
    if form.accepts(request.vars, keepvalues = True):
        app_config.set('java','path', form.vars.java_path)
        response.flash = 'JAVA path saved'
    return form
    
def setup_hg():
    if not auth.has_membership(role = 'admin'):
        return 'You need to login as admin to configure the Mercurial path'
    form = form_factory(
            Field('hg_path', default = app_config.get('hg','path')),
            )
    if form.accepts(request.vars, keepvalues = True):
        app_config.set('hg','path', form.vars.hg_path)
        response.flash = 'Mercurial path saved'
    return form
