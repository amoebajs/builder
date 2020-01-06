import { Fs, Path, WebpackBuild, WebpackPlugins, Prettier } from "../providers";
import { BaseFactory, IFactoryOptions } from "./base";
import { FsWebProvider } from "../providers/fs/fs.web";
import { PathWebProvider } from "../providers/path/path.web";
import { WebpackBuildWebProvider } from "../providers/webpack/builder/build.web";
import { WebpackPluginsWebProvider } from "../providers/webpack/plugins/plugins.web";
import { PrettierWebProvider } from "../providers/prettier/prettier.web";

export class Factory<O extends IFactoryOptions = IFactoryOptions> extends BaseFactory<O> {
  /** @override can be overrided */
  protected initProviders() {
    super.initProviders();
    this.useProvider(Fs, FsWebProvider);
    this.useProvider(Path, PathWebProvider);
    this.useProvider(Prettier, PrettierWebProvider);
    this.useProvider(WebpackBuild, WebpackBuildWebProvider);
    this.useProvider(WebpackPlugins, WebpackPluginsWebProvider);
  }
}
