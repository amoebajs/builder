import { DIContainer, InjectDIToken, InjectScope } from "@bonbons/di";
import { EntityConstructor, resolveDepts } from "../decorators";
import {
  Path,
  WebpackConfig,
  GlobalMap,
  Builder,
  WebpackBuild
} from "../contracts";
import {
  PathNodeProvider,
  WebpackConfigProvider,
  BuilderProvider,
  WebpackBuildProvider
} from "../providers";
import { CommonPageModule } from "../pages";
import { CommonPipeModule } from "../pipes";

export class BuilderFactory {
  private di = new DIContainer({ type: "native" });
  private map = new GlobalMap();

  public get builder() {
    return this.di.get(Builder);
  }

  constructor() {
    this.initProviders();
    this.initModules();
  }

  /** @override can be overrided */
  public initProviders() {
    this.useProvider(Path, PathNodeProvider);
    this.useProvider(GlobalMap, () => this.map);
    this.useProvider(WebpackConfig, WebpackConfigProvider);
    this.useProvider(WebpackBuild, WebpackBuildProvider);
    this.useProvider(Builder, BuilderProvider);
  }

  /** @override can be overrided */
  public initModules() {
    this.useModule(CommonPageModule);
    this.useModule(CommonPipeModule);
  }

  public useProvider(
    contract: InjectDIToken<any>,
    imple: EntityConstructor<any>
  ) {
    this.di.register({
      token: contract,
      imp: imple,
      depts: resolveDepts(contract),
      scope: InjectScope.Singleton
    });
    return this;
  }

  public useModule(moduleName: EntityConstructor<any>) {
    this.map.useModule(moduleName);
    return this;
  }

  public get<T>(contract: InjectDIToken<T>): T {
    return this.di.get(contract);
  }

  public create() {
    this.di.complete();
    return this;
  }
}
