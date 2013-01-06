#!/usr/bin/env python
# -*- coding: utf-8 -*-
import time
time.sleep(5)
import webbrowser
try:
    webbrowser.open('http://127.0.0.1:8000')
except:
    print 'warning: unable to detect your browser'
