# Biographer UI introduction #

Thy biographer UI project started in 2011 through the Google's Summer of Code project. For the GSoC project the biographer UI project was described in the following way ([source](http://rumo.biologie.hu-berlin.de/gsoc/jslib.html)).

> While graph layout is an essential part of network visualization, it is still necessary to produce the actual image data. Visualization tools like Cytoscape or GraphViz provide that functionality for wide variety of output formats. Clearly, the layout algorithm proposed in project 1 can act as a plugin in these packages.

> However, things are moving to the web and many new projects are developed as web applications. At this point it would be extremely helpful to access the information about the network structure directly from HTML DOM structure (preferable by integration of SVG into HTML5 for easier export functionality).  Currently, we are not aware of any tools providing this functionality adapted to reaction networks.

> Here, we propose to implement a JavaScript library which displays networks using SVG framework with focus on biological reaction networks following the standard SBGN notation (i.e. express SBGN nodes and edges as SVG objects) and provides an API facilitating the manipulation adjusted to biological data. Open source packages like Raphael or JavaScript InfoVis Toolkit may provide an excellent starting point.

> A similar option in the context of signalling pathways in biology is provided by Wikipathways [1](1.md). This JAVA-applet based project aims in providing the means to edit the pathways by the community to address the problem of pathway curation. However we focus on in-browser pathway visualization with a JavaScript-API to interact with the DOM representation of the network. In this way we will deliver a lightweight library which will certainly be useful to a lot of other biology centered open source projects.

> Interested communities certainly include signalling pathway databases (like KEGG and Reactome), which currently render the networks as images, as well as our in-house projects SemanticSBML, ModelMaGe and MetaPath Online which will also strongly profit from this opportunity.

The biographer UI component integrates itself with the other components by specializing on the visualization of reaction graphs while the server component provides the data on which the visualization operates. This data may include information about node type, positioning, dimensions, label, sub nodes and edges.

You can experiment with this component using the [functionality showcase](http://wiki.biographer.googlecode.com/hg/biographer-ui/showcase.html) or take a look at the following video.

<a href='http://www.youtube.com/watch?feature=player_embedded&v=gUeGPAnSBVk' target='_blank'><img src='http://img.youtube.com/vi/gUeGPAnSBVk/0.jpg' width='425' height=344 /></a>