import { DIContainer, InjectDIToken, InjectScope } from "@bonbons/di";
import { EntityConstructor, IFrameworkDepts, Injectable, getInjectScope, resolveDepts } from "./core/decorators";
import {
  BasicChildRef,
  BasicEntityProvider,
  Builder,
  Fs,
  GlobalMap,
  HtmlBundle,
  Path,
  ReactComponent,
  ReactDirective,
  ReactEntityProvider,
  WebpackBuild,
  WebpackConfig,
  WebpackPlugins,
} from "./providers";
import { CommonComponentModule, CommonDirectiveModule } from "./plugins";

export class Factory {
  private _completed = false;
  private _di = new DIContainer({ type: "native" });
  private _map = new GlobalMap();

  private __pre_providers: [any, any?][] = [];
  private __pre_entity_providers: [string, any][] = [];
  private __pre_modules: any[] = [];

  public get builder() {
    this.parse();
    return this._di.get(Builder);
  }

  constructor() {
    this.initProviders();
    this.initEntityProviders();
    this.initModules();
  }

  /** @override can be overrided */
  protected initProviders() {
    this._initGlobalMap();
    this.useProvider(Fs);
    this.useProvider(Path);
    this.useProvider(WebpackConfig);
    this.useProvider(WebpackBuild);
    this.useProvider(WebpackPlugins);
    this.useProvider(HtmlBundle);
    this.useProvider(Builder);
    this.useProvider(BasicEntityProvider);
    this.useProvider(BasicChildRef);
    this.useProvider(ReactDirective);
    this.useProvider(ReactComponent);
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

  public useProvider(contract: InjectDIToken<any>, imple?: EntityConstructor<any>) {
    if (!this._completed) {
      // console.log(...(!imple ? [contract] : [contract, "-->", imple]));
      this._useProvider(contract, imple);
      this.__pre_providers.push([contract, imple]);
    }
    return this;
  }

  public useModule(md: EntityConstructor<any>) {
    if (!this._completed) {
      this.__pre_modules.push(md);
      this._map.useModule(md, r => {
        Injectable(InjectScope.New)(r);
        this._useProvider(r, r);
        return r;
      });
    }
    return this;
  }

  public useEntityProvider<T extends typeof BasicEntityProvider>(name: keyof IFrameworkDepts, provider: T) {
    if (!this._completed) {
      this.__pre_entity_providers.push([name, provider]);
      this._map.useProvider(name, provider);
      this._useProvider(provider, provider);
    }
    return this;
  }

  public removeProvider(contract: InjectDIToken<any>) {
    if (!this._completed) {
      this.__pre_providers = this.__pre_providers.filter(i => i[0] !== contract);
    }
    return this;
  }

  public removeModule(md: EntityConstructor<any>) {
    if (!this._completed) {
      this.__pre_modules = this.__pre_modules.filter(i => i !== md);
    }
    return this;
  }

  public removeEntityProvider<T extends typeof BasicEntityProvider>(provider: T) {
    if (!this._completed) {
      this.__pre_entity_providers = this.__pre_entity_providers.filter(i => i[1] !== provider);
    }
    return this;
  }

  public release() {
    this._completed = false;
    this._map = new GlobalMap();
    this._di = new DIContainer({ type: "native" });
    // 恢复状态
    this._initGlobalMap();
    if (this.__pre_modules.length > 0) {
      const __pre_modules = [...this.__pre_modules];
      this.__pre_modules = [];
      __pre_modules.forEach(md => this.useModule(md));
    }
    if (this.__pre_providers.length > 0) {
      const __pre_providers = [...this.__pre_providers];
      this.__pre_providers = [];
      __pre_providers.forEach(md => this.useProvider(...md));
    }
    if (this.__pre_entity_providers.length > 0) {
      const __pre_entity_providers = [...this.__pre_entity_providers];
      this.__pre_entity_providers = [];
      __pre_entity_providers.forEach(md => this.useEntityProvider(<any>md[0], md[1]));
    }
    return this;
  }

  public reset() {
    this.__pre_modules = [];
    this.__pre_providers = [];
    this.__pre_entity_providers = [];
    this.release();
    this.initProviders();
    this.initEntityProviders();
    this.initModules();
    return this;
  }

  public parse() {
    if (!this._completed) {
      this._di.complete();
      this._map.initMetadatas(p => this._di.get(p));
      this._completed = true;
    }
    return this;
  }

  private _initGlobalMap() {
    this._useProvider(GlobalMap, () => this._map);
  }

  private _useProvider(contract: InjectDIToken<any>, imple: any) {
    this._di.register({
      token: contract,
      imp: imple || contract,
      depts: resolveDepts(imple || contract),
      scope: getInjectScope(imple || contract) || InjectScope.Singleton,
    });
  }
}
