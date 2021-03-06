import ts from "typescript";
import isEqual from "lodash/isEqual";
import pick from "lodash/pick";
import { InjectScope, Injector } from "@bonbons/di";
import {
  EntityConstructor,
  ICompositeChildRefPluginOptions,
  ICompositionCreateOptions,
  IDirectiveInputMap,
  IDynamicRefPluginOptions,
  IInnerCompositionChildRef,
  IInnerSolidEntity,
  IPropertyBase,
  ISourceBuildOptions,
  Injectable,
  ReconcilerEngine,
  resolveInputProperties,
  resolveRequire,
} from "../../core";
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
  SourceFileContext,
} from "../../core";
import { NotFoundError } from "../../errors";
import { GlobalMap, IMapEntry } from "../global-map";
import { BasicComponentChildRef, BasicCompositionChildRef, BasicDirectiveChildRef } from "../entities";
import { connectParentChildEntityScope, createEntityId, is } from "../../utils";

interface IContextTreeNode {
  scopeid: string | symbol;
  parentid?: string | symbol;
  container: Partial<IFinalScopedContext>;
  children: IContextTreeNode[];
}

@Injectable(InjectScope.New)
export class SourceFileBasicContext<T extends IBasicEntityProvider> extends SourceFileContext<T> {
  private uniqueList: Record<string, IInnerSolidEntity[]> = {};

  constructor(
    public readonly reconciler: ReconcilerEngine,
    protected readonly injector: Injector,
    private globalMap: GlobalMap,
  ) {
    super();
    this.components = [];
    this.directives = [];
    this.compositions = [];
    this.dependencies = {};
    this.genContext = {
      imports: [],
      variables: [],
      functions: [],
      classes: [],
      statements: [],
    };
    this.astContext = {
      imports: [],
      variables: [],
      functions: [],
      classes: [],
      statements: [],
    };
  }

  public getDefaultEntityId(entity: IInnerSolidEntity): string {
    const keepList = this.uniqueList[entity.__refId];
    if (keepList) {
      const found = keepList.find(i =>
        isEqual(pick(i.__options, ["input", "attach"]), pick(entity.__options, ["input", "attach"])),
      );
      if (found) {
        return found.__entityId;
      }
      keepList.push(entity);
      return entity.__entityId;
    }
    this.uniqueList[entity.__refId] = [entity];
    return entity.__entityId;
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

  public importCompositions(compositions: ICompositionCreateOptions[]) {
    this.compositions.push(...compositions);
    return this;
  }

  public build(options: Partial<ISourceBuildOptions> = {}) {
    this.dependencies = this._resolveDependencies();
    if (!is.nullOrUndefined(options.codeShakes)) {
      this.useCodeShakes = options.codeShakes;
    }
    return this;
  }

  public getDependencies(): Record<string, string> {
    return this.dependencies;
  }

  public createRoot(options: ICompChildRefPluginOptions, slot = "app") {
    this.rootSlot = slot;
    this.root = this.createComponentRef(options);
    const component =
      this.components.find(i => i.importId === options.refEntityId) ??
      this.compositions.find(i => i.importId === options.refEntityId)!;
    const value = this.getEntity(component);
    this._setComponentOrCompositionChildren(options, <any>this.root);
    this._resolveComponentRequires(<any>this.root, value);
    return this;
  }

  public async callCompilation(): Promise<void> {
    await this.root.onInit();
    await this.root.bootstrap();
    this.emitScopedStatements(
      this.createContextTreeNodes(
        Array.from(this.scopedContext.values()),
        this.scopedContext.get(this.root.__entityId)!,
      ),
    );
    this.callStatementsHooks();
  }

  private createContextTreeNodes(
    structures: IScopeStructure<EntityType, Partial<IFinalScopedContext>>[],
    parent: IScopeStructure<EntityType, Partial<IFinalScopedContext>>,
  ): IContextTreeNode {
    const result: IContextTreeNode = {
      scopeid: parent.scope,
      parentid: parent.parent,
      container: parent.container,
      children: [],
    };
    const list = structures.filter(i => i.parent === parent.scope);
    for (const each of list) {
      const found = this.createContextTreeNodes(
        structures.filter(i => i.parent !== parent.scope),
        each,
      );
      if (found) result.children.push(found);
    }
    return result;
  }

  private emitScopedStatements(node: IContextTreeNode) {
    for (const iterator of node.children) {
      this.emitScopedStatements(iterator);
    }
    // 暂时没有控制范围, component / directive
    const { imports = [], functions = [], classes = [], variables = [] } = node.container;
    this.genContext.imports.push(...imports);
    this.genContext.functions.push(...functions);
    this.genContext.classes.push(...classes);
    this.genContext.variables.push(...variables);
  }

  private callStatementsHooks() {
    this.astContext = {
      imports: this.provider.afterImportsCreated(
        this,
        this.provider.beforeImportsCreated(this, this.genContext.imports).map(i => i.emit()),
      ),
      variables: this.provider.afterVariablesCreated(
        this,
        this.provider.beforeVariablesCreated(this, this.genContext.variables).map(i => i.emit()),
      ),
      classes: this.provider.afterClassesCreated(
        this,
        this.provider.beforeClassesCreated(this, this.genContext.classes).map(i => i.emit()),
      ),
      functions: this.provider.afterFunctionsCreated(
        this,
        this.provider.beforeFunctionsCreated(this, this.genContext.functions).map(i => i.emit()),
      ),
      statements: this.provider.afterStatementsCreated(
        this,
        this.provider.beforeStatementsCreated(this, this.genContext.statements).map(i => i.emit()),
      ),
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

  protected createComponentRef(options: IDynamicRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const composition = this.compositions.find(i => i.importId === options.refEntityId)!;
    if (composition) return this.createCompositionRef(options, parent);
    const tOptions: ICompChildRefPluginOptions = <any>options;
    const component = this.components.find(i => i.importId === tOptions.refEntityId)!;
    const ref = this.injector.get(BasicComponentChildRef);
    const value = this.getEntity(component);
    setBaseChildRefInfo(this, <any>ref, tOptions, value, parent);
    if (!!parent) {
      // 非根节点，直接递归
      // 根节点，优先创建
      this._setComponentOrCompositionChildren(tOptions, ref);
      this._resolveComponentRequires(ref, value);
    }
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  protected createDirectiveRef(options: IDirecChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicDirectiveChildRef);
    const target = this.directives.find(i => i.importId === options.refEntityId)!;
    const value = this.getEntity(target);
    setBaseChildRefInfo(this, ref, options, value, parent);
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  protected createCompositionRef(options: ICompositeChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicCompositionChildRef);
    const target = this.compositions.find(i => i.importId === options.refEntityId)!;
    const value = this.getEntity(target);
    setBaseChildRefInfo(this, <any>ref, options, value, parent);
    if (!!parent) {
      this._setComponentOrCompositionChildren(options, ref);
      this._resolveComponentRequires(ref, value);
    }
    return <IInnerCompositionChildRef>(<unknown>ref);
  }

  private getEntity(component: IDirectiveCreateOptions | ICompositionCreateOptions | IComponentCreateOptions): any {
    const { value } = this._resolveMetadataOfEntity(component.moduleName, component.type, component.templateName);
    return value;
  }

  private _setComponentOrCompositionChildren(
    options: ICompChildRefPluginOptions,
    ref: BasicComponentChildRef<any>,
  ): void;
  private _setComponentOrCompositionChildren(
    options: ICompositeChildRefPluginOptions,
    ref: BasicCompositionChildRef<any>,
  ): void;
  private _setComponentOrCompositionChildren(
    options: ICompChildRefPluginOptions | ICompositeChildRefPluginOptions,
    ref: BasicComponentChildRef<any> | BasicCompositionChildRef<any>,
  ) {
    for (const iterator of options.components) {
      (<BasicComponentChildRef<any>>ref)["__refComponents"].push(this.createComponentRef(iterator, <any>ref));
    }
    if ("directives" in options) {
      for (const iterator of options.directives) {
        (<BasicComponentChildRef<any>>ref)["__refDirectives"].push(this.createDirectiveRef(iterator, <any>ref));
      }
    }
  }

  private _resolveComponentRequires(
    ref: BasicComponentChildRef<any> | BasicCompositionChildRef<any>,
    value: EntityConstructor<any>,
  ) {
    if ("__refRequires" in ref) {
      const requires = resolveRequire(value);
      for (const { entity, inputs: params, scopeId } of requires) {
        const inputs = resolveInputProperties(entity);
        const [importId, nameId] = this._checkCreateId(entity, ref["__entityId"], scopeId);
        ref["__refRequires"].push((context: any) =>
          this.createDirectiveRef(
            {
              refEntityId: importId,
              entityName: nameId,
              options: {
                input: resentRequireInputs(params, context, Object.entries(inputs)),
              },
            },
            <any>ref,
          ),
        );
      }
    }
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
    const { metadata: moduleMeta } = this._resolveMetadataOfEntity(target.moduleName, "module");
    const { metadata } = this._resolveMetadataOfEntity(target.moduleName, target.type, target.templateName);
    return {
      ...(<any>moduleMeta.entity).dependencies,
      ...(<any>metadata.entity).dependencies,
    };
  }

  private _checkCreateId(entity: any, parentScope?: string, thisScope?: string | symbol): [string, string] {
    let newId = (thisScope ?? createEntityId()).toString();
    if (!is.nullOrUndefined(parentScope)) {
      newId = connectParentChildEntityScope(parentScope, newId);
    }
    const exist = this.globalMap.getDirectiveByType(entity);
    if (exist) {
      const target = this.directives.find(i => i.moduleName === exist.moduleName && i.templateName === exist.name)!;
      if (target) {
        return [target.importId, newId];
      } else {
        this.directives.push({
          moduleName: exist.moduleName!,
          templateName: exist.name!,
          importId: newId,
          type: "directive",
        });
      }
    }
    return [newId, newId];
  }

  private _resolveMetadataOfEntity(
    moduleName: string,
    type: "component" | "directive" | "composition" | "module",
    templateName?: string,
  ) {
    let target!: IMapEntry<any>;
    if (type === "module") {
      target = this.globalMap.getModule(moduleName);
    } else {
      target = this.globalMap[
        type === "component" ? "getComponent" : type === "composition" ? "getComposition" : "getDirective"
      ](moduleName, templateName!);
    }
    if (!target) {
      throw new NotFoundError(`${type} [${moduleName}${templateName && "."}${templateName}] not found`);
    }
    return target;
  }
}

function resentRequireInputs(
  params: Record<string, unknown>,
  context: any,
  inputs: [string, IPropertyBase][],
): IDirectiveInputMap {
  return Object.entries(params).reduce((p, c) => {
    const found = inputs.find(i => i[1].realName === c[0] || i[0] === c[0]);
    if (!found) return p;
    return {
      ...p,
      [found[0]]: {
        type: "literal",
        expression: typeof c[1] === "function" ? c[1](context) : c[1],
      },
    };
  }, {});
}

export function setBaseChildRefInfo(
  context: SourceFileContext<IBasicEntityProvider>,
  ref: BasicDirectiveChildRef,
  options: IDirecChildRefPluginOptions,
  template: EntityConstructor<any>,
  parent?: IInnerCompnentChildRef,
) {
  ref.setScopeId(options.entityName);
  ref["__refId"] = options.refEntityId;
  ref["__refConstructor"] = template;
  ref["__entityId"] = options.entityName;
  ref["__context"] = context;
  ref["__provider"] = context.provider;
  if (parent) {
    ref.setParentId(parent.__scope);
    ref["__parentRef"] = parent;
  }
  if (context.root) {
    // 暂时不考虑composition
    // TODO: 考虑是否支持composition根节点
    ref["__rootRef"] = <IInnerCompnentChildRef>context.root;
  }
  ref["__options"] = options.options;
  return ref;
}
