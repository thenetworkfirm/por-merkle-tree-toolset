const { lineToColumns, sanitizeBalance } = require('./common');

describe('lineToColumns', () => {
  it('returns expected result', () => {
    const subject = ' #some , other, whatever ';
    expect(lineToColumns(subject)).toEqual(['some', 'other', 'whatever']);
  });
});

describe('sanitizeBalance', () => {
  it('returns expected result', () => {
    const testcases = [
      { sample: '1234.567800000000', expected: '1234.5678' },
      { sample: '0', expected: '0.0' },
      { sample: '0.000000000', expected: '0.0' },
      { sample: '1234.560000000000001', expected: '1234.560000000000001' }
    ];

    testcases.forEach(({ sample, expected }) => expect(sanitizeBalance(sample)).toEqual(expected));
  });
});
