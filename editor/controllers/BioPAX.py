# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
reload(biographer)
# END WORKAROUND

def importer():
	return dict()

def load():
	session.JSON = ""
	session.SBML = ""

	return dict()
