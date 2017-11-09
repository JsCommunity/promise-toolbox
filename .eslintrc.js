module.exports = {
  extends: ['standard'],
  parser: 'babel-eslint',
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'no-var': 'error',
    'node/no-extraneous-import': 'error',
    'node/no-extraneous-require': 'error',
    'prefer-const': 'error',

    // https://github.com/xjamundx/eslint-plugin-standard/issues/21
    'standard/no-callback-literal': 'ignore',
  },
}
