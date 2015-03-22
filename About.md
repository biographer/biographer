The biographer editor allows you to create SBGN-ER/PD/AF diagramms. It can visualize SBML, SBGN-ML and jSBGN files and has a REST interface that can be used to integrate it into your tool.

You can download the Biographer.editor or you can use it on-line under

http://biographer.biologie.hu-berlin.de/

The editor works best with Chromium, ok with FireFox and so lala with Opera. We never tested InternetExplorer and we do not expect that it will work at all o\_O.

## Embedding Biographer.editor into your webpage ##
The biographer editor can be embedded into your webpage with an iframe. Here is an example

`<iframe frameBorder="0" height="200px" scrolling="no" src="/biographer/default/render?layout=biographer&amp;q=http%3A%2F%2Farthur.biologie.hu-berlin.de%3A8802%2Fbiographer%2Fstatic%2Fdata_models%2FBIOMD0000000002.xml" width="500px"></iframe>`

The variable `layout=biographer` is option and can be added if you want to trigger an automated layout

The variable `q=` takes an url as input that provides a file of the following formats
  * SBML
  * SBGN-ML
  * jSBGN

![http://jaguar.biologie.hu-berlin.de/~fkrause/biographer.editor_screenshot.png](http://jaguar.biologie.hu-berlin.de/~fkrause/biographer.editor_screenshot.png)