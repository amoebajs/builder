import chalk from "chalk";
import HtmlWebPackPlugin from "html-webpack-plugin";
import TsImportPlugin from "ts-import-plugin";
import { Plugin, ProgressPlugin } from "webpack";
import { Injectable } from "../../../core";
import { Path } from "../../path/path.contract";
import { Fs } from "../../fs/fs.contract";
import { IWebpackTemplateAddOnOptions, WebpackPlugins } from "./plugins.contract";

const defaultAddOns: Record<string, IWebpackTemplateAddOnOptions[]> = {
  meta: [
    {
      properties: {
        charset: "utf-8",
      },
    },
  ],
  title: [
    {
      properties: {
        value: "Index",
      },
    },
  ],
  link: [
    {
      properties: {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css",
      },
    },
  ],
};

const block = "    ";

@Injectable()
export class WebpackPluginsNodeProvider implements WebpackPlugins {
  constructor(protected path: Path, protected fs: Fs) {}

  public createTemplatePlugin(
    options: Partial<import("./plugins.contract").IWebpackTemplatePluginOptions> = {},
  ): Plugin {
    const addOns: Record<string, IWebpackTemplateAddOnOptions[]> = {
      ...defaultAddOns,
      ...options?.addons,
    };
    return new HtmlWebPackPlugin({
      template: options?.path ?? this.path.resolve(__dirname, "..", "..", "..", "assets", "index.ejs"),
      titleSlot: createbTitleSlot(addOns.title ?? [], block),
      baseSlot: createbBaseSlot(addOns.base ?? [], block),
      faviconSlot: createbBaseSlot(addOns.base ?? [], block),
      metaList: (addOns.meta ?? [])
        .map(meta => createMeta(meta, block))
        .join("\n")
        .slice(4),
      styleList: [
        ...(addOns.style ?? []).map(i => ({ ...i, _type: "style" })),
        ...(addOns.link ?? []).map(i => ({ ...i, _type: "link" })),
      ]
        .map(style => createStyle(<any>style._type, style, block))
        .join("\n")
        .slice(4),
      scriptList: (addOns.script ?? [])
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

  public createImportPlugin(_?: Partial<import("./plugins.contract").IWebpackImportPluginOptions>): Plugin {
    return TsImportPlugin([
      {
        libraryDirectory: "../_esm5/internal/operators",
        libraryName: "rxjs/operators",
        camel2DashComponentName: false,
        transformToDefaultImport: false,
      },
      {
        libraryDirectory: "_esm5/internal",
        libraryName: "rxjs",
        camel2DashComponentName: false,
        transformToDefaultImport: false,
      },
    ]);
  }
}

function createbTitleSlot(addons: IWebpackTemplateAddOnOptions[], block = "") {
  const title = addons[0];
  return !!title ? `${block}<title>${title.properties?.value}</title>` : "";
}

function createbBaseSlot(addons: IWebpackTemplateAddOnOptions[], block = "") {
  const base = addons[0];
  return !!base ? `${block}<base href=${base.properties?.href}/>` : "";
}

function createMeta(meta: IWebpackTemplateAddOnOptions, block = "") {
  return `${block}<meta ${getAttibutes(meta)}${getProperties(meta)}/>`;
}

function createStyle(type: "link" | "style", style: IWebpackTemplateAddOnOptions, block = "") {
  const attrs = getAttibutes(style);
  switch (type) {
    case "link":
      return `${block}<link ${attrs}${getProperties(style)}/>`;
    case "style":
      return `${block}<style ${attrs}>\n${style.properties?.value}\n${block}</style>`;
    default:
      return block;
  }
}

function createScript(script: IWebpackTemplateAddOnOptions, block = "") {
  const adds = getAttibutes(script);
  const type = script.properties?.type ?? "text/javascript";
  if (script.properties?.src) {
    return `${block}<script type="${type}"${adds}src="${script.properties?.src}"></script>`;
  } else {
    return `${block}<script type="${type}"${adds}>\n${script.properties?.value}\n${block}</script>`;
  }
}

function getProperties(style: IWebpackTemplateAddOnOptions) {
  return Object.entries(style.properties ?? {})
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(" ");
}

function getAttibutes(entry: IWebpackTemplateAddOnOptions) {
  let adds = (entry.attributes ?? []).filter(i => !!i).join(" ");
  adds = adds.length === 0 ? adds + " " : " " + adds + " ";
  return adds;
}
