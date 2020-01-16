import ts from "typescript";
import { InjectScope, Injector } from "@bonbons/di";
import { BasicComponentChildRef, BasicDirectiveChildRef, GlobalMap } from "../../providers";
import { EntityConstructor, Injectable } from "../../core/decorators";
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
  private __componentsWillEmit: IComponentCreateOptions[] = [];

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

  public build() {
    this.dependencies = this._resolveDependencies();
    return this;
  }

  public getDependencies(): Record<string, string> {
    return this.dependencies;
  }

  public async createRoot(options: ICompChildRefPluginOptions): Promise<void> {
    this.root = await this._createComponentRef(options);
  }

  public callCompilation(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async createAST(): Promise<ts.SourceFile> {
    throw new Error("Method not implemented.");
  }

  private async _createComponentRef(options: ICompChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicComponentChildRef);
    const target = this.components.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.templateName, target.type);
    this._setBaseChildRefInfo(<any>ref, options, value, parent);
    ref["__options"] = options.options;
    for (const iterator of options.components) {
      ref["__refComponents"].push(await this._createComponentRef(iterator, <any>ref));
    }
    for (const iterator of options.directives) {
      ref["__refDirectives"].push(await this._createDirectiveRef(iterator, <any>ref));
    }
    await ref["bootstrap"]();
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private async _createDirectiveRef(options: IDirecChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicDirectiveChildRef);
    const target = this.directives.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.templateName, target.type);
    this._setBaseChildRefInfo(ref, options, value, parent);
    ref["__options"] = options.options;
    await ref["bootstrap"]();
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  private _setBaseChildRefInfo(
    ref: BasicDirectiveChildRef,
    options: IDirecChildRefPluginOptions,
    template: EntityConstructor<any>,
    parent?: IInnerCompnentChildRef,
  ) {
    ref["__refId"] = options.refEntityId;
    ref["__refConstructor"] = template;
    ref["__entityId"] = options.entityName;
    ref["__context"] = this;
    ref["__provider"] = this.provider;
    ref["__injector"] = this.injector;
    if (parent) {
      ref["__parentRef"] = parent;
      ref["__parent"] = parent.__scope;
    }
    return ref;
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
