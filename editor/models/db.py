#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# http://www.web2py.com/book/default/chapter/06

db = DAL('sqlite://cache.sqlite')

db.define_table('BioModels',	Field('BIOMD','string'),	Field('Title','string'),	Field('File','string') )
db.define_table('Reactome',	Field('ST_ID','string'),	Field('Title','string'),	Field('File','string') )


#########################################################################
#this is a config helper 
db.define_table('config',
        Field('section'),
        Field('option'),
        Field('value')
        )
class Config:
    '''configure general things needed'''

    def __init__(self):
        self.create('smtp','login','user:password')
        self.create('smtp','server','server:portx')
        self.create('smtp','sender','name@server.org')
    def get(self, section, option):
        '''get a value'''
        record = db(db.config.option == option)(db.config.section == section).select(db.config.value).first()
        if record:
            return record.value.strip()

    def create(self, section, option, value):
        '''create value if it does not exist'''
        if not db(db.config.option == option)(db.config.section == section).count():
            print 'create: ',option,section,value
            db.config.insert(section = section, option = option, value = value)

    def set(self, section, option, value):
        '''set or update a value'''
        record = db(db.config.option == option)(db.config.section == section).select().first()
        if record:
            print 'setting val',record
            #record.update_record(value = value)
            db.config[record.id] = dict(section = section, option = option, value = value)
        else:
            print 'inserting val'
            db.config.insert(section = section, option = option, value = value)
        print 'fuuuuck',db.config[record.id]
    def write(self):
        pass
config = Config()
#########################################################################

from gluon.tools import *
from gluon.contrib import simplejson
mail = Mail()                                  # mailer
auth = Auth(globals(),db)                      # authentication/authorization
crud = Crud(globals(),db)                      # for CRUD helpers using auth
service = Service(globals())                   # for json, xml, jsonrpc, xmlrpc, amfrpc
plugins = PluginManager()

mail.settings.server = config.get('smtp', 'server') # your SMTP server
mail.settings.sender = config.get('smtp', 'sender') # your email
mail.settings.login = config.get('smtp', 'login') # your credentials or None

auth.settings.hmac_key = 'sha512:96779a30-57c0-40a7-a874-0b464c56e825'   # before define_tables()
auth.define_tables()                           # creates all needed tables
auth.settings.mailer = mail                    # for user email verification
auth.settings.actions_disabled.append('register')
auth.settings.registration_requires_verification = True
auth.settings.registration_requires_approval = True
auth.messages.verify_email = 'Click on the link http://'+request.env.http_host+URL(r=request,c='default',f='user',args=['verify_email'])+'/%(key)s to verify your email'
auth.settings.reset_password_requires_verification = True
auth.messages.reset_password = 'Click on the link http://'+request.env.http_host+URL(r=request,c='default',f='user',args=['reset_password'])+'/%(key)s to reset your password'

#########################################################################
## If you need to use OpenID, Facebook, MySpace, Twitter, Linkedin, etc.
## register with janrain.com, uncomment and customize following
# from gluon.contrib.login_methods.rpx_account import RPXAccount
# auth.settings.actions_disabled=['register','change_password','request_reset_password']
# auth.settings.login_form = RPXAccount(request, api_key='...',domain='...',
#    url = "http://localhost:8000/%s/default/user/login" % request.application)
## other login methods are in gluon/contrib/login_methods
#########################################################################

crud.settings.auth = None                      # =auth to enforce authorization on crud

#########################################################################
#login as first user if user comes from localhost
#########################################################################
import os.path
if not auth.is_logged_in() and db(db.auth_user.id>0).count() and not os.path.exists(os.path.join(request.folder, 'LOCK')) and (request.env.remote_addr in '127.0.0.1 localhost'.split()):
    from gluon.storage import Storage
    user = db(db.auth_user.id==1).select().first()
    auth.user = Storage(auth.settings.table_user._filter_fields(user, id=True))
    auth.environment.session.auth = Storage(user=user, last_visit=request.now,
                                            expiration=auth.settings.expiration)
    response.flash = 'You were automatically logged in as %s %s.<br/> To prevent this create the file %s'%(user.first_name, user.last_name, os.path.join(request.folder, 'LOCK'))
#########################################################################
#########################################################################
