import { Fs, Path, Prettier, WebpackBuild, WebpackPlugins } from "#providers";
import { BaseFactory, IFactoryOptions } from "./base";
import { FsNodeProvider } from "../providers/fs/fs.node";
import { PathNodeProvider } from "#providers/path/path.node";
import { WebpackBuildNodeProvider } from "#providers/webpack/builder/build.node";
import { WebpackPluginsNodeProvider } from "#providers/webpack/plugins/plugins.node";
import { PrettierNodeProvider } from "#providers/prettier/prettier.node";

export class Factory<O extends IFactoryOptions = IFactoryOptions> extends BaseFactory<O> {
  /** @override can be overrided */
  protected initProviders() {
    super.initProviders();
    this.useProvider(Fs, FsNodeProvider);
    this.useProvider(Path, PathNodeProvider);
    this.useProvider(Prettier, PrettierNodeProvider);
    this.useProvider(WebpackBuild, WebpackBuildNodeProvider);
    this.useProvider(WebpackPlugins, WebpackPluginsNodeProvider);
  }
}
