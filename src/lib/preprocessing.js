const { spawnSync } = require('child_process');
const { SHA256, ValidationError } = require('./common');

class TargetLevelLessThanRecordsNum extends ValidationError {
  constructor() {
    super('Number of records is above targetLevels');
    this.name = 'TargetLevelLessThanRecordsNum';
  }
}

class balanceToLessThanRecordsNum extends ValidationError {
  constructor() {
    super('Number of records is above balanceTo value');
    this.name = 'balanceToLessThanRecordsNum';
  }
}

class IncompatibleParamsError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'IncompatibleParamsError';
  }
}

function makeBalanceRecord(userId, columns) {
  return [SHA256(userId).toString('hex'), ...columns.map(() => '0.0'), 'F'].join(',');
}

function sortBalanced(inputPath, outputPath) {
  const cleanupRegExp = /[^a-zA-Z0-9 ()\\/_\-.]/g;

  console.log(inputPath, outputPath.replace(cleanupRegExp, ''));

  const res = spawnSync(
    '/usr/bin/sort',
    ['-S1G', `-o${outputPath.replace(cleanupRegExp, '')}`, inputPath.replace(cleanupRegExp, '')],
    { env: { LC_ALL: 'POSIX' } }
  );

  if (res.status !== 0) {
    let err = res.error;
    if (!err) err = res.stderr.toString();
    if (!err.length) err = 'Something went wrong with sorting';
    throw new Error(err);
  }
}

function computeNumberOfRowsToAdd(recordsNow, { balanceTo, balanceBy, targetLevels }) {
  if (balanceTo && (balanceBy || targetLevels))
    throw new IncompatibleParamsError(
      'balanceTo cannot be used together with balanceBy or targetLevels'
    );
  if (balanceBy && (balanceTo || targetLevels))
    throw new IncompatibleParamsError(
      'balancedBy cannot be used together with balanceTo or targetLevels'
    );
  if (targetLevels && (balanceTo || balanceBy))
    throw new IncompatibleParamsError(
      'targetLevels cannot be used together with balanceTo or balanceBy'
    );

  if (targetLevels && 2 ** targetLevels < recordsNow) throw new TargetLevelLessThanRecordsNum();

  if (balanceTo && balanceTo < recordsNow) throw new balanceToLessThanRecordsNum();

  let numberOfRowsToAdd = targetLevels ? 2 ** targetLevels - recordsNow : balanceBy;

  if (balanceTo && !targetLevels) {
    numberOfRowsToAdd = balanceTo - recordsNow;
  }
  return numberOfRowsToAdd;
}

module.exports = {
  makeBalanceRecord,
  sortBalanced,
  computeNumberOfRowsToAdd
};
