const fs = require('fs');
const Big = require('big.js');
const {
  readlines,
  log,
  timeDelta,
  formatNum,
  sanitizeBalance,
  writeAndFlush,
  closeStream,
  lineToColumns
} = require('../lib/common');
const {
  makeBalanceRecord,
  sortBalanced,
  computeNumberOfRowsToAdd
} = require('../lib/preprocessing');
const { hashingStrategyFor } = require('../lib/hashing');

async function process({
  input,
  output,
  balanceTo,
  balanceBy,
  hashingStrategy,
  sortBalancedEntries,
  targetLevels,
  balanceEntrySeed,
  logFunc,
  suppressProgress
}) {
  if (!input) throw new Error('input must be a path to the local file');
  if (!output) throw new Error('output must be a path to the local file');
  if (!hashingStrategy) throw new Error('hashingStrategy is required');

  logFunc = logFunc || log;
  const leafStrategy = hashingStrategyFor(hashingStrategy);

  const tempFile = 'artifacts/temp_preprocessing.csv';

  let readCounter = 0;
  let recordCounter = 0;
  let writeStream = fs.createWriteStream(tempFile);
  let balanceNames = null;
  let totalBalances = null;

  let t1 = new Date();
  const t2 = t1;

  let headerline;

  await readlines(input, async line => {
    line = line.replaceAll('\\"', '');
    line = line.replaceAll('"', '');
    line = line.replaceAll("\\'", '');
    line = line.replaceAll("'", '');

    readCounter += 1;
    if (readCounter === 1) {
      const columns = lineToColumns(line);
      [, ...balanceNames] = columns;
      logFunc(`Header has been detected: ${line}\nTokens: ${balanceNames}\n`);
      totalBalances = balanceNames.map(() => new Big(0.0));
      headerline = [...columns, 'isAdditionalRecord'];
      if (headerline[0] !== 'userhash') {
        headerline[0] = 'userhash';
      }
      return;
    }

    const [userId, ...thisBalances] = line.split(',');

    if (thisBalances.length !== balanceNames.length)
      throw new Error(
        `Expected ${balanceNames.length} balances. Got ${thisBalances.length} balances. Line: ${line}`
      );

    //add this balances to total balances
    totalBalances = thisBalances.map((balance, idx) => totalBalances[idx].plus(new Big(balance)));

    await writeAndFlush([userId.trim(), ...thisBalances, 'R'].join(',') + '\n', writeStream);

    if (!suppressProgress) {
      logFunc(`Reading source file. Balances read: ${formatNum(readCounter - 1)}`, true);
    }
  });
  logFunc(`\nSource reading took ${timeDelta(t1)}s\n`);

  totalBalances = balanceNames
    .map((name, idx) => `${name}:${totalBalances[idx].toString()}`)
    .join('\n');
  fs.writeFileSync('artifacts/total_balances.txt', totalBalances);
  logFunc(totalBalances + '\n');
  logFunc('Total balances saved to artifacts/total_balances.txt\n');

  recordCounter = readCounter - 1;

  const numberOfRowsToAdd = computeNumberOfRowsToAdd(recordCounter, {
    balanceBy,
    balanceTo,
    targetLevels
  });

  if (numberOfRowsToAdd > 0) {
    if (!balanceEntrySeed) throw new Error('balanceEntrySeed must be specified.');

    logFunc(`Adding ${formatNum(numberOfRowsToAdd)} additional entries\n`);
    t1 = new Date();
    let balanceRowCounter = 0; // original implementation used writeCounter which included header

    while (balanceRowCounter < numberOfRowsToAdd) {
      const balanceRecord = makeBalanceRecord(
        readCounter + balanceRowCounter + balanceEntrySeed,
        balanceNames
      );
      await writeAndFlush(balanceRecord + '\n', writeStream);
      balanceRowCounter += 1;
      if (!suppressProgress) {
        logFunc(`Added additional entries: ${formatNum(balanceRowCounter)}`, true);
      }
    }
    await closeStream(writeStream);
    logFunc(`\nBalancing took ${timeDelta(t1)}s\n`);

    if (sortBalancedEntries) {
      logFunc(`Sorting balanced file\n`);
      t1 = new Date();
      const balancedAndSorted = 'artifacts/balanced_and_sorted_tmp.csv';
      await sortBalanced(tempFile, balancedAndSorted);
      fs.renameSync(balancedAndSorted, tempFile);
      logFunc(`sorted output stored in ${tempFile} - ${timeDelta(t1)}s\n`);
    }
  } else {
    await closeStream(writeStream);
  }

  writeStream = fs.createWriteStream(output);
  writeStream.write(['#position', 'leaf', ...headerline].join(',') + '\n');

  t1 = new Date();
  readCounter = 0;

  await readlines(tempFile, async line => {
    readCounter += 1;
    const balances = line.split(',');
    const userId = balances.shift();
    const isAdditional = balances.pop(); // drop isAdditionalRecord columns

    // original implementation incremented counter at the end of the cycly and was skipping header line
    // in this case we increment at the beginning of the cycle so first record (real or fake) has index 2
    // while original implementation treated that index as 0
    const position = readCounter - 1;

    writeStream.write(
      [
        position,
        leafStrategy(userId, balances, balanceNames),
        userId,
        ...balances.map(sanitizeBalance),
        isAdditional
      ].join(',') + '\n'
    );

    if (!suppressProgress) {
      logFunc(`Records read and hashed: ${formatNum(readCounter - 1)}`, true);
    }
  });
  logFunc(`\nHashing took ${timeDelta(t1)}s\n`);

  await closeStream(writeStream);

  logFunc(`Total time taken ${timeDelta(t2)}s\n`);

  fs.unlinkSync(tempFile);
}

module.exports = process;
