from gluon.tools import prettydate
from gluon.sqlhtml import form_factory
import os
import pickle
import hashlib
import operator
import shutil

IS_ISSUE_SERVER = True if os.path.exists(os.path.join(request.folder, 'ISSUE_SERVER')) else False
APPLICATION_URL = "http://biographer.biologie.hu-berlin.de/biographer"

JS = lambda x: SCRIPT(x, _type="text/javascript")

db.define_table('plugin_issue_error',
        Field('hash'),
        Field('ticket', 'list:string'),
        Field('origin'),
        Field('summary'),
        Field('traceback', 'text'),
        )

db.define_table('plugin_issue',
        Field('open', 'boolean', default=True),
        Field('accept', 'boolean', default=False),
        Field('views', 'integer', default = 0, readable=False, writable=False),
        Field('assign_to', 'list:reference auth_user'),
        Field('error', 'list:reference plugin_issue_error'),
        Field('type', 'list:string'),
        )
db.define_table('plugin_issue_comment',
        Field('issue', db.plugin_issue, readable = False, writable = False),
        Field('title', length=160),
        Field('body', 'text', requires=IS_NOT_EMPTY()),
        Field('nickname'),
        Field('email', requires=IS_EMPTY_OR(IS_EMAIL())),
        Field('created_by', db.auth_user, readable = False, writable = False),
        Field('created_on', 'datetime', default=request.now, readable = False, writable = False),
        )
db.define_table('plugin_issue_type',
        Field('type'),
        )
db.define_table('plugin_issue_vote',
        Field('issue', db.plugin_issue),
        Field('created_by', db.auth_user),
        Field('score', 'integer'),
        )
db.define_table('plugin_issue_comment_attachment',
        Field('comment', db.plugin_issue_comment),
        Field('file', 'upload'),
        )
db.define_table('plugin_issue_comment_vote',
        Field('comment', db.plugin_issue_comment),
        Field('created_by', db.auth_user),
        Field('up_down', 'boolean'),
        )

#initial setup of some types, types are more like tags
if not db(db.plugin_issue_type.id>0).count():
    db.plugin_issue_type.insert(type = 'bug')
    db.plugin_issue_type.insert(type = 'proposal')
    db.plugin_issue_type.insert(type = 'help')

def get_score(issue_id):
    all_votes = db(db_vote.issue == issue_id).select(db_vote.score)
    return sum([r.score for r in all_votes]) if all_votes else 0

def get_hash2error():
    hash2error = dict()
    error_files_base = os.path.join(request.folder,'errors')
    for fn in os.listdir(error_files_base):
        record = db(db.plugin_issue_error.ticket.contains(fn)).select().first()
        if record:#found ticket in db
            thehash = record.hash
            try:
                hash2error[thehash]['count'] += 1
            except KeyError:
                hash2error[thehash] = dict(count = 1, origin = record.origin, summary = record.summary, traceback = record.traceback, hash = record.hash)
        else:#not found by filename
            try:
                error = pickle.load(open(os.path.join(error_files_base,fn),'r'))
            except IOError:
                continue
            thehash = hashlib.md5(error['traceback']).hexdigest()
            try:
                hash2error[thehash]['count'] += 1
            except KeyError:
                error_lines = error['traceback'].split("\n")
                last_line = error_lines[-2]
                error_causer = os.path.split(error['layer'])[1]
                hash2error[thehash] = dict(count = 1, origin = error_causer, summary = last_line, hash = thehash, traceback = error['traceback'])
            record = db(db.plugin_issue_error.hash == thehash).select().first()
            if record:#found by hash
                record.update_record(ticket = record.ticket+[fn])
            else:#not found by hash, add now
                record_id = db.plugin_issue_error.insert(hash = thehash, ticket = [fn], origin = error_causer, summary = last_line, traceback = error['traceback'])
        hash2error[thehash]['record_id'] = record.id if record else record_id
    return hash2error
