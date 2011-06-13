module('Node');

test('node', function() {
    expect(84);

    var x = 10, y = 35, width = 45, height = 28;

    var graph = new bui.Graph(document.getElementById('dummy'));
    var node = graph.add(bui.Node, [x, y, width, height]);
    testWith(node, x, y, width, height);

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

    node.x(x = 5);
    ok(positionCalled, 'Position changed and listener called.');
    positionCalled = false;
    node.y(y = 20);
    ok(positionCalled, 'Position changed and listener called.');
    positionCalled = false;
    node.width(width = 30);
    ok(sizeCalled, 'Size changed and listener called.');
    sizeCalled = false;
    node.height(height = 50);
    ok(sizeCalled, 'Size changed and listener called.');
    sizeCalled = false;
    testWith(node, x, y, width, height);

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
    equal(node.x(), x);
    equal(node.y(), y);
    equal(node.width(), width);
    equal(node.height(), height);

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
}