import {
  BasicChildRef,
  BasicEntityProvider,
  Builder,
  Fs,
  HtmlBundle,
  Path,
  ReactComponent,
  ReactDirective,
  ReactEntityProvider,
  WebpackBuild,
  WebpackConfig,
  WebpackPlugins,
  Prettier,
} from "../providers";
import { CommonComponentModule, CommonDirectiveModule } from "../plugins";
import { BaseFactory } from "./base";
import { FsNodeProvider } from "../providers/fs/fs.node";
import { PathNodeProvider } from "../providers/path/path.node";
import { WebpackBuildNodeProvider } from "../providers/webpack/builder/build.node";
import { WebpackPluginsNodeProvider } from "../providers/webpack/plugins/plugins.node";
import { PrettierNodeProvider } from "../providers/prettier/prettier.node";

export class Factory extends BaseFactory {
  /** @override can be overrided */
  protected initProviders() {
    super.initProviders();
    this.useProvider(Fs, FsNodeProvider);
    this.useProvider(Path, PathNodeProvider);
    this.useProvider(Prettier, PrettierNodeProvider);
    this.useProvider(WebpackConfig);
    this.useProvider(WebpackBuild, WebpackBuildNodeProvider);
    this.useProvider(WebpackPlugins, WebpackPluginsNodeProvider);
    this.useProvider(HtmlBundle);
    this.useProvider(Builder);
    this.useProvider(BasicEntityProvider);
    this.useProvider(BasicChildRef);
    this.useProvider(ReactDirective);
    this.useProvider(ReactComponent);
  }

  /** @override can be overrided */
  protected initModules() {
    super.initModules();
    this.useModule(CommonComponentModule);
    this.useModule(CommonDirectiveModule);
  }

  /** @override can be overrided */
  protected initEntityProviders() {
    super.initEntityProviders();
    this.useEntityProvider("react", ReactEntityProvider);
  }
}
