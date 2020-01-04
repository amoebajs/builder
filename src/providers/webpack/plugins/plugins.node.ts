import chalk from "chalk";
import TransformerFactory from "ts-import-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import { Plugin, ProgressPlugin } from "webpack";
import { Injectable } from "../../../core/decorators";
import { Path } from "../../path/path.contract";
import { Fs } from "../../fs/fs.contract";
import { WebpackPlugins, IWebpackTemplateStyleOptions, IWebpackTemplateScriptOptions } from "./plugins.contract";

const defaultScripts: IWebpackTemplateScriptOptions[] = [];

const defaultStyleSheets: IWebpackTemplateStyleOptions[] = [
  {
    type: "rel-stylesheet",
    value: "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css",
  },
];

@Injectable()
export class WebpackPluginsNodeProvider implements WebpackPlugins {
  constructor(protected path: Path, protected fs: Fs) {}

  public createTsImportPlugin(rules: any[]) {
    return TransformerFactory(rules);
  }

  public createTemplatePlugin(options?: Partial<import("./plugins.contract").IWebpackTemplateOptions>): Plugin {
    return new HtmlWebPackPlugin({
      template: options?.path ?? this.path.resolve(__dirname, "..", "..", "assets", "index.html"),
      title: options?.title ?? "Index",
      charset: options?.charset ?? "utf-8",
      styleList: (options?.styles ?? defaultStyleSheets)
        .map(style => createStyle(style, "    "))
        .join("\n")
        .slice(4),
      scriptList: (options?.scripts ?? defaultScripts)
        .map(script => createScript(script, "    "))
        .join("\n")
        .slice(4),
    });
  }

  public createProgressPlugin(): Plugin {
    const buildingStatus = {
      percent: "0",
      stamp: <number | null>null,
    };
    return new ProgressPlugin((percentage, msg) => {
      const percent = (percentage * 100).toFixed(2);
      const stamp = new Date().getTime();
      if (buildingStatus.percent === percent) return;
      if (buildingStatus.stamp === null) {
        buildingStatus.stamp = new Date().getTime();
      }
      const usage = stamp - buildingStatus.stamp;
      buildingStatus.percent = percent;
      console.log(`[${(usage / 1000).toFixed(2)}s] ${chalk.green(buildingStatus.percent + "%")} ${msg}`);
      if (percent === "100.00") {
        buildingStatus.stamp = null;
        console.log(chalk.blue("[webpack] compile successfully\n"));
      }
    });
  }
}

function createStyle(style: IWebpackTemplateStyleOptions, block = "") {
  switch (style.type) {
    case "rel-stylesheet":
      return `${block}<link rel="stylesheet" href="${style.value}"/>`;
    case "inline-style":
      return `${block}<style>\n${style.value}\n${block}</style>`;
    default:
      return block;
  }
}

function createScript(script: IWebpackTemplateScriptOptions, block = "") {
  const deferToken = script.defer ? `defer="${script.defer}"` : undefined;
  const asyncToken = script.async ? `async="${script.async}"` : undefined;
  let adds = [deferToken, asyncToken].filter(i => !!i).join(" ");
  adds = adds.length === 0 ? adds + " " : " " + adds + " ";
  switch (script.type) {
    case "src-javascript":
      return `${block}<script type="text/javascript"${adds}src="${script.value}"></script>`;
    case "inline-javascript":
      return `${block}<script type="text/javascript"${adds}>\n${script.value}\n${block}</script>`;
    default:
      return block;
  }
}
