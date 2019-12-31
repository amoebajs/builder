import { DIContainer, InjectDIToken, InjectScope } from "@bonbons/di";
import { EntityConstructor, resolveDepts, IFrameworkDepts } from "./decorators";
import {
  Path,
  WebpackConfig,
  GlobalMap,
  Builder,
  WebpackBuild,
  Fs,
  HtmlBundle,
  WebpackPlugins,
  BasicEntityProvider
} from "../providers";
import { CommonComponentModule } from "../pages/common.module";
import { CommonDirectiveModule } from "../directives/common.module";
import { ReactEntityProvider } from "./component";

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
    this.initEntityProviders();
    this.initModules();
  }

  /** @override can be overrided */
  protected initProviders() {
    this.useProvider(GlobalMap, () => this._map);
    this.useProvider(Fs);
    this.useProvider(Path);
    this.useProvider(WebpackConfig);
    this.useProvider(WebpackBuild);
    this.useProvider(WebpackPlugins);
    this.useProvider(HtmlBundle);
    this.useProvider(Builder);
    this.useProvider(BasicEntityProvider);
  }

  /** @override can be overrided */
  protected initModules() {
    this.useModule(CommonComponentModule);
    this.useModule(CommonDirectiveModule);
  }

  /** @override can be overrided */
  protected initEntityProviders() {
    this.useEntityProvider("react", ReactEntityProvider);
  }

  public useProvider(
    contract: InjectDIToken<any>,
    imple?: EntityConstructor<any>
  ) {
    if (!this._completed) {
      this._di.register({
        token: contract,
        imp: imple || contract,
        depts: resolveDepts(imple || contract),
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

  public useEntityProvider<T extends typeof BasicEntityProvider>(
    name: keyof IFrameworkDepts,
    provider: T
  ) {
    if (!this._completed) {
      this._map.useProvider(name, provider);
      this.useProvider(provider);
    }
    return this;
  }
}
