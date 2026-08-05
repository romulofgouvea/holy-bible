const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      'react/display-name': 'off',
    },
  },
  {
    ignores: ["dist/*"],
  }
]);
