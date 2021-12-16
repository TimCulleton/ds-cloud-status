import SampleModule = require('../../src/server/Test');

describe('Sample Tests', () => {
    it('Test 1', () => {
        expect(SampleModule.doSomething('xxx')).toBeTruthy();
    });
});
