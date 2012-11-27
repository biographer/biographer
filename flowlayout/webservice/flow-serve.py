# -*- coding: utf-8 -*-
import os
import BaseHTTPServer
import subprocess
import sys

try: 
  PORT = int(sys.argv[1])
except:
  PORT = 8080

try: 
  LAYOUT_BIN = sys.argv[2] 
except: 
  LAYOUT_BIN = '/local/home/handorf/hg/biographer-layout/build/layout'


class Handler(BaseHTTPServer.BaseHTTPRequestHandler):
   def do_GET(self):
      self.send_error(405) # method not allowed
      return
   def do_POST(self):
      self.send_response(200)
      self.send_header("Access-Control-Allow-Origin", "*")
      self.send_header("Content-type", "text/plain")
      self.end_headers()
      length = int(self.headers.getheader('content-length'))
      content = self.rfile.read(length)
      #print content
      name = '/tmp/layout_srv_' + str(os.getpid())
      f = open(name + '.in', 'w')
      f.write(content)
      f.close()
      subprocess.call([LAYOUT_BIN, name + '.in', name + '.out'])
      f = open(name + '.out', 'r')
      self.wfile.write(f.read())
      f.close()
      return

server = BaseHTTPServer.HTTPServer(('',PORT), Handler)

server.serve_forever()
