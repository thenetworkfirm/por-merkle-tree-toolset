#!/usr/bin/env node

const { Command, Option } = require('commander');
const run = require('../src/logic/preprocessing');
const { knownHashingStrategies } = require('../src/lib/hashing');

const program = new Command();
program.option('--input <value>', 'Input filename', 'input.csv');
program.option('--output <value>', 'Output filename', 'output.csv');
program.addOption(
  new Option('--hashingStrategy <value>', 'Hashing strategy').choices(knownHashingStrategies)
);
program.addOption(
  new Option('--balanceBy <number>', 'Number of additional records to balance the tree')
    .default(0)
    .argParser(parseInt)
);
program.addOption(
  new Option(
    '--balanceTo <number>',
    'Expected number of records in the target file. Mutually exclusive with --balanceBy'
  )
    .conflicts('balanceBy')
    .argParser(parseInt)
);
program.addOption(
  new Option(
    '--targetLevels <number>',
    'Expected number of levels on the resulting tree. Mutually exclusive with --balanceTo and --balanceBy options'
  )
    .conflicts(['balanceTo', 'balanceBy'])
    .argParser(parseInt)
);
program.addOption(
  new Option(
    '--balanceEntrySeed [value]',
    'Static value to use as a prt of userId in additional entries. Required if additinal entries must be added to balance the tree'
  )
);
program.addOption(
  new Option('--sortBalancedEntries', 'Only applicable if additinal entries should be added')
);
program.option('--suppressProgress', 'Do not output progress', false);

program.parse();

console.log('Running with options', program.opts());

run(program.opts());
