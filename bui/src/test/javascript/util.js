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