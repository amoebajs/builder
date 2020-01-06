module.exports = {
  rc: false,
  add: 0,
  useYarn: true,
  whiteSpace: "  ",
  outDist: "websdk-dist",
  register: "https://registry.npmjs.org/",
  debug: false,
  outTransform: json => ({
    ...json,
    name: "@amoebajs/builder-websdk",
    main: "index.js",
    types: "index.d.ts",
    scripts: undefined,
    nyc: undefined,
    devDependencies: undefined,
  }),
};
