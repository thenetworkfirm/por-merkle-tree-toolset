const { SHA256, sanitizeBalance } = require('./common');

const HASHING_STRATEGY_2 = (userId, balances, columns) =>
  SHA256(
    [userId, ...columns.map((name, idx) => `${name}:${sanitizeBalance(balances[idx])}`)].join(',')
  )
    .toString('hex')
    .substring(0, 16);

const HASHING_STRATEGY_1 = (userId, balances) => {
  return SHA256(
    [SHA256(userId).toString('hex'), SHA256(balances.join('')).toString('hex')].join('')
  )
    .toString('hex')
    .substring(0, 16);
};

const HASH_STRATEGIES = {
  legacy: HASHING_STRATEGY_1,
  nextgen: HASHING_STRATEGY_2
};

class NonExistingStrategyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonExistingStrategyError';
  }
}

function hashingStrategyFor(strategy) {
  const definition = HASH_STRATEGIES[strategy];
  if (!definition) throw new NonExistingStrategyError(strategy);
  return definition;
}

module.exports = {
  hashingStrategyFor,
  knownHashingStrategies: Object.keys(HASH_STRATEGIES)
};
