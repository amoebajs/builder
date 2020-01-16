import { InjectScope, Injector } from "@bonbons/di";
import { BasicComponentChildRef, BasicDirectiveChildRef, GlobalMap } from "../../providers";
import { Injectable } from "../../core/decorators";
import {
  IBasicEntityProvider,
  ICompChildRefPluginOptions,
  IComponentCreateOptions,
  IDirecChildRefPluginOptions,
  IDirectiveCreateOptions,
  IInnerCompnentChildRef,
  IInnerDirectiveChildRef,
  SourceFileContext,
} from "../../core";
import { NotFoundError } from "../../errors";

@Injectable(InjectScope.New)
export class SourceFileBasicContext<T extends IBasicEntityProvider> extends SourceFileContext<T> {
  constructor(protected injector: Injector, private globalMap: GlobalMap) {
    super();
    this.components = [];
    this.directives = [];
    this.dependencies = {};
  }

  public setProvider(provider: string) {
    this.provider = <any>this.injector.get(this.globalMap.getProvider(<any>provider));
    return this;
  }

  public importComponents(components: IComponentCreateOptions[]) {
    this.components.push(...components);
    return this;
  }

  public importDirectives(directives: IDirectiveCreateOptions[]) {
    this.directives.push(...directives);
    return this;
  }

  public createRoot(options: ICompChildRefPluginOptions) {
    this.root = this._createComponentRef(options);
    return this;
  }

  public create() {
    this.dependencies = this._resolveDependencies();
    return this;
  }

  public getDependencies(): Record<string, string> {
    return this.dependencies;
  }

  private _createComponentRef(options: ICompChildRefPluginOptions) {
    const ref = this.injector.get(BasicComponentChildRef);
    const target = this.components.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.templateName, target.type);
    ref["__refId"] = options.refEntityId;
    ref["__refConstructor"] = value;
    ref["__entityId"] = options.entityName;
    ref["__options"] = options.options;
    ref["__context"] = this;
    ref["__refComponents"] = options.components.map(i => this._createComponentRef(i));
    ref["__refDirectives"] = options.directives.map(i => this._createDirectiveRef(i));
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private _createDirectiveRef(options: IDirecChildRefPluginOptions) {
    const ref = this.injector.get(BasicDirectiveChildRef);
    const target = this.directives.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.templateName, target.type);
    ref["__refId"] = options.refEntityId;
    ref["__refConstructor"] = value;
    ref["__entityId"] = options.entityName;
    ref["__options"] = options.options;
    ref["__context"] = this;
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  private _resolveDependencies() {
    const deptsList: Record<string, string>[] = [];
    for (const iterator of this.components) {
      deptsList.push(this._resolveEntityDepts(iterator));
    }
    for (const iterator of this.directives) {
      deptsList.push(this._resolveEntityDepts(iterator));
    }
    return deptsList.reduce((p, c) => ({ ...p, ...c }), {});
  }

  private _resolveEntityDepts(target: IDirectiveCreateOptions | IComponentCreateOptions): Record<string, string> {
    const { metadata } = this._resolveMetadataOfEntity(target.moduleName, target.templateName, target.type);
    return metadata.entity.dependencies || {};
  }

  private _resolveMetadataOfEntity(moduleName: string, templateName: string, type: "component" | "directive") {
    const target = this.globalMap[type === "component" ? "getComponent" : "getDirective"](moduleName, templateName);
    if (!target) {
      throw new NotFoundError(`${type} [${moduleName}.${templateName}] not found`);
    }
    return target;
  }
}
