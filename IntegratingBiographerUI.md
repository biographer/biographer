# Integrating biographer UI #

Integration of biographer UI with the other components has been simplified in order to enable continuous integration with the other projects.

## Preparation ##

**The createDistribution task has settings which are related to the biographer server component. Please update or check these settings before continuing. More information about these settings can be found in the description of the [createDistribution target](BuildingBiographerUI.md).**

First make sure that you are capable of building the biographer-ui component as described in [this article](BuildingBiographerUI.md). Since the minimized version (biographer-ui.min.js) is required, node.js needs to be installed.

Please execute the following build targets in order to generate the necessary artifacts. Again, refer to the [how-to build article](BuildingBiographerUI.md) in case you need additional guidance.

```
python src/build/python/manage.py clean build test jslint compress createDistribution
```

## Integration ##
After a successful build you will find a _target/distribution_ directory which contains all necessary files. You can copy the directory contents to your web application or change the paths in order to adapt it to your needs. If you change the paths manually, also change the value of the _bui.settings.css.stylesheetUrl_ variable as this indicates the stylesheet to be applied to the SVG. You can do this in two ways.

1) Before you create a bui.Graph instance, change the variable's value.
```
bui.settings.css.stylesheetUrl = '/static/css/visualization-svg.css';
graph = new bui.Graph(document.getElementsByTagName('body')[0]);
```

2) Set the value in _biographer-ui.js_ and _biographer-ui.min.js_. Simple search for _stylesheetUrl_ and replace the property's value.

## Usage ##
The last step is using it from an HTML file. I feel that an example is enough to explain the necessary JavaScript and CSS files as well as a standard use case. Please refer to the [API documentation](http://wiki.biographer.googlecode.com/hg/jsdoc/index.html) for more information

```
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

    <title>An example</title>

    <link rel="stylesheet" type="text/css" href="resources/css/visualization-html.css" />
    <link rel="stylesheet" type="text/css" href="resources/css/jquery-ui-1.8.13.css" />

    <script type="text/javascript" src="resources/js/jquery-1.6.min.js"></script>
    <script type="text/javascript" src="resources/js/jquery.simulate.js"></script>
    <script type="text/javascript" src="resources/js/jquery-ui-1.8.12.custom.min.js"></script>
    <script type="text/javascript" src="resources/js/biographer-ui.min.js"></script>
 
    <script type="text/javascript">
        var example = {
            nodes : [
                // node data
            ],
            edges : [
                // edge data
            ]
        };

        bui.ready(function() {
            // This shows how to manually change the path to visualization-svg.css
            // bui.settings.css.stylesheetUrl = '/biographer/static/Visualization/css/visualization-svg.css';
            graph = new bui.Graph(document.getElementsByTagName('body')[0]);

            bui.importFromJSON(graph, example);
        });
    </script>
</head>
<body>
</body>
</html>
```