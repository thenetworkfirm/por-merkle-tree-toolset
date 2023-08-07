const fs = require('fs');
const { MerkleTree } = require('merkletreejs');
const { getMerklePath, getMerkleProof, getProofAndPath } = require('../lib/merkalization');
const {
  readlines,
  SHA256,
  log,
  timeDelta,
  formatNum,
  writeAndFlush,
  closeStream
} = require('../lib/common');

async function process({
  input,
  output,
  treeRootFileName,
  treeLeavesFileName,
  treeLayersFileName,
  datasetFormat,
  logFunc,
  suppressProgress
}) {
  if (!input) throw new Error('input must be a path to the local file');
  if (!output) throw new Error('output must be a path to the local file');
  if (datasetFormat && ![1, 2].includes(parseInt(datasetFormat)))
    throw new Error('Only 1 or 2 can be specified as datasetFormat');

  logFunc = logFunc || log;
  datasetFormat = datasetFormat && parseInt(datasetFormat);

  let readCounter = 0;
  const writeStream = fs.createWriteStream(output);
  const leaves = [];
  let t1 = new Date();
  const t2 = t1;

  await readlines(input, async line => {
    readCounter += 1;
    if (readCounter === 1 && !line.startsWith('#'))
      throw new Error('Header not specified of malformed');
    if (readCounter === 1 && line.startsWith('#')) return;
    const [, leaf] = line.split(',');
    leaves.push(leaf);

    if (!suppressProgress) {
      logFunc(`Records read ${formatNum(readCounter)}`, true);
    }
  });
  logFunc(`Leaves loaded. Took ${timeDelta(t1)}s\n`);

  t1 = new Date();
  logFunc('Building tree\n');
  const tree = new MerkleTree(leaves, SHA256);
  const layers = tree.getLayers();
  logFunc(`Built tree. Took ${timeDelta(t1)}s\n`);
  fs.writeFileSync(treeRootFileName, tree.getRoot().toString('hex') + '\n');
  logFunc(`Tree root is written into ${treeRootFileName}\n`);
  fs.writeFileSync(treeLayersFileName, layers.length.toString() + '\n');
  logFunc(`Number of tree layers is written into ${treeLayersFileName}\n`);
  fs.writeFileSync(treeLeavesFileName, leaves.length.toString() + '\n');
  logFunc(`Number of tree leaves is written into ${treeLeavesFileName}\n`);

  t1 = new Date();
  readCounter = 0;
  let exportCounter = 0;
  await readlines(input, async line => {
    readCounter += 1;
    if (readCounter === 1 && !line.startsWith('#'))
      throw new Error('Header not specified of malformed');
    if (readCounter === 1 && line.startsWith('#')) {
      const chunks = line.split(',');
      chunks.pop(); // drop isAdditionalRecord column
      if (!datasetFormat || datasetFormat < 2) {
        writeStream.write([...chunks, 'path', 'proof', 'datasetFormat'].join(',') + '\n');
      } else {
        writeStream.write([...chunks, 'proofAndPath', 'datasetFormat'].join(',') + '\n');
      }
      return;
    }

    if (line.endsWith('F')) return;

    exportCounter += 1;

    const [position, ...rest] = line.split(',');
    rest.pop(); // drop isAdditionalRecord column

    if (!datasetFormat || datasetFormat < 2) {
      const proof = getMerkleProof(layers, parseInt(position)).join('|');
      const path = getMerklePath(layers, parseInt(position)).join('|');

      await writeAndFlush(
        [position, ...rest, path, proof, datasetFormat].join(',') + '\n',
        writeStream
      );
    } else {
      const proofAndPath = getProofAndPath(layers, parseInt(readCounter - 2));

      await writeAndFlush(
        [position, ...rest, proofAndPath.join('|'), datasetFormat].join(',') + '\n',
        writeStream
      );
    }

    if (!suppressProgress) {
      logFunc(`Lines exported ${formatNum(exportCounter)}`, true);
    }
  });
  await closeStream(writeStream);
  logFunc(`Exported tree. Took ${timeDelta(t1)}s\n`);
  logFunc(`Total time taken: ${timeDelta(t2)}s\n`);
}

module.exports = process;
