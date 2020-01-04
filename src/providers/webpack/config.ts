import webpack from "webpack";
import transformerFactory from "ts-import-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import { Injectable } from "../../core/decorators";
import { Path } from "../path";

export interface IWebpackTemplateScriptOptions {
  type: "inline-javascript" | "src-javascript";
  defer?: string | boolean;
  async?: string | boolean;
  value: string;
}

export interface IWebpackTemplateStyleOptions {
  type: "rel-stylesheet" | "inline-style";
  value: string;
}

export interface IWebpackTemplateOptions {
  title: string;
  path: string;
  charset: string;
  styles: IWebpackTemplateStyleOptions[];
  scripts: IWebpackTemplateScriptOptions[];
}

export interface IWebpackEntryOptions {
  app: string;
  vendor: string[];
}

export interface IWebpackOutputOptions {
  path: string;
  filename: string;
}

export interface IWebpackTypeScriptOptions {
  tsconfig: string;
  importPlugins: any[];
}

export interface IWebpackSandboxOptions {
  rootPath: string;
  dependencies: { [prop: string]: string };
}

export interface IWebpackOptions {
  entry?: Partial<IWebpackEntryOptions>;
  output?: Partial<IWebpackOutputOptions>;
  template?: Partial<IWebpackTemplateOptions>;
  typescript?: Partial<IWebpackTypeScriptOptions>;
  sandbox?: Partial<IWebpackSandboxOptions>;
  mode?: "production" | "development";
  minimize?: boolean;
  plugins?: webpack.Plugin[];
}

const defaultScripts: IWebpackTemplateScriptOptions[] = [];

const defaultStyleSheets: IWebpackTemplateStyleOptions[] = [
  {
    type: "rel-stylesheet",
    value: "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css",
  },
];

@Injectable()
export class WebpackConfig {
  constructor(protected path: Path) {}

  public getConfigs(options: IWebpackOptions) {
    const projectNodeModules = "node_modules";
    const nodeModules = options.sandbox
      ? [this.path.resolve(options.sandbox.rootPath!, "node_modules"), projectNodeModules]
      : [projectNodeModules];
    return {
      entry: {
        app: "./build/src/main.tsx",
        vendor: ["react", "react-dom"],
        ...options.entry,
      },
      output: {
        path: this.path.resolve(__dirname, "build", "output"),
        filename: "[name].js",
        ...options.output,
      },
      mode: options.mode ?? "production",
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        modules: nodeModules,
      },
      optimization: {
        minimize: options.minimize ?? true,
      },
      module: {
        rules: [
          {
            test: /\.css/,
            use: [require.resolve("style-loader"), require.resolve("css-loader")],
          },
          {
            test: /\.tsx?$/,
            use: [
              {
                loader: require.resolve("ts-loader"),
                options: {
                  transpileOnly: true,
                  configFile: options.typescript?.tsconfig ?? "tsconfig.jsx.json",
                  compilerOptions: { module: "es2015" },
                  getCustomTransformers: () => ({
                    before: [
                      transformerFactory(
                        options.typescript?.importPlugins ?? [
                          {
                            libraryName: "zent",
                            libraryDirectory: "es",
                            resolveContext: nodeModules,
                            style: n => n.replace("zent/es", "zent/css") + ".css",
                          },
                        ],
                      ),
                    ],
                  }),
                },
              },
            ],
          },
        ],
      },

      plugins: [
        new HtmlWebPackPlugin({
          template: options.template?.path ?? this.path.resolve(__dirname, "..", "..", "assets", "index.html"),
          title: options.template?.title ?? "Index",
          charset: options.template?.charset ?? "utf-8",
          styleList: (options.template?.styles ?? defaultStyleSheets)
            .map(style => createStyle(style, "    "))
            .join("\n")
            .slice(4),
          scriptList: (options.template?.scripts ?? defaultScripts)
            .map(script => createScript(script, "    "))
            .join("\n")
            .slice(4),
        }),
      ].concat(options.plugins ?? []),
    };
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
