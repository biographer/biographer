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

test('retrieveValueIfSet', function() {
    var obj = {
        foo : {
            bar : {
                foobar : 42
            }
        }
    };

    expect(2);

    equal(bui.util.retrieveValueIfSet(obj, 'foo', 'bar', 'foobar'),
            obj.foo.bar.foobar);
    equal(bui.util.retrieveValueIfSet(obj, 'foo', 'bar', '43'),
            undefined);
});

test('toBoolean', function() {
    expect(10);

    equal(bui.util.toBoolean(true), true);
    equal(bui.util.toBoolean(false), false);

    equal(bui.util.toBoolean('true'), true);
    equal(bui.util.toBoolean('1'), true);
    equal(bui.util.toBoolean('false'), false);
    equal(bui.util.toBoolean('0'), false);
    equal(bui.util.toBoolean('dsdsadsa'), false);

    equal(bui.util.toBoolean(1), true);
    equal(bui.util.toBoolean(0), false);
    equal(bui.util.toBoolean(-1), false);
});

test('toNumber', function() {
    expect(5);

    equal(bui.util.toNumber(1), 1);
    equal(bui.util.toNumber(0), 0);
    equal(bui.util.toNumber(-1), -1);

    equal(bui.util.toNumber('5'), 5);
    equal(bui.util.toNumber('-42'), -42);
});

test('propertySetAndNotNull', function() {
    expect(6);

    var obj = {
        data : {
            x : 5,
            y : 5
        },
        label : 'foo'
    };

    equal(bui.util.propertySetAndNotNull(obj, 'label'), true);
    equal(bui.util.propertySetAndNotNull(obj, ['data', 'x']), true);
    equal(bui.util.propertySetAndNotNull(obj, ['data', 'y']), true);
    equal(bui.util.propertySetAndNotNull(obj, ['data', 'x'],
            ['data', 'y']), true);
    equal(bui.util.propertySetAndNotNull(obj, 'label', ['data', 'x'],
            ['data', 'y']), true);
    equal(bui.util.propertySetAndNotNull(obj, 'label', ['data', 'x'],
            ['data', 'y'], 'foo'), false);
});

test('transformJSONCoordinates', function() {
    var json = {
        nodes : [
            {
                data : {
                    x : -20,
                    y : -25
                }
            },
            {
                data : {
                    x : -5,
                    y : -5
                }
            }, {
                data : {}
            }
        ]
    };

    bui.util.transformJSONCoordinates(json);

    equal(json.nodes[0].data.x, 0);
    equal(json.nodes[0].data.y, 0);
    equal(json.nodes[1].data.x, 15);
    equal(json.nodes[1].data.y, 20);
    equal(json.nodes[2].data.x, undefined);
    equal(json.nodes[2].data.y, undefined);
});