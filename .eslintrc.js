module.exports = {
  env: {
    node: true,
    jest: true,
    es6: true
  },
  root: true,
  plugins: ['jest', 'prettier'],
  extends: ['eslint:recommended', 'plugin:jest/recommended', 'prettier'],
  rules: { 'prettier/prettier': 2 },
  settings: {
    jest: {
      version: 27
    }
  },
  parserOptions: {
    ecmaVersion: 2018
  }
};
