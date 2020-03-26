import chalk from "chalk";
import HtmlWebPackPlugin from "html-webpack-plugin";
import { Plugin, ProgressPlugin } from "webpack";
import { Injectable } from "../../../core";
import { Path } from "../../path/path.contract";
import { Fs } from "../../fs/fs.contract";
import { WebpackPlugins, IWebpackTemplateAddOnOptions } from "./plugins.contract";

const defaultAddOns: IWebpackTemplateAddOnOptions[] = [
  {
    tagName: "meta",
    properties: {
      charset: "utf-8",
    },
  },
  {
    tagName: "link",
    properties: {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css",
    },
  },
];

const block = "    ";

@Injectable()
export class WebpackPluginsNodeProvider implements WebpackPlugins {
  constructor(protected path: Path, protected fs: Fs) {}

  public createTemplatePlugin(
    options: Partial<import("./plugins.contract").IWebpackTemplatePluginOptions> = {},
  ): Plugin {
    const addOns = options?.addons ?? defaultAddOns;
    return new HtmlWebPackPlugin({
      template: options?.path ?? this.path.resolve(__dirname, "..", "..", "..", "assets", "index.html"),
      baseSlot: createbBaseSlot(addOns, block),
      metaList: addOns
        .filter(i => i.tagName === "meta")
        .map(meta => createMeta(meta, block))
        .join("\n")
        .slice(4),
      styleList: addOns
        .filter(i => i.tagName === "link" || i.tagName === "style")
        .map(style => createStyle(style, block))
        .join("\n")
        .slice(4),
      scriptList: addOns
        .filter(i => i.tagName === "scripts")
        .map(script => createScript(script, block))
        .join("\n")
        .slice(4),
    });
  }

  public createProgressPlugin(
    options: Partial<import("./plugins.contract").IWebpackProgressPluginOptions> = { type: "emit" },
  ): Plugin {
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
      if (options?.type === "trigger") {
        options.trigger &&
          options.trigger(`[${(usage / 1000).toFixed(2)}s] ${chalk.green(buildingStatus.percent + "%")} ${msg}`);
      } else {
        console.log(`[${(usage / 1000).toFixed(2)}s] ${chalk.green(buildingStatus.percent + "%")} ${msg}`);
      }
      if (percent === "100.00") {
        buildingStatus.stamp = null;
        if (options?.type === "trigger") {
          options.trigger && options.trigger("[webpack] compile successfully\n");
        } else {
          console.log(chalk.blue("[webpack] compile successfully\n"));
        }
      }
    });
  }
}

function createbBaseSlot(addons: IWebpackTemplateAddOnOptions[], block = "") {
  const base = addons.find(i => i.tagName === "base");
  return !!base ? `${block}<base href=${base.properties?.href}/>` : "";
}

function createMeta(meta: IWebpackTemplateAddOnOptions, block = "") {
  const items = Object.entries(meta)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(" ");
  return `${block}<meta ${items}/>`;
}

function createStyle(style: IWebpackTemplateAddOnOptions, block = "") {
  switch (style.tagName) {
    case "link":
      return `${block}<link rel="${style.properties?.rel ?? "stylesheet"}" href="${style.properties?.href}"/>`;
    case "style":
      return `${block}<style>\n${style.properties?.value}\n${block}</style>`;
    default:
      return block;
  }
}

function createScript(script: IWebpackTemplateAddOnOptions, block = "") {
  let adds = (script.attributes ?? []).filter(i => !!i).join(" ");
  adds = adds.length === 0 ? adds + " " : " " + adds + " ";
  const type = script.properties?.type ?? "text/javascript";
  if (script.properties?.src) {
    return `${block}<script type="${type}"${adds}src="${script.properties?.src}"></script>`;
  } else {
    return `${block}<script type="${type}"${adds}>\n${script.properties?.value}\n${block}</script>`;
  }
}
