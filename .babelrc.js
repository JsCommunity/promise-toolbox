"use strict";

const NODE_ENV = process.env.NODE_ENV || "development";
const __PROD__ = NODE_ENV === "production";
const __TEST__ = NODE_ENV === "test";

const pkg = require("./package");

const plugins = {};

const presets = {
  "@babel/preset-env": {
    debug: !__TEST__,
    loose: true,
    targets: (() => {
      let node = (pkg.engines || {}).node;
      if (node !== undefined) {
        const trimChars = "^=>~";
        while (trimChars.includes(node[0])) {
          node = node.slice(1);
        }
      }
      return { browsers: pkg.browserslist, node };
    })(),
  },
};

Object.keys(pkg.devDependencies || {}).forEach(name => {
  if (!(name in presets) && /@babel\/plugin-.+/.test(name)) {
    plugins[name] = {};
  } else if (!(name in presets) && /@babel\/preset-.+/.test(name)) {
    presets[name] = {};
  }
});

module.exports = {
  comments: !__PROD__,
  ignore: __TEST__ ? undefined : [/\.spec\.js$/],
  overrides: !__TEST__
    ? undefined
    : [
        {
          test: /\.spec\.js$/,
          presets: [
            [
              "@babel/preset-env",
              {
                debug: !__TEST__,
                loose: true,
                targets: { node: true },
              },
            ],
          ],
        },
      ],
  plugins: Object.keys(plugins).map(plugin => [plugin, plugins[plugin]]),
  presets: Object.keys(presets).map(preset => [preset, presets[preset]]),
};
