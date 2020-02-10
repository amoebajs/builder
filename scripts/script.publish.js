module.exports = {
  rc: false,
  add: 0,
  useYarn: true,
  whiteSpace: "  ",
  register: "https://registry.npmjs.org/",
  debug: false,
  outTransform: json => ({
    ...json,
    scripts: undefined,
    nyc: undefined,
    devDependencies: undefined,
  }),
};
