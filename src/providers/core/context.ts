import ts from "typescript";
import { InjectScope, Injector } from "@bonbons/di";
import { BasicComponentChildRef, BasicDirectiveChildRef, GlobalMap } from "../../providers";
import { EntityConstructor, Injectable } from "../../core/decorators";
import {
  EntityType,
  IBasicEntityProvider,
  ICompChildRefPluginOptions,
  IComponentCreateOptions,
  IDirecChildRefPluginOptions,
  IDirectiveCreateOptions,
  IFinalScopedContext,
  IInnerCompnentChildRef,
  IInnerDirectiveChildRef,
  IScopeStructure,
  IScopedContext,
  SourceFileContext,
} from "../../core";
import { NotFoundError } from "../../errors";

interface IContextTreeNode {
  scopeid: string | symbol;
  parentid?: string | symbol;
  container: Partial<IFinalScopedContext>;
  children: IContextTreeNode[];
}

@Injectable(InjectScope.New)
export class SourceFileBasicContext<T extends IBasicEntityProvider> extends SourceFileContext<T> {
  constructor(protected injector: Injector, private globalMap: GlobalMap) {
    super();
    this.components = [];
    this.directives = [];
    this.dependencies = {};
    this.astContext = {
      imports: [],
      variables: [],
      functions: [],
      classes: [],
      statements: [],
    };
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

  public async callCompilation(): Promise<void> {
    await this.root.onInit();
    await this.root.bootstrap();
    const entries = Array.from(this.scopedContext.entries());
    this.setSourcenamespace(
      this.findAndSetChildrenContext(
        entries.map<IContextTreeNode>(([id, scope]) => ({
          scopeid: id,
          parentid: scope.parent,
          container: scope.container,
          children: [],
        })),
        void 0,
      )!,
    );
    this.callStatementsHooks();
  }

  private findAndSetChildrenContext(structures: IContextTreeNode[], parentid: string | symbol | undefined) {
    const target = structures.find(i => i.parentid === parentid);
    if (target) {
      this.findAndSetChildrenContext(structures, target.scopeid);
      target.children = structures.filter(i => i.parentid === target.scopeid);
    }
    return target;
  }

  private setSourcenamespace(node: IContextTreeNode) {
    for (const iterator of node.children) {
      this.setSourcenamespace(iterator);
    }
    // 暂时没有控制范围
    const { imports = [], functions = [], classes = [], variables = [] } = node.container;
    this.astContext.imports.push(...imports.map(i => i.emit()));
    this.astContext.functions.push(...functions.map(i => i.emit()));
    this.astContext.classes.push(...classes.map(i => i.emit()));
    this.astContext.variables.push(...variables.map(i => i.emit()));
  }

  private callStatementsHooks() {
    this.astContext = {
      imports: this.provider.afterImportsCreated(this, this.astContext.imports),
      variables: this.provider.afterVariablesCreated(this, this.astContext.variables),
      classes: this.provider.afterClassesCreated(this, this.astContext.classes),
      functions: this.provider.afterFunctionsCreated(this, this.astContext.functions),
      statements: this.provider.afterAllCreated(this, []),
    };
  }

  public async createSourceFile(): Promise<ts.SourceFile> {
    const sourceFile = ts.createSourceFile("demo.tsx", "", ts.ScriptTarget.ES2017);
    const { imports, functions, variables, classes, statements } = this.astContext;
    return ts.updateSourceFileNode(
      sourceFile,
      [...imports, ...variables, ...classes, ...functions, ...statements],
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives,
    );
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
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private async _createDirectiveRef(options: IDirecChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicDirectiveChildRef);
    const target = this.directives.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.templateName, target.type);
    this._setBaseChildRefInfo(ref, options, value, parent);
    ref["__options"] = options.options;
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  private _setBaseChildRefInfo(
    ref: BasicDirectiveChildRef,
    options: IDirecChildRefPluginOptions,
    template: EntityConstructor<any>,
    parent?: IInnerCompnentChildRef,
  ) {
    ref.setEntityId(options.entityName);
    ref["__refId"] = options.refEntityId;
    ref["__refConstructor"] = template;
    ref["__entityId"] = options.entityName;
    ref["__context"] = this;
    ref["__provider"] = this.provider;
    if (parent) {
      ref.setParentId(parent.__scope);
      ref["__parentRef"] = parent;
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
