#!/bin/bash
ps ux | grep "python flow-serve.py" | grep -v grep > /dev/null;
if [ $? -ne 0 ]; then
   nohup `which python` flow-serve.py >>log 2>&1  &
fi
