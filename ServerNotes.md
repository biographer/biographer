# Notes #

## Sharing biographer in the LAN ##

First make sure, biographer-server is installed as biographer/ in the applications folder of your web2py installation (therefor have a look at [Installation](ServerInstallation.md)). Then start web2py:
```
     cd /usr/share/web2py
     ./web2py.py --nogui -M -N -a secret_password --timeout=120
```

If you want to keep web2py running, when your current terminal is closed, type instead:
```
     screen ./web2py.py --nogui -M -N -a secret_password --timeout=120
```

Add the following lines to your apache2 configuration (/etc/apache2/sites-enabled/default) to make biographer accessible from inside the LAN:
```
        ProxyRequests           Off

        ProxyTimeout            120

        ProxyPass               /biographer/    http://localhost:8000/biographer/
        ProxyPassReverse        /biographer/    http://localhost:8000/biographer/
        ProxyPass               /admin/         http://localhost:8000/admin/
        ProxyPassReverse        /admin/         http://localhost:8000/admin/
```

## Experiencing timeouts or "502 Proxy Error" respectively ##

biographer will not limit the size of your model.
The server's computing time will increase accordingly
and you may get in trouble with timeouts and related problems.

You may have to run web2py with an increased timeout:
```
   web2py ... --timeout=120
```

Depending on the way you access your web2py installation, may need to make use of a [ProxyTimeout](http://httpd.apache.org/docs/2.1/mod/mod_proxy.html#proxytimeout) directive in your apache installation:
```
   ProxyTimeout 120
```

or increase the individual timeout of the appropriate [ProxyPass](http://httpd.apache.org/docs/2.1/mod/mod_proxy.html#proxypass) directives:
```
   ProxyPass ... timeout=120
```