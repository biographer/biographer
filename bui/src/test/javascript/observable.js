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
    ok(observable.fire(expectedType));

    expectedType = type2;
    ok(observable.fire(expectedType));

    ok(observable.unbind(type1).fire(type1));

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

test('static.listeners', function() {
    bui.Observable._unbindAllStatic();
    expect(12);

    var type1 = 'foo', type2 = 'bar', expectedType, expectedInstance;

    var generateTypeListener = function(type) {
        var associatedType = type;

        return function(source) {
            equal(associatedType, expectedType);
            equal(source, expectedInstance);
            equal(this, expectedInstance);
        };
    };

    var instance1 = new bui.Observable();
    instance1._addType({ first : type1, second : type2});

    bui.Observable.bindStatic(type1, generateTypeListener(type1));
    bui.Observable.bindStatic(type2, generateTypeListener(type2));

    var instance2 = new bui.Observable();
    instance2._addType({ first : type1, second : type2});

    expectedType = type1;
    expectedInstance = instance1;
    expectedInstance.fire(expectedType);

    expectedInstance = instance2;
    expectedInstance.fire(expectedType);

    expectedType = type2;
    expectedInstance.fire(expectedType);

    expectedInstance = instance1;
    expectedInstance.fire(expectedType);
});

module('Inheritance');

test('inheritance.basic', function() {
    bui.Observable._unbindAllStatic();
    testObservable(new bui.Graph(document.getElementById('dummy')))
});

test('inheritance.static', function() {
    bui.Observable._unbindAllStatic();
    expect(1);
    var called = false;

    bui.Graph.bindStatic(bui.Graph.ListenerType.scale, function() {
        called = true;
    });

    var graph = new bui.Graph(document.getElementById('dummy'));
    graph.fire(bui.Graph.ListenerType.scale);

    ok(called);
});