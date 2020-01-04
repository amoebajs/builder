const path = require("path");

module.exports = {
  entry: ["./src/websdk.ts"],
  output: {
    path: path.resolve(__dirname, "websdk-dist"),
    filename: "index.js",
    library: "@amoebajs/builder-websdk",
    libraryTarget: "commonjs",
  },
  mode: "production",
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  optimization: {
    minimize: true,
  },
  externals: ["fs", "module", "console", "child_process", "prettier"],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: require.resolve("ts-loader"),
            options: {
              transpileOnly: true,
              configFile: "tsconfig.json",
            },
          },
        ],
      },
    ],
  },
};