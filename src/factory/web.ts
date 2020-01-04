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
import { FsWebProvider } from "../providers/fs/fs.web";
import { PathWebProvider } from "../providers/path/path.web";
import { WebpackBuildWebProvider } from "../providers/webpack/builder/build.web";
import { WebpackPluginsWebProvider } from "../providers/webpack/plugins/plugins.web";
import { PrettierWebProvider } from "../providers/prettier/prettier.web";

export class Factory extends BaseFactory {
  /** @override can be overrided */
  protected initProviders() {
    super.initProviders();
    this.useProvider(Fs, FsWebProvider);
    this.useProvider(Path, PathWebProvider);
    this.useProvider(Prettier, PrettierWebProvider);
    this.useProvider(WebpackConfig);
    this.useProvider(WebpackBuild, WebpackBuildWebProvider);
    this.useProvider(WebpackPlugins, WebpackPluginsWebProvider);
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
