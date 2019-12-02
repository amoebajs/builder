const path = require("path");
const chalk = require("chalk");
const CopyPlugin = require("copy-webpack-plugin");
const transformerFactory = require("ts-import-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const ProgressPlugin = require("webpack/lib/ProgressPlugin");

const buildingStatus = {
  percent: "0",
  stamp: null
};

module.exports = options => ({
  entry: {
    app: ["./build/src/main.tsx"],
    vendor: ["react", "react-dom"]
  },
  output: {
    path: path.resolve(__dirname, "build", "output"),
    filename: "[name].js"
  },
  mode: "production",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  },
  module: {
    rules: [
      { test: /\.css/, use: ["style-loader", "css-loader"] },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              configFile: "tsconfig.jsx.json",
              getCustomTransformers: () => ({
                before: [
                  transformerFactory([
                    {
                      libraryName: "zent",
                      libraryDirectory: "es",
                      style: n => n.replace("zent/es", "zent/css") + ".css"
                    }
                  ])
                ]
              }),
              compilerOptions: {
                module: "es2015"
              }
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/assets/index.html",
      title: options.title
    }),
    new ProgressPlugin((percentage, msg) => {
      const percent = (percentage * 100).toFixed(2);
      const stamp = new Date().getTime();
      if (buildingStatus.percent === percent) return;
      if (buildingStatus.stamp === null) {
        buildingStatus.stamp = new Date().getTime();
      }
      const usage = stamp - buildingStatus.stamp;
      buildingStatus.percent = percent;
      console.log(
        `[${(usage / 1000).toFixed(2)}s] ${chalk.green(
          buildingStatus.percent + "%"
        )} ${msg}`
      );
      if (percent === "100.00") {
        buildingStatus.stamp = null;
        console.log(chalk.blue("[webpack] compile successfully\n"));
      }
    })
  ]
});
