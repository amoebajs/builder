import ts from "typescript";
import isEqual from "lodash/isEqual";
import pick from "lodash/pick";
import { InjectScope, Injector } from "@bonbons/di";
import {
  EntityConstructor,
  Injectable,
  IDynamicRefPluginOptions,
  ICompositeChildRefPluginOptions,
  ReconcilerEngine,
  ICompositionCreateOptions,
  IInnerCompositionChildRef,
  ISourceBuildOptions,
  IInnerSolidEntity,
  resolveRequire,
  IDirectiveInputMap,
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
import { BasicComponentChildRef, BasicDirectiveChildRef, BasicCompositionChildRef } from "../entities";
import { is, createEntityId } from "../../utils";

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

  protected createComponentRef(options: IDynamicRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const composition = this.compositions.find(i => i.importId === options.refEntityId)!;
    if (composition) return this.createCompositionRef(options, parent);
    const tOptions: ICompChildRefPluginOptions = <any>options;
    const component = this.components.find(i => i.importId === tOptions.refEntityId)!;
    const ref = this.injector.get(BasicComponentChildRef);
    const { value } = this._resolveMetadataOfEntity(component.moduleName, component.type, component.templateName);
    setBaseChildRefInfo(this, <any>ref, tOptions, value, parent);
    for (const iterator of tOptions.components) {
      ref["__refComponents"].push(this.createComponentRef(iterator, <any>ref));
    }
    for (const iterator of tOptions.directives) {
      ref["__refDirectives"].push(this.createDirectiveRef(iterator, <any>ref));
    }
    const requires = resolveRequire(value);
    for (const { entity, inputs } of requires) {
      const [importId, nameId] = this._checkCreateId(entity);
      ref["__refRequires"].push((context: any) =>
        this.createDirectiveRef(
          {
            refEntityId: importId,
            entityName: nameId,
            options: {
              input: resentRequireInputs(inputs, context),
            },
          },
          <any>ref,
        ),
      );
    }
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  protected createDirectiveRef(options: IDirecChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicDirectiveChildRef);
    const target = this.directives.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.type, target.templateName);
    setBaseChildRefInfo(this, ref, options, value, parent);
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  protected createCompositionRef(options: ICompositeChildRefPluginOptions, parent?: IInnerCompnentChildRef) {
    const ref = this.injector.get(BasicCompositionChildRef);
    const target = this.compositions.find(i => i.importId === options.refEntityId)!;
    const { value } = this._resolveMetadataOfEntity(target.moduleName, target.type, target.templateName);
    setBaseChildRefInfo(this, <any>ref, options, value, parent);
    for (const iterator of options.components) {
      ref["__refComponents"].push(this.createComponentRef(iterator, <any>ref));
    }
    return <IInnerCompositionChildRef>(<unknown>ref);
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

  private _checkCreateId(entity: any): [string, string] {
    const newId = createEntityId();
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

export function resentRequireInputs(inputs: Record<string, unknown>, context: any): IDirectiveInputMap {
  return Object.entries(inputs).reduce(
    (p, c) => ({
      ...p,
      [c[0]]: {
        type: "literal",
        expression: typeof c[1] === "function" ? c[1](context) : c[1],
      },
    }),
    {},
  );
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
  ref["__options"] = options.options;
  return ref;
}
