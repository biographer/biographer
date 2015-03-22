biographer consists of different components. Depending on your intended usage, you may need only a subset of them.

The Layouter is a C++ programm which takes network data as input and provides node positions as result. This program is specialized on biochemical reaction networks and correspondingly needs special information on the biological functions of the nodes. See the detailed topics on the layouter using the Components sub menu in the left sidebar.

The Visualization provides an in-browser visualization of biochemical reaction networks. The graph needs to be provided in a defined [json format](graph_exchange.md). Instructions on this component can be accessed through the left sidebar.

The server component is a sample application which uses the two above described projects. It is also capable of importing various dataformats and databases for biological networks. See left sidebar for details.