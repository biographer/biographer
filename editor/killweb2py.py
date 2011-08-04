#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

from subprocess import Popen, PIPE
from shlex import split

p = Popen(split("ps aux"), stdout=PIPE)
q = Popen(split("grep 'python web2py.py'"), stdin=p.stdout, stdout=PIPE)
results = q.communicate()[0]

def isnumeric(s):
	try:
		int(s)
		return True
	except:
		return False

for result in results.splitlines():
	p = 0
	print result
	while not isnumeric(result[p]):
		p += 1
	q = p
	while isnumeric(result[q]):
		q += 1
	cmd = "kill -s QUIT "+result[p:q]
	print cmd
	Popen(split(cmd)).communicate()[0]
