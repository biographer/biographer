'''
Issue tracker
this is a multi purpuse issue tracker (features, help requests, bugs...)
configure routes.py to allow the creation of issues and displaying of errors

LGPL
Falko Krause
'''
db_comment_vote = db.plugin_issue_comment_vote
db_comment_attachment = db.plugin_issue_comment_attachment
db_comment = db.plugin_issue_comment
db_issue = db.plugin_issue
db_vote = db.plugin_issue_vote
db_type = db.plugin_issue_type
db_error = db.plugin_issue_error

def index():
    '''this is the gate page if the issue tracker is called from local and needs a layout'''
    response.files.append( URL(request.application, 'static/plugin_issue', 'issue.css'))
    response.files.append( URL(request.application, 'static/plugin_issue/markitup', 'jquery.markitup.pack.js') )
    response.files.append( URL(request.application, 'static/plugin_issue/markitup/sets/markmin', 'set.js') )
    response.files.append( URL(request.application, 'static/plugin_issue/markitup/skins/simple', 'style.css') )
    response.files.append( URL(request.application, 'static/plugin_issue/markitup/sets/markmin', 'style.css') )
    return dict()

@auth.requires_membership('admin')
def setup_routes():
    '''configure routes.py to redirect errors to the error_ticket function of this controller'''
    routespy_path = os.path.join(request.env.web2py_path, 'routes.py')
    #if routes.py are not availabel create it
    if not os.path.exists(routespy_path):
        shutil.copy(os.path.join(request.env.web2py_path, 'routes.example.py'), routespy_path)
    #find all routes
    routes_raw = open(routespy_path, 'r').read()
    err_routes_pattern = re.compile('#?\s*routes_onerror *= *\[([^\]]+)\]')
    match = re.search(err_routes_pattern, routes_raw)
    error_routes = match.group(1)
    error_routes = "\n#".join(error_routes.split('#'))#split comments to new lines
    error_routes_comments = "\n".join([r for r in error_routes.split("\n") if re.search('^\s*#',r)])#get comments
    error_routes = "\n".join([r for r in error_routes.split("\n") if not re.search('^\s*#',r)])#drop all comments
    error_routes = re.sub("\n\s*", "", error_routes)
    #see if the route we need is there
    if re.search('%s/\d{3}'%request.application, error_routes):
        pass #route is already there
    else:#not there add it, drop all comments
        this_err_route = "\n('%(app)s/500', '%(app)s/plugin_issue/error_ticket')\n"%dict(app=request.application)
        error_routes = re.sub(',\s*$', '', error_routes)
        routes_raw = re.sub( err_routes_pattern, "routes_onerror = [%s%s\n%s\n]"%( this_err_route, ",%s"%error_routes if error_routes else '', error_routes_comments), routes_raw)
    if request.vars.write:
        open(routespy_path, 'w').write(routes_raw)
        return '%s was replaced. You need to restart web2py'%routespy_path
    return PRE(routes_raw)

def main():
    '''main content page'''
    return dict()

def issues():
    '''show a list of existing issues'''
    #---------------------------------------------------
    if not session.plugin_issue_filter:
        session.plugin_issue_filter = dict()
        for attr in 'type accepted sort'.split():
            session.plugin_issue_filter[attr] = None
        session.plugin_issue_filter['status'] = 'open'
    for attr in 'type status accepted sort'.split():
        if request.vars:
            session.plugin_issue_filter[attr] = request.vars.get(attr)
        else:
            request.vars.type = session.plugin_issue_filter['type']
            request.vars.status = session.plugin_issue_filter['status']
            request.vars.accepted = session.plugin_issue_filter['accepted']
            request.vars.sort = session.plugin_issue_filter['sort']

    #---------------------------------------------------
    issue_types = [r.type for r in db(db_type.id>0).select()]
    filter_form = form_factory(
            Field('type', requires=IS_IN_SET(issue_types, zero=None, multiple = True), default = session.plugin_issue_filter['type']),
            Field('status', requires=IS_IN_SET('open closed'.split(), zero = None, multiple = True), default = session.plugin_issue_filter['status']),
            Field('accepted', requires=IS_IN_SET('accepted pending'.split(), zero = None, multiple = True), default = session.plugin_issue_filter['accepted']),
            Field('sort', requires=IS_IN_SET('ID score replies views'.split(), zero = None), default = session.plugin_issue_filter['sort']),
            formstyle = 'divs',
            _id='filter_issues_form',
            submit_button = 'filter'
            )
    if filter_form.accepts(request.vars, session, keepvalues = True):
        pass
    #---------------------------------------------------
    issues = []
    queries=[db_issue.id>0]
    #---------------------------------------------------
    ###
    if not request.vars.status or request.vars.status == 'open':
        queries.append(db_issue.open == True)
    elif request.vars.status == "closed":
        queries.append(db_issue.open == False)
    ###
    if request.vars.type:
        subquery = []
        for t in request.vars.getlist('type'):
            subquery.append(db_issue.type.contains(t))
        if len(subquery)>1: subquery = reduce(lambda a,b:(a|b),subquery)
        else: subquery = subquery[0]
        queries.append(subquery)
    ###
    if request.vars.accepted == 'accepted':
        queries.append(db_issue.accept == True)
    elif request.vars.accepted == 'pending':
        queries.append(db_issue.accept == False)
    ###
    query = reduce(lambda a,b:(a&b),queries)
    issue_list = db(query).select()
    #---------------------------------------------------
    if not issue_list:
        return TAG[''](
                filter_form,
                SPAN('no issues exist, change your filter settings or create a new issue :P', _class="error"),
                )
    #---------------------------------------------------
    decorated_issues = [dict(score = get_score(issue.id), replies = db(db_comment.issue == issue.id).count()-1, ID = issue.id, views = issue.views, issue = issue) for issue in issue_list]
    if request.vars.sort:
        decorated_issues = sorted(decorated_issues, key=lambda dissue: dissue[request.vars.sort], reverse = True)
    #---------------------------------------------------
    for decorated_issue in decorated_issues:
        n_comments = decorated_issue['replies']
        n_votes = decorated_issue['score']
        issue = decorated_issue['issue']
        first_comment = db(db_comment.issue == issue.id).select().first()
        if not first_comment: continue#fix bad issues, this should never happen!
        accept_pending = 'accepted' if issue.accept else 'pending'
        issues.append(
                DIV(A(_name='issue%s'%issue.id),
                    DIV(A('#',issue.id, _href=URL('issue', args=issue.id)), _class="issue_id"),
                    DIV(n_votes, DIV('score', _class='subtitle'), _class='n_votes'),
                    DIV(n_comments, DIV('repls', _class='subtitle'), _class='n_comments'),
                    DIV(issue.views, DIV('views', _class='subtitle'), _class='n_views'),
                    DIV(first_comment.title, DIV(DIV([DIV(t) for t in issue.type] if issue.type else ''), _class="issue_type"), _class='title'),
                    DIV(
                        DIV(db.auth_user._format%first_comment.created_by if first_comment.created_by else '', _class='created_by'),
                        DIV(' ',prettydate(first_comment.created_on), _class='created_on'),
                        _class='meta'
                        ),
                    DIV(IMG(_src=URL(request.application, 'static/plugin_issue', '%s.png'%(accept_pending)), _alt=accept_pending, _title=accept_pending),_class='accept_pending'),
                    DIV(IMG(_src=URL(request.application, 'static/plugin_issue', 'cross.png'), _alt="delete"), _class='del') if auth.has_membership('admin') else '',
                    _class='issue_summary issue%s'%issue.id,
                    _id=issue.id,
                    )
                )
    return TAG[''](JS('init_issues();'),filter_form,*issues)

def issue():
    if(request.vars.delete and auth.has_membership('admin')):
        del db_issue[int(request.vars.delete)]
        return 'delted'
    import operator
    issue_id = request.args(0)
    issue = db(db_issue.id == issue_id).select().first()
    if not issue:
        redirect(URL('edit'))
    #--------------------------------
    first_comment = db(db_comment.issue == issue.id).select().first()
    #--------------------------------
    if not (issue and first_comment):
        raise HTTP(404, 'issue does not exist or is deleted')
    #--------------------------------
    n_comments = db(db_comment.issue == issue.id).count()-1
    n_votes = get_score(issue_id)
    user_score = 0
    if auth.is_logged_in():
        vote_record = db(db_vote.issue == issue.id)(db_vote.created_by == auth.user.id).select().first()
        user_score = vote_record.score if vote_record else 0
    #--------------------------------
    #update views, but only once per session
    if not session.plugin_issue_views:
        session.plugin_issue_views = set([issue.id])
        issue.update_record(views = issue.views+1)
    elif issue.id not in session.plugin_issue_views:
        session.plugin_issue_views.add(issue.id)
        issue.update_record(views = issue.views+1)
    #--------------------------------
    types = [item.type for item in db(db_type.id>0).select()]
    #--------------------------------
    if request.extension == 'load':
        script = 'init_issue();'
    else:
        script = '$(document).ready(function() { init_issue();});'
    #--------------------------------
    LATEX = '<img src="http://chart.apis.google.com/chart?cht=tx&chl=%s" align="center"/>'
    extra = {
        'latex':lambda code: LATEX % code.replace('"','"'),
        'code_cpp':lambda text: CODE(text,language='cpp').xml(),
        'code_java':lambda text: CODE(text,language='java').xml(),
        'code_python':lambda text: CODE(text,language='python').xml(),
        'code_html':lambda text: CODE(text,language='html').xml()}
    first_comment_body = MARKMIN(first_comment.body,extra)
    #--------------------------------
    content = DIV(JS(script),
            DIV(
                DIV(A('#',issue.id, _href=URL(request.application, 'plugin_issue', 'issue', args = issue.id)), _class='issue_id') if request.vars.error_ticket or (request.extension == 'html') else '',
                DIV('[edit]', _id=issue.id, _class="edit") if auth.has_membership('admin') else '',#or (auth.is_logged_in() and (first_comment.created_by == auth.user.id)) else '',#creator not allowd to edit
                DIV( first_comment.title , _class='title'),
                DIV('Reported by ',db.auth_user._format%first_comment.created_by if first_comment.created_by else first_comment.nickname if first_comment.nickname else "Anonymous", ", created ",prettydate(first_comment.created_on), '.', _class='meta'),
                _id='issue_header'
                ),
            TABLE(TBODY(TR(
                TD(
                    DIV(
                        DIV(_title="This issue is important%s"%('' if auth.is_logged_in() else ' (login to vote)'), _id='vote_up', _class='v_%s'%user_score if user_score>0 else 'v_0' if auth.is_logged_in() else 'cant_vote'),
                        DIV(n_votes, _class="global_score"),
                        DIV(_title="This issue is less important%s"%('' if auth.is_logged_in() else ' (login to vote)'), _id='vote_down', _class='v_%s'%user_score if user_score<0 else 'v_0' if auth.is_logged_in() else 'cant_vote'),
                        DIV('score', _class='subtitle'),
                        _class='n_votes',
                        _id=issue.id,
                        ),
                    DIV(n_comments, DIV('repls', _class='subtitle'), _class='n_comments'),
                    DIV(issue.views, DIV('views', _class='subtitle'), _class='n_views'),
                    DIV('staus ', DIV('open' if issue.open else 'closed','/', 'accepted' if issue.accept else 'pending'), _class='status sbar_prop'),
                    DIV('type ', DIV([DIV(t) for t in issue.type] if issue.type else '-'), _class="issue_type sbar_prop"),
                    DIV('assigned to ', DIV([DIV(db.auth_user._format%db.auth_user[user_id]) for user_id in issue.assign_to] if issue.assign_to else '-'), _class='issue_assignment sbar_prop'),
                    DIV('error tickets ', DIV(DIV(len(issue.error)) if issue.error else '-'), _class='status sbar_prop') if issue.type and ('bug' in issue.type)  else '',
                    _id='issue_sidebar',
                    ),
                TD(
                    DIV(first_comment_body, _class='comment first_comment'),
                    DIV('Attached Error Tickets:', LOAD('plugin_issue', 'attached_errors', args=request.args, ajax=True), _class="attached_tickets") if issue.error else '',
                    LOAD('plugin_issue', 'comments', args=request.args, ajax=True, target="comments%s"%issue_id),
                    _id='issue_content'
                    ),
                )),_id="issue_table"),
            DIV(LOAD('plugin_issue', 'edit_comment', args=request.args, ajax=True, target="edit_comment%s"%issue_id),
                _id='issue_footer',
                ),
            _id="issue",
            )

    if request.extension == 'load':
        return content
    else:
        response.view = 'plugin_issue/base.html'
        response.files.append( URL(request.application, 'static/plugin_issue/markitup', 'jquery.markitup.pack.js') )
        response.files.append( URL(request.application, 'static/plugin_issue/markitup/sets/markmin', 'set.js') )
        response.files.append( URL(request.application, 'static/plugin_issue/markitup/skins/simple', 'style.css') )
        response.files.append( URL(request.application, 'static/plugin_issue/markitup/sets/markmin', 'style.css') )
        return dict(content = DIV(content, _id='edit_issue%s'%issue.id))


def vote():
    response.generic_patterns = ['html', 'json']
    issue_id = request.args(0)
    score = 1 if request.vars.vote == 'up' else -1 if request.vars.vote == 'down' else None
    if not (issue_id and score):
        raise HTTP(404)
    message = ''
    if auth.is_logged_in():
        record = db(db_vote.issue == issue_id)(db_vote.created_by == auth.user.id).select().first()
        if record:
            new_score = record.score+score
            if auth.has_membership('admin') and new_score<=3 and score and new_score>=-3:
                record.update_record(score = new_score)
            elif new_score<=1 and new_score>=-1:
                record.update_record(score = new_score)
            else:
                message =  'you have reached your maximum voting power'
            user_score = record.score

        else:
            db_vote.insert(created_by = auth.user.id, issue = issue_id, score = score)
            user_score = score
    else:
        user_score = 0
        message = 'only logged in uses are allowed to vote'
    response.flash = message
    #------------------------------------
    global_score = get_score(issue_id)
    #------------------------------------
    return dict(global_score=global_score, user_score=user_score)

def attached_errors():
    import operator
    issue_id = request.args(0)
    issue = db(db_issue.id == issue_id).select().first()
    if not issue:
        return 'no issue, no errors attached'
    #--------------------------------
    error_records = [db_error[eid] for eid in issue.error or []]
    #--------------------------------
    return TAG[''](TAG[''](
            [DIV(
            DIV(
                DIV(
                    IMG(_src=URL(request.application, 'static/plugin_issue', 'cancel.png'), _alt="remove"),
                    INPUT(_type="hidden", _name="error_ticket", _value=error.id),
                    _id=error.hash,
                    _class="remove_error action"
                    ) if request.vars.edit else '',
                DIV(len(error.ticket), _class="count"),
                DIV(error.origin, _class="origin"),
                DIV(error.summary, _class="summary"),
                _class="error_header"),
            DIV(CODE(error.traceback), _class="error_detail") if auth.is_logged_in() else '',
            _class="error_ticket"
            ) for error in error_records if error]),
            JS('init_errors();') if auth.is_logged_in() else '',
            )

@auth.requires_login()
def errors():
    #--------------------------------
    issue_id = request.args(0)
    issue = db(db_issue.id == issue_id).select().first()
    #--------------------------------
    hash2error = get_hash2error()
    issue_errors = issue.error if issue else []
    decorated = [(x['count'],x) for x in hash2error.values() if not issue_id or (not x['record_id'] in issue_errors)]
    decorated.sort(key=operator.itemgetter(0), reverse=True)
    errors = [x[1] for x in decorated]
    if not errors:
        return DIV( 'Add Error Tickets:',BR(), 'there are not error tickets :D', _class="add_tickets")
    #--------------------------------
    return TAG[''](JS('init_errors("%s");'%issue_id),
            DIV(
                'Add Error Tickets',
                DIV('Show/Hide', _onclick="$(this).next().toggle();", _class="button"),
                DIV(
                    [DIV(
                        DIV(
                            DIV(IMG(_src=URL(request.application, 'static/plugin_issue', 'add.png'), _alt="add error ticket"), _id=error['record_id'], _class="add_error action"),
                            DIV(error['count'], _class="count"),
                            DIV(error['origin'], _class="origin"),
                            DIV(error['summary'], _class="summary"),
                            _class="error_header"),
                        DIV(CODE(error['traceback']), _class="error_detail"),
                        _class="error_ticket",
                        ) for error in errors],
                    _style="display: none" if request.vars.edit else None),
                _class="add_tickets"),
            )

def edit():
    #----------------------------------------------
    issue_id = request.args(0)
    if issue_id:
        issue_record = db_issue[issue_id]
        first_comment = db(db_comment.issue == issue_record.id).select().first()
    #----------------------------------------------
    script = ''
    #----------------------------------------------
    #----------------------------------------------
    fields = [
            Field('title', requires = IS_NOT_EMPTY('you must provide a title'), default = first_comment.title if issue_id else None),
            Field('body', 'text', requires = IS_NOT_EMPTY('you must add a description'), default = first_comment.body if issue_id else None),
            ]
    if not request.vars.error:
        fields.append( Field('type', 'list:string', requires = IS_IN_SET([x.type for x in db(db_type.id>0).select(groupby=db_type.type)], multiple=True), default = issue_record.type if issue_id else None))
        fields.append( Field('error', 'list:reference plugin_issue_error') )
    if not auth.is_logged_in():
        fields.append( Field('nickname', default = session.plugin_issue_nickname or '') )

    if auth.has_membership('admin'):#privileged user
        fields.append( Field('assign_to', 'list:reference auth_user', requires=IS_IN_SET([(u.id,db.auth_user._format%u) for u in db(db.auth_user.id>0).select() if auth.has_membership('admin', u.id)], multiple=True), default = issue_record.assign_to if issue_id else None) )
        if issue_id:
            fields.append( Field('open', requires = IS_IN_SET(['open', 'closed'], zero = None), default = 'closed' if issue_id and not issue_record.open else 'open', widget=SQLFORM.widgets.radio.widget) )
            fields.append( Field('accept', 'boolean', default = issue_record.accept if issue_id else True) )#alway accept issues submitted by admins
    form = form_factory( *fields)
    #----------------------------------------------
    #make error tickets removable
    request.vars.edit = 1
    #----------------------------------------------
    def on_validation(form):
        if not auth.is_logged_in():
            print request.vars
            if not request.vars.human or (request.vars.human not in 'yes ja oui si  是的 да'.split()):
                form.errors.body = 'you did not pass as a human, try again'
    #----------------------------------------------
    if form.accepts(request.vars, session, keepvalues = True, onvalidation=on_validation):
        issue_values = dict(
                views = 0,
                open = True,
                accept = False if not(auth.has_membership('admin') and not issue_id) else True,
                type = form.vars.type if not request.vars.error else ['bug'],
                error = [int(x) for x in request.vars.getlist('error')],
                )
        #print 'insert with ',issue_values, request.vars.error
        comment_values = dict(
                title=form.vars.title,
                body=form.vars.body,
                issue=issue_id,
                )
        if issue_id:
            db_issue[issue_id].update_record(**issue_values)
            db_comment[first_comment.id].update_record(**comment_values)
        else:
            comment_values['created_on'] = request.now
            if auth.is_logged_in():
                comment_values['created_by'] = auth.user.id
            else:
                comment_values['nickname'] = form.vars.nickname
                session.plugin_issue_nickname = form.vars.nickname
            issue_id = db_issue.insert(**issue_values)
            issue_record = db_issue[issue_id]
            comment_values['issue'] = issue_id
            comment_id = db_comment.insert(**comment_values)
        if auth.has_membership('admin'):
            db_issue[issue_id].update_record( assign_to = form.vars.assign_to)
            if issue_id:
                db_issue[issue_id].update_record( open= True if not form.vars.open or (form.vars.open == 'open') or request.vars.error_ticket or request.vars.error else False, accept = form.vars.accept if form.vars.accept else True)
        #----------------------------------------
        content = TAG[''](
                JS("web2py_component('%s','issues');"%URL('issues')),
                A('Created Issue #%s'%issue_id, _href=URL('issue.html', args=issue_id)),
                )
        if request.extension == 'load':
            return content
        else:
            redirect(URL('issue', args=issue_id))
    #----------------------------------------------
    content = TAG[''](JS('init_edit();init_comment("edit_issue_%s");'%issue_id),DIV(form.custom.begin,
            A('View Issue List', _href=URL('index.html'), _class="button") if request.extsion == 'load' else '',
            DIV(
                DIV(A('#',issue_id, _href=URL(request.application, 'plugin_issue', 'issue', args = issue_id)) if issue_id else '', _class='issue_id'),
                DIV('Title', BR(), form.custom.widget.title , _class='title'),
                DIV(form.custom.widget.nickname, ' your name (optional)', _class='nickname') if not auth.is_logged_in() else '',
                _id='issue_header'
                ),
            TABLE(TBODY(TR(
                TD(
                    DIV('staus ', BR(), form.custom.widget.open, _class='status sbar_prop') if issue_id and auth.has_membership('admin') else '',
                    DIV('accept ', BR(), form.custom.widget.accept, _class='status sbar_prop') if issue_id and auth.has_membership('admin') else '',
                    DIV('type ', BR(), form.custom.widget.type, _class="issue_type sbar_prop", _id=issue_record.id if issue_id else 'None') if not request.vars.error_ticket or request.vars.error else '',
                    DIV('assign to ', BR(), form.custom.widget.assign_to, _class='issue_assignment sbar_prop') if auth.is_logged_in() else '',
                    _id='issue_sidebar',
                    ),
                TD(
                    DIV(
                        'Description', BR(),
                        form.custom.widget.body,
                        _class='comment first_comment'
                        ),
                    DIV('Are you a human? ',INPUT(_name='human', _type='text')) if not auth.is_logged_in() else '',
                    DIV('Attached Error Tickets:', LOAD('plugin_issue', 'attached_errors', args=request.args), _class="attached_tickets") if issue_id and issue_record.type and ('bug' in issue_record.type)  else '',
                    LOAD('plugin_issue', 'errors', args=issue_id, target='errors%s'%issue_record.id, ajax=True) if issue_id and issue_record.type and ('bug' in issue_record.type) else DIV(_id='errors%s'%issue_record.id if issue_id else 'errorsNone'),
                    TABLE(TR(TD('Attach File '), TD(INPUT(_type="file", _name='attachment0'), SPAN('+',_id="comment_attachment_more", _class="button"), _id=0) if auth.is_logged_in() else 'log in to post attachments' ), _class="issue_attachment add_attachment"),
                    _id='issue_content',
                    ),
                )),_id="issue_table"),
            DIV(
                form.custom.submit,' ',
                INPUT(_type="submit", _value="Cancel"),
                _id='issue_footer',
                ),
            form.custom.end,
            _class='issue',
            _id = 'edit_issue_%s'%issue_id,
            ))

    if request.extension == 'load':
        return content
    else:
        response.files.append( URL(request.application, 'static/plugin_issue/markitup', 'jquery.markitup.pack.js') )
        response.files.append( URL(request.application, 'static/plugin_issue/markitup/sets/markmin', 'set.js') )
        response.files.append( URL(request.application, 'static/plugin_issue/markitup/skins/simple', 'style.css') )
        response.files.append( URL(request.application, 'static/plugin_issue/markitup/sets/markmin', 'style.css') )
        response.view = 'plugin_issue/base.html'
        return dict(content = DIV(content,
            JS('$(document).ready(function() {init_comment("edit_issue_%s");});'%issue_id),
            _id='edit_issue'))

def edit_comment():
    issue_id = request.args(0)
    db_comment.issue.default = issue_id
    db_comment.title.readable, db_comment.title.writable = False, False
    #----------------------------------------------
    if auth.is_logged_in():
        db_comment.created_by.default = auth.user.id
        db_comment.nickname.readable, db_comment.nickname.writable = False, False
    db_comment.nickname.default = request.vars.get('nickname', session.plugin_issue_nickname or '')
    #----------------------------------------------
    def on_validation(form):
        if not auth.is_logged_in():
            print request.vars
            if not request.vars.human or (request.vars.human not in 'yes ja oui si  是的 да'.split()):
                form.errors.body = 'you did not pass as a human, try again'
    #----------------------------------------------
    def on_accept(form):
        session.plugin_issue_nickname = form.vars.nickname
        response.headers['web2py-component-command'] = XML("web2py_component('%s','comments%s')"%(URL(request.application, 'plugin_issue', comments, args=request.args), issue_id))
        if auth.is_logged_in():
            for vkey,val in request.vars.iteritems():
                if vkey.startswith('attachment') and val != '':
                    #print 'got ',vkey
                    db_comment_attachment.insert(
                            comment = form.vars.id,
                            file = db_comment_attachment.file.store(request.vars[vkey].file, request.vars[vkey].filename)
                            )
        #--------------------------------------------
        username = '%(first_name)s %(last_name)s '%auth.user if auth.is_logged_in() else request.vars.get('nickname', session.plugin_issue_nickname or "Anonymous")
        subject = '[%s] [Issue #%s] New comment by %s'%(APPLICATION_NAME, issue_id, username)
        all_comments = db(db_comment.issue == issue_id).select()
        assign_to = db_issue[issue_id].assign_to if db_issue[issue_id].assign_to else []
        recepients = list(set(\
                [c.email for c in all_comments if (c.email != None) and (c.email != '')]+\
                [c.created_by.email for c in all_comments if (c.created_by != None)]+\
                [db.auth_user[au].email for au in assign_to]))
        body = "issue #%s: %s\n-------------------\n%s commented\n%s\n-------------------\n\nto reply visit %s"%(
                issue_id,
                all_comments[0].title,
                username,
                form.vars.body,
                '%s/plugin_issue/issue/%s'%(APPLICATION_URL,issue_id)
                )
        #success = 
        mail.send(to = app_config.get('smtp', 'sender'), subject = subject, bcc=recepients, reply_to=app_config.get('smtp', 'sender'), message=body, encoding = 'utf8')
        #print success
        #--------------------------------------------
    form = crud.create(db_comment, onaccept=on_accept, onvalidation=on_validation)
    return TAG[''](
            'Add a Comment',
            form.custom.begin,
            DIV(form.custom.submit, ' ', form.custom.widget.nickname, ' your name (optional)',BR(), form.custom.widget.email, ' email (will not be displayed - enter if you want to be notified of changes)') if not auth.is_logged_in() else form.custom.submit,
            form.custom.widget.body,
            TABLE(TR(TD('Attach File '), TD(INPUT(_type="file", _name='attachment0', _class="upload"), SPAN('+',_id="comment_attachment_more", _class="button"), _id=0) if auth.is_logged_in() else 'log in to post attachments' ), _class="comment_attachment add_attachment"),
            DIV('Are you a human? ',INPUT(_name='human', _type='text')) if not auth.is_logged_in() else '',
            form.custom.end,
            JS('init_comment("edit_comment%s");'%issue_id),
            JS(response.headers['web2py-component-command']) if response.headers.has_key('web2py-component-command') else '',#must use since upload swallows header commands
            #_id = 'edit_comment%s'%issue_id,
            )

def comments():
    issue_id = request.args(0)
    comments = db(db_comment.issue==issue_id).select()
    #--------------------------------
    LATEX = '<img src="http://chart.apis.google.com/chart?cht=tx&chl=%s" align="center"/>'
    extra = {
        'latex':lambda code: LATEX % code.replace('"','"'),
        'code_cpp':lambda text: CODE(text,language='cpp').xml(),
        'code_java':lambda text: CODE(text,language='java').xml(),
        'code_python':lambda text: CODE(text,language='python').xml(),
        'code_html':lambda text: CODE(text,language='html').xml()}
    #--------------------------------
    if len(comments)<2:#first comment is always issue description
        return ''
    else:
        return TAG['']([
            DIV(
                #DIV(comment.title, _class="comment_title"),
                DIV(db(db_comment_vote.comment == comment.id).count(),_class='n_vote'),
                DIV(db.auth_user._format%comment.created_by if comment.created_by else comment.nickname if comment.nickname else "Anonymous", ' ', prettydate(comment.created_on), _class="meta"),
                DIV(MARKMIN(comment.body,extra), _class="comment_body"),
                TABLE(TR(TH('Attachment(s):'),TD([A(db_comment_attachment.file.retrieve(attachment.file)[0], _href=URL(request.application, 'default', 'download', args=attachment.file), _target="_blank") for attachment in comment.plugin_issue_comment_attachment.select()]) ), _class="attachments") if comment.plugin_issue_comment_attachment.count() else '',
                _class='comment',
                )
            for comment in comments[1:]
            ])

def hash():
    error_record = db(db_error.hash == request.args(0)).select().first()
    issue_record = None
    if error_record:
        issue_record = db(db.plugin_issue.error.contains(error_record.id)).select().first()
    return 'check(%s)'%simplejson.dumps( dict(
        count = str(len(error_record.ticket)) if error_record and error_record.ticket else '0',
        issue_exists = True if issue_record else False,
        ticket_exists = True if error_record else False,
        issue_id = '0' if not issue_record else '%s'%issue_record.id,
        ) )

def upload_ticket():
    if not (request.vars.ticket and request.vars.origin and request.vars.summary and request.vars.traceback):
        raise HTTP(500, 'inclomplete ticket information')
    thehash = hashlib.md5(request.vars.traceback).hexdigest()
    record = db(db_error.hash == thehash).select().first()
    if not record:
        record_id = db_error.insert(hash = thehash, ticket = request.vars.getlist('ticket'), origin = request.vars.origin, summary = request.vars.summary, traceback = request.vars.traceback)
        record = db_error[record_id]
    issue_record = db(db_issue.error.contains(record.id)).select().first()
    if issue_record:
        redirect( URL('issue', args=issue_record.id) )
    redirect( URL('edit', vars=dict(error=record.id if record else record_id)) )

def error_ticket():
    response.files.append(URL(request.application, 'static/plugin_issue', 'issue.css'))
    #-----------------------------------------------------
    #get the ticket hash
    if request.vars.ticket == 'unknown':
        return 'unknown error'
    if not request.vars.ticket or isinstance(request.vars.ticket, list): raise HTTP(404, 'sorry, your error ticket could not be found')
    #-----------------------------------------------------
    tmp, ticket_name = request.vars.ticket.split('/')
    try:
        error = pickle.load(open(os.path.join(request.folder, 'errors', ticket_name),'r'))
    except IOError:
        return 'cant access the error ticket'
    thehash = hashlib.md5(error['traceback']).hexdigest()
    #-----------------------------------------------------
    head = ''
    record = db(db_error.hash == thehash).select().first()
    if record:
        count = len(record.ticket)
        origin = record.origin
        summary = record.summary
    else:
        summary = error['traceback'].split("\n")[-2]
        origin = os.path.split(error['layer'])[1]
        count = 0
        record_id = db_error.insert(hash = thehash, ticket = [ticket_name], origin = origin, summary = summary, traceback = error['traceback'])
        record = db_error[record_id]
    #-----------------------------------------------------
    if not IS_ISSUE_SERVER:
        head = TAG[''](
                JS(""" //must do jsonp here since this is cross domain
                    function check(data){
                        $(document).ready(function(){
                            if (data.ticket_exists) {
                                if (data.issue_exits) {
                                    $('#server_count').html('This is a known error. Visit issue <a href="%(server)s/plugin_issue/issue/'+data.issue_id+'" target="_blank">#'+data.issue_id+'</a> to get more information');
                                }else {
                                    $('#server_count').html('The main server experienced this error '+String(data.count)+ 'times. If you want to help fixing this error you can <a href="%(server)s/plugin_issue/edit?hash=%(thehash)s" target="_blank">create new issue</a> describing what you did to create this error');
                                }
                            }else {
                                $('#server_count').html('This error is not known to the developers of this application.');
                                $('#server_count').addClass('warning');
                                $('#submit_error').slideDown();
                            }
                            $('#submit_error').slideDown();
                        });
                    }
                    """%dict(thehash = thehash, server = APPLICATION_URL)),
                SCRIPT(_type='text/javascript', _src='%(server)s/plugin_issue/hash.js/%(thehash)s'%dict( thehash=thehash, server=APPLICATION_URL))
                )
        content = TAG[''](
                H1('you just created an error'),
                A(request.vars.ticket, _href=URL('admin', 'default', 'ticket', args=request.vars.ticket), _target='_blank'),BR(),
                'You experienced this error ', len(record.ticket),' times. ',BR(),
                DIV(_id='server_count', _style='display: none;'),
                DIV(
                    ' You can help by submitting the error ticket information to the main server and describe what you did to create this error.',
                    FORM(
                        TAG['']([INPUT(_type="hidden", _name="ticket", _value=name) for name in record.ticket]),
                        INPUT(_type="hidden", _name="origin", _value=origin),
                        INPUT(_type="hidden", _name="summary", _value=summary),
                        INPUT(_type="hidden", _name="traceback", _value=error['traceback']),
                        INPUT(_type="submit", _value="Submit Error Ticket"),
                        _action = '%s/plugin_issue/upload_ticket'%APPLICATION_URL,
                    ),
                    _id="submit_error",
                    _class='no_trap',
                    #_style='display: none;'
                    ),
                #the following would work if we had a proper ticket.load in the admin app
                #DIV(_id='ticket'),
                #JS("""$(document).ready(function(){ $.ajax({'type':'get','url':'/admin/default/ticket.load/%(ticket)s','complete':function(xhr,text){$('#ticket').html(xhr.responseText);}});});"""%request.vars),
                )
    else:
        issue_record = db(db_issue.error.contains(record.id)).select().first()
        if issue_record: issue_record.update_record(open = True)
        if auth.has_membership('admin'):
            #-----------------------------------------------------
            content = TAG[''](H1('go fix the error'),
                    DIV(
                        DIV(
                            DIV(count, _class="count"),
                            DIV(origin, _class="origin"),
                            DIV(summary, _class="summary"),
                            _class="error_header"),
                        DIV(CODE(error['traceback']), _class="xerror_detail"),
                        _class="error_ticket",
                        ),
                    LOAD('plugin_issue', '%s.load'%('issue' if issue_record else 'edit'), ajax = True, args=issue_record.id if issue_record else None, vars = dict(error = record.id))
                    )
        else:
            content = TAG[''](
                    H1('you just created an error'),
                    A(request.vars.ticket, _href=URL('admin', 'default', 'ticket', args=request.vars.ticket), _target='_blank'),BR(),
                    'This error occured ',B(count), ' times before. You can help by describing steps to reproduce the error.',BR(),BR(),
                    #the following would work if we had a proper ticket.load in the admin app
                    #DIV(_id='ticket'),
                    #JS("""$(document).ready(function(){ $.ajax({'type':'get','url':'/admin/default/ticket.load/%(ticket)s','complete':function(xhr,text){$('#ticket').html(xhr.responseText);}});});"""%request.vars),
                    LOAD('plugin_issue', '%s.load'%('issue' if issue_record else 'edit'), ajax = True, args=issue_record.id if issue_record else None, vars = dict(error = record.id))
                    )
    response.view = 'plugin_issue/clean.html'
    return dict(content = content, head = head)
