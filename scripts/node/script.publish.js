module.exports = {
  rc: false,
  add: 0,
  useYarn: true,
  whiteSpace: "  ",
  register: "https://registry.npmjs.org/",
  debug: false,
  outTransform: json => ({
    ...json,
    main: "index.js",
    types: "index.d.ts",
    scripts: undefined,
    nyc: undefined,
    devDependencies: undefined,
  }),
};
