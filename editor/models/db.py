# -*- coding: utf-8 -*-

# http://www.web2py.com/book/default/chapter/06

db = DAL('sqlite://biographer.sqlite')

#########################################################################
## Define your tables below (or better in another model file) for example
##
## >>> db.define_table('mytable',Field('myfield','string'))
##
## Fields can be 'string','text','password','integer','double','boolean'
##       'date','time','datetime','blob','upload', 'reference TABLENAME'
## There is an implicit 'id integer autoincrement' field
## Consult manual for more options, validators, etc.
##
## More API examples for controllers:
##
## >>> db.mytable.insert(myfield='value')
## >>> rows=db(db.mytable.myfield=='value').select(db.mytable.ALL)
## >>> for row in rows: print row.id, row.myfield
#########################################################################

db.define_table('BioModels', Field('BIOMD','string'), Field('Title','string') )
db.define_table('Reactome', Field('ST_ID','string'), Field('Title','string') )

