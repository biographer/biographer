module('Node');

test('node', function() {
    expect(36);

    var x = 10, y = 35, width = 45, height = 28;

    var graph = new bui.Graph(document.getElementById('dummy'));
    var node = graph.add(bui.Node);

    node.size(width, height);

    var positionCalled = false, sizeCalled = false;
    node.bind(bui.Node.ListenerType.position, function() {
        ok(!positionCalled, 'Listener is called twice, which shouldn\'t be ' +
                'the case');
        positionCalled = true;
    }).bind(bui.Node.ListenerType.size, function() {
        ok(!sizeCalled, 'Listener is called twice, which shouldn\'t be ' +
                'the case');
        sizeCalled = true;
    });

    node.position(x = 300, y = 400);
    ok(positionCalled, 'Position changed and listener called.');
    positionCalled = false;
    testWith(node, x, y, width, height);

    node.size(width = 340, height = 450);
    ok(sizeCalled, 'Size changed and listener called.');
    sizeCalled = false;
    testWith(node, x, y, width, height);

    var moveX = 6, moveY = -8;
    node.move(moveX, moveY);
    ok(positionCalled, 'Position changed and listener called.');
    positionCalled = false;
    testWith(node, x + moveX, y + moveY, width, height);
});

function testWith(node, x, y, width, height) {
    var position = node.position(), size = node.size();
    equal(position.x, x);
    equal(position.y, y);
    equal(size.width, width);
    equal(size.height, height);

    var topLeft = node.topLeft(), bottomRight = node.bottomRight(),
            center = node.center();
    equal(topLeft.x, x);
    equal(topLeft.y, y);
    equal(bottomRight.x, x + width);
    equal(bottomRight.y, y + height);
    equal(center.x, x + width / 2);
    equal(center.y, y + height / 2);
};

test('parent-children', function() {
    expect(15);

    var graph = new bui.Graph(document.getElementById('dummy'));
    
    var parent = graph.add(bui.Node);

    var assertAmountOfChildren = function(amount) {
        equal(parent.children().length, amount);
    };
    var assertContainsChild = function() {
        for(var i = 0; i < arguments.length; i++) {
            var child = arguments[i];
            ok(parent.children().indexOf(child) !== -1);
            ok(parent === child.parent());
        }
    };

    assertAmountOfChildren(0);
    var child1 = graph.add(bui.Node);
    assertAmountOfChildren(0);

    child1.parent(parent);
    assertAmountOfChildren(1);
    assertContainsChild(child1);

    var child2 = graph.add(bui.Node);
    assertAmountOfChildren(1);

    parent.addChild(child2);
    assertAmountOfChildren(2);
    assertContainsChild(child1, child2);

    child1.parent(graph);
    assertAmountOfChildren(1);
    assertContainsChild(child2);

    parent.removeChild(child2);
    assertAmountOfChildren(0);
});
module('Drawable');

test('drawable.classes', function() {
    expect(12);
    var graph = new bui.Graph(document.getElementById('dummy'));
    var drawable = graph.add(bui.Drawable);

    var expectedClassString = null;

    drawable.bind(bui.Drawable.ListenerType.classes,
            function(node, classString) {
        equal(classString, expectedClassString);
        equal(node.classString(), expectedClassString);
        equal(drawable.classString(), expectedClassString);
    });

    var class1 = 'hidden';
    expectedClassString = class1;
    drawable.addClass(class1);

    var class2 = 'round';
    expectedClassString = class1 + ' ' + class2;
    drawable.addClass(class2);

    expectedClassString = class2;
    drawable.removeClass(class1);

    expectedClassString = '';
    drawable.removeClass(class2);
});
module('util');

test('string.removeNonNumbers', function() {
    equal('Answer is 42'.removeNonNumbers(), '42');
    equal('a007b'.removeNonNumbers(), '007');
});

test('string.endsWith', function() {
    expect(2);

    var end = 'bar';
    var start = 'foo';
    var complete = start + end;

    ok(complete.endsWith(end));
    ok(!start.endsWith(end));
});

test('function.createDelegate', function() {
    expect(1);

    var scope = { answer : 42 };

    var verify = function() {
        equal(this.answer, 42, 'Wrong scope applied.');
    }

    var delegate = verify.createDelegate(scope);

    delegate.call({ answer : 41})
});
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
function testObservable(observable) {
    expect(7);

    var type1 = 'foo', type2 = 'bar', expectedType = null;

    var generateTypeListener = function(type) {
        var associatedType = type;

        return function() {
            equal(associatedType, expectedType);
        };
    };

    observable._addType(type1)
        ._addType(type2)
        .bind(type1, generateTypeListener(type1), type1)
        .bind(type2, generateTypeListener(type2), type2);

    expectedType = type1;
    ok(observable.fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));

    ok(observable.unbind(type1, type1).fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));
}

module('Observable');

test('observable', function() {
    testObservable(new bui.Observable());
});

test('observable.addTypeObject', function() {
    expect(7);

    var type1 = 'foo', type2 = 'bar', expectedType = null;

    var generateTypeListener = function(type) {
        var associatedType = type;

        return function() {
            equal(associatedType, expectedType);
        };
    };

    var observable = new bui.Observable();
    observable._addType({ first : type1, second : type2})
        .bind(type1, generateTypeListener(type1), type1)
        .bind(type2, generateTypeListener(type2), type2);

    expectedType = type1;
    ok(observable.fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));

    ok(observable.unbind(type1, type1).fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));
});

test('observable.unbindAll', function() {
    expect(6);

    var type1 = 'foo', type2 = 'bar';

    var callCounter = 0;

    var listener = function(type) {
        callCounter++;
    };

    var identifier1 = 'Japan';
    var identifier2 = 'China';

    var observable = new bui.Observable();
    observable._addType({first : type1, second : type2})
        .bind(type1, listener, identifier1)
        .bind(type2, listener, identifier1)
        .bind(type1, listener, identifier2)
        .bind(type2, listener, identifier2);

    observable.fire(type1);
    equal(callCounter, 2);
    callCounter = 0;

    observable.fire(type2);
    equal(callCounter, 2);
    callCounter = 0;

    observable.unbindAll(identifier2);

    observable.fire(type1);
    equal(callCounter, 1);
    callCounter = 0;

    observable.fire(type2);
    equal(callCounter, 1);
    callCounter = 0;

    observable.unbindAll(identifier1);

    observable.fire(type1);
    equal(callCounter, 0);

    observable.fire(type2);
    equal(callCounter, 0);
});

module('Inheritance');

test('inheritance.basic', function() {
    testObservable(new bui.Graph(document.getElementById('dummy')))
});