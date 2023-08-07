#!/usr/bin/env node

const { Command, Option } = require('commander');
const run = require('../src/logic/merkalization');

const program = new Command();
program.option('--input <value>', 'Input filename', 'input.csv');
program.option('--output <value>', 'Output filename', 'output.csv');
program.addOption(
  new Option('--datasetFormat <number>', 'Export format version')
    .choices([1, 2])
    .default(2)
    .argParser(value => parseInt(value))
);
program.option('--treeRootFileName <value>', 'Tree root filename', 'artifacts/tree_root.txt');
program.option(
  '--treeLeavesFileName <value>',
  'Tree leaves filename',
  'artifacts/total_tree_leaves.txt'
);
program.option(
  '--treeLayersFileName <value>',
  'Tree levels filename',
  'artifacts/total_tree_layers.txt'
);
program.option('--suppressProgress', 'Do not output progress', false);

program.parse();

console.log('Running with options', program.opts());

run(program.opts());
