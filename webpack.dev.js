const config = require("./webpack.config");

module.exports = options => ({
  ...config(options),
  mode: "development",
  optimization: { minimize: false },
  plugins: []
});
