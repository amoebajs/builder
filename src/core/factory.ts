import { DIContainer, InjectDIToken, InjectScope } from "@bonbons/di";
import { EntityConstructor, resolveDepts } from "../decorators";
import {
  Path,
  WebpackConfig,
  GlobalMap,
  Builder,
  WebpackBuild,
  Fs,
  HtmlBundle,
  WebpackPlugins
} from "../contracts";
import {
  PathNodeProvider,
  WebpackConfigProvider,
  BuilderProvider,
  WebpackBuildProvider,
  FsProvider,
  HtmlBundleProvider,
  WebpackPluginsProvider
} from "../providers";
import { CommonPageModule } from "../pages";
import { CommonPipeModule } from "../pipes";

export class Factory {
  private _completed = false;
  private _di = new DIContainer({ type: "native" });
  private _map = new GlobalMap();

  public get builder() {
    if (!this._completed) {
      this._di.complete();
      this._completed = true;
    }
    return this._di.get(Builder);
  }

  constructor() {
    this.initProviders();
    this.initModules();
  }

  /** @override can be overrided */
  protected initProviders() {
    this.useProvider(Fs, FsProvider);
    this.useProvider(Path, PathNodeProvider);
    this.useProvider(GlobalMap, () => this._map);
    this.useProvider(WebpackConfig, WebpackConfigProvider);
    this.useProvider(WebpackBuild, WebpackBuildProvider);
    this.useProvider(WebpackPlugins, WebpackPluginsProvider);
    this.useProvider(HtmlBundle, HtmlBundleProvider);
    this.useProvider(Builder, BuilderProvider);
  }

  /** @override can be overrided */
  protected initModules() {
    this.useModule(CommonPageModule);
    this.useModule(CommonPipeModule);
  }

  public useProvider(
    contract: InjectDIToken<any>,
    imple: EntityConstructor<any>
  ) {
    if (!this._completed) {
      this._di.register({
        token: contract,
        imp: imple,
        depts: resolveDepts(imple),
        scope: InjectScope.Singleton
      });
    }
    return this;
  }

  public useModule(moduleName: EntityConstructor<any>) {
    if (!this._completed) {
      this._map.useModule(moduleName);
    }
    return this;
  }
}
