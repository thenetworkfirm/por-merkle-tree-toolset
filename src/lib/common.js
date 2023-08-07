const fs = require('fs');
const { createHash } = require('crypto');
const readline = require('readline');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const log = (line, sameLine = false) =>
  process.stderr.write(sameLine ? `\x1B[0G\x1B[K${line}` : line);
const sleep = s => new Promise(resolve => setTimeout(resolve, s * 1000));
const timeDelta = (t1, t2 = new Date()) => (t2 - t1) / 1000;
const unixTimestamp = (time = new Date()) => Math.floor(time.getTime() / 1000);
const formatNum = number => number.toLocaleString();

const lineToColumns = line =>
  line
    .trim()
    .replace(/^#/, '')
    .split(',')
    .map(s => s.trim());

const SHA256 = stringToHash => {
  return createHash('sha256').update(stringToHash).digest();
};

async function readlines(path, onLineReceived) {
  const input = fs.createReadStream(path);
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    await onLineReceived(line);
  }

  input.close();
}

function sanitizeBalance(val) {
  // Remove trailing zeroes using https://stackoverflow.com/a/53397618/1231428
  let newBalance = val.toString().replace(/(\.[0-9]*[1-9])0+$|\.0*$/, '$1');
  if (!newBalance.includes('.')) {
    newBalance += '.0';
  }
  return newBalance;
}

async function writeAndFlush(chunk, writeStream) {
  const ok = writeStream.write(chunk);
  if (!ok) {
    // Waiting for writeStream to flush data to disk
    await new Promise(resolve => writeStream.once('drain', resolve));
  }
}

async function closeStream(writeStream) {
  writeStream.end();
  await new Promise(resolve => {
    writeStream.once('finish', resolve);
  });
}

module.exports = {
  readlines,
  SHA256,
  log,
  timeDelta,
  unixTimestamp,
  sleep,
  lineToColumns,
  formatNum,
  sanitizeBalance,
  ValidationError,
  writeAndFlush,
  closeStream
};
