module('Graph');

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

test('graph.translate', function() {
    var graph = new bui.Graph(document.getElementById('dummy'));

    var expectedX = 0,
        expectedY = 0;

    var listener = function(origin, newX, newY) {
        equal(newX, expectedX, 'translate.x provided to listener.');
        equal(newY, expectedY, 'translate.y provided to listener.');
        equal(origin.translate().x, expectedX, 'translate.x of provided graph.');
        equal(origin.translate().y, expectedY, 'translate.y of provided graph.');
        equal(graph.translate().x, expectedX, 'translate.x of variable graph.');
        equal(graph.translate().y, expectedY, 'translate.y of variable graph.');
    };

    graph.bind(bui.Graph.ListenerType.translate, listener);

    expect(18);
    graph.translate(expectedX = 200, expectedY = 100);
    graph.translate(expectedX = 200, expectedY = 100);
    graph.translate(expectedX = -200, expectedY = 100);
    graph.translate(expectedX = -200, expectedY = 80);
});

test('graph.add', function() {
    var graph = new bui.Graph(document.getElementById('dummy'));

    expect(4);

    var drawableThroughListener = null;

    graph.bind(bui.Graph.ListenerType.add, function(newDrawable) {
        ok(true, 'Add listener called.');
        drawableThroughListener = newDrawable;
    });

    var drawable = graph.add(bui.Drawable);
    drawable.bind(bui.Drawable.ListenerType.remove, function(drawable) {
        ok(true, 'Remove listener called.');
        equal(drawable, drawable, 'Correct drawable provided ' +
                'through listener.')
        
    });

    ok(drawable === drawableThroughListener, 'Same drawables.');

    drawable.remove();
});

