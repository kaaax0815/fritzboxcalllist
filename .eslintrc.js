module.exports = {
  root: true,
  ignorePatterns: ['docs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  plugins: ['simple-import-sort', '@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/prettier' // Make sure this is always the last element in the array.
  ],
  rules: {
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    'simple-import-sort/imports': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    curly: 'warn'
  }
};
