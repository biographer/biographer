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