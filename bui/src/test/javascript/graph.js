test('graph.scale', function() {
    var graph = new bui.Graph(document.getElementById('dummy'));

    var expectedScale = 0;

    var listener = function(origin, newScale) {
        equal(newScale, expectedScale, 'Scale provided to listener.');
        equal(origin.scale(), expectedScale, 'Scale of provided graph.');
        equal(graph.scale(), expectedScale, 'Scale of variable graph.');
    };

    graph.bind(bui.Graph.ListenerType.scale, listener);

    expect(6);
    graph.scale(expectedScale = 3);
    graph.scale(expectedScale = 3);
    graph.scale(expectedScale = 1);
});

test('graph.add', function() {
    var graph = new bui.Graph(document.getElementById('dummy'));

    var drawable = graph.add(bui.Drawable);

    console.log(graph._drawables[0]);

    drawable.remove();

    console.log(graph._drawables[0]);
});