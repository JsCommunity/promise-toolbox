module.exports = {
  extends: [
    // standard configuration
    "standard",

    // https://github.com/mysticatea/eslint-plugin-node#-rules
    "plugin:node/recommended",

    // disable rules handled by prettier
    "prettier",
  ],

  parser: "@babel/eslint-parser",
  parserOptions: {
    sourceType: "module", // or "script" if not using ES modules
  },

  rules: {
    // uncomment if you are using a builder like Babel
    "node/no-unsupported-features/es-syntax": "off",
  },
};
