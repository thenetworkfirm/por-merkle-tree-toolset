function getMerklePath(layers, index) {
  const path = [];

  index = (index / 2) | 0;

  for (let i = 1; i < layers.length - 1; i++) {
    const layer = layers[i];

    if (index < layer.length) {
      path.push(layer[index].toString('hex'));
    }

    index = (index / 2) | 0;
  }

  return path;
}

function getMerkleProof(layers, index) {
  const proof = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const pairIndex = index % 2 ? index - 1 : index + 1;

    if (pairIndex < layer.length) {
      proof.push(layer[pairIndex].toString('hex'));
    }

    index = (index / 2) | 0;
  }

  return proof;
}

function getProofAndPath(layers, index) {
  const result = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const pairIndex = index % 2 ? index - 1 : index + 1;

    if (pairIndex < layer.length) {
      const leftIndex = index % 2 ? pairIndex : index;
      const rightIndex = index % 2 ? index : pairIndex;

      const res = [layer[leftIndex].toString('hex'), layer[rightIndex].toString('hex')].join(':');

      result.push(res);
    }

    index = (index / 2) | 0;
  }

  return result;
}

module.exports = {
  getMerklePath,
  getMerkleProof,
  getProofAndPath
};
