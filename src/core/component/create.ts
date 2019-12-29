import ts from "typescript";
import { InjectDIToken } from "@bonbons/di";
import { IFrameworkDepts, resolveInputProperties } from "../../decorators";
import {
  IBasicCompilationContext,
  IBasicCompilationFinalContext,
  BasicCompilationEntity
} from "../base";
import { BasicComponent } from "./basic";
import { REACT, createExportModifier, exists } from "../../utils";
import { InvalidOperationError } from "../../errors";

export interface IComponentPluginOptions<T extends InjectDIToken<any>>
  extends IDirectivePluginOptions<T> {
  provider: keyof IFrameworkDepts;
  components?: IComponentPluginOptions<any>[];
  directives?: IDirectivePluginOptions<any>[];
}

export interface IDirectivePluginOptions<T extends InjectDIToken<any>> {
  provider: keyof IFrameworkDepts;
  template: T;
  options?: { [prop: string]: any };
}

export interface IInstanceCreateOptions<T extends InjectDIToken<any>>
  extends IComponentPluginOptions<T> {
  passContext?: IBasicCompilationContext;
}

export function createTemplateInstance<T extends typeof BasicComponent>({
  template,
  options = {},
  components = [],
  directives = [],
  passContext
}: IInstanceCreateOptions<T>) {
  const context: IBasicCompilationContext = passContext || {
    extendParent: new Map(),
    implementParents: new Map(),
    fields: new Map(),
    properties: new Map(),
    methods: new Map(),
    imports: new Map()
  };
  const model = initPropsContextIst(template, options, context);
  for (const iterator of components) {
    model["__children"].push(
      createTemplateInstance({
        provider: iterator.provider,
        template: iterator.template,
        options: iterator.options,
        components: iterator.components,
        directives: iterator.directives,
        passContext: context
      })
    );
  }
  for (const iterator of directives) {
    model["__directives"].push(
      initPropsContextIst(iterator.template, iterator.options || {}, context)
    );
  }
  return model;
}

export async function callCompilation(
  provider: keyof IFrameworkDepts,
  model: BasicComponent,
  name: string,
  unExport = false
) {
  await model["onInit"]();
  await model["onPreRender"]();
  await model["onRender"]();
  await model["onPostRender"]();
  const _context = model["__context"];
  const context: IBasicCompilationFinalContext = {
    extendParent: null,
    implementParents: [],
    fields: [],
    properties: [],
    methods: [],
    imports: []
  };
  for (const key in _context) {
    if (_context.hasOwnProperty(key)) {
      const item = _context[<keyof typeof _context>key];
      const scopesArr = Array.from(
        <IterableIterator<string | symbol>>item.keys()
      );
      for (const scope of scopesArr) {
        const value = item.get(scope);
        if (key === "extendParent") {
          context[key] = <any>value;
        } else {
          (<any>context)[key].push(...(<any[]>value));
        }
      }
    }
  }
  // 合并imports
  const importSpecs: ts.ImportDeclaration[] = [];
  if (provider === "react") {
    importSpecs.unshift(
      ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(ts.createIdentifier(REACT.NS), undefined),
        ts.createStringLiteral("react")
      )
    );
  }
  context.imports.forEach(importDec =>
    updateImportDeclarations(importSpecs, [importDec])
  );
  const classDec = ts.createClassDeclaration(
    [],
    createExportModifier(!unExport),
    ts.createIdentifier(name),
    [],
    exists([context.extendParent!, ...context.implementParents]),
    exists([...context.fields, ...context.properties, ...context.methods])
  );
  const sourceFile = ts.createSourceFile(
    "temp.tsx",
    "",
    ts.ScriptTarget.ES2017,
    undefined,
    ts.ScriptKind.TSX
  );
  return ts.updateSourceFileNode(
    sourceFile,
    [...importSpecs, classDec],
    sourceFile.isDeclarationFile,
    sourceFile.referencedFiles,
    sourceFile.typeReferenceDirectives,
    sourceFile.hasNoDefaultLib,
    sourceFile.libReferenceDirectives
  );
}

function initPropsContextIst<T extends BasicCompilationEntity>(
  template: InjectDIToken<T>,
  options: { [prop: string]: any },
  context: IBasicCompilationContext
): T {
  const model = inputProperties(new (<any>template)(), options);
  Object.defineProperty(model, "__context", {
    enumerable: true,
    configurable: false,
    get() {
      return context;
    }
  });
  return model;
}

function inputProperties<T extends any>(model: T, options: any): T {
  const props = resolveInputProperties(
    Object.getPrototypeOf(model).constructor
  );
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const prop = props[key];
      const group = prop.group;
      if (
        group &&
        options.hasOwnProperty(group) &&
        options[group].hasOwnProperty(prop.name.value!)
      ) {
        (<any>model)[prop.realName] = options[group][prop.name.value!];
      } else if (options.hasOwnProperty(prop.name!)) {
        (<any>model)[prop.realName] = options[prop.name.value!];
      }
    }
  }
  return model;
}

function updateImportDeclarations(
  imports: ts.ImportDeclaration[],
  statements: ts.ImportDeclaration[]
) {
  for (const statement of statements) {
    if (ts.isImportDeclaration(statement)) {
      const { importClause, moduleSpecifier } = statement;
      if (!importClause) continue;
      if (!ts.isStringLiteral(moduleSpecifier)) continue;
      const existIndex = imports.findIndex(
        i =>
          i.importClause &&
          i.moduleSpecifier &&
          ts.isStringLiteral(i.moduleSpecifier) &&
          i.moduleSpecifier.text === moduleSpecifier.text
      );
      if (existIndex < 0) {
        imports.push(statement);
      } else {
        const sourceItem = imports[existIndex];
        const { importClause: clause01 } = sourceItem;
        const { importClause: clause02 } = statement;
        if (clause01!.namedBindings) {
          if (ts.isNamedImports(clause01!.namedBindings)) {
            if (
              clause02!.namedBindings &&
              ts.isNamedImports(clause02!.namedBindings!)
            ) {
              const named01 = clause01!.namedBindings as ts.NamedImports;
              const named02 = clause02!.namedBindings as ts.NamedImports;
              const addto: ts.ImportSpecifier[] = [];
              for (const element of named02.elements) {
                const target = named01.elements.find(
                  i => i.name.text === element.name.text
                );
                if (!target) {
                  addto.push(element);
                }
              }
              named01.elements = ts.createNodeArray(
                [...named01.elements].concat(addto)
              );
            } else {
              imports.push(statement);
            }
          } else if (ts.isNamespaceImport(clause01!.namedBindings!)) {
            if (
              clause02!.namedBindings &&
              ts.isNamespaceImport(clause02!.namedBindings!) &&
              clause02!.namedBindings!.name.text !==
                clause02!.namedBindings!.name.text
            ) {
              throw new InvalidOperationError(
                "import update failed: duplicate namespace import exist"
              );
            } else {
              imports.push(statement);
            }
          }
        } else {
          // source is default import
          if (
            !clause02!.namedBindings &&
            clause02!.name!.text !== clause02!.name!.text
          ) {
            throw new InvalidOperationError(
              `import update failed: duplicate default import exist - [${
                clause02!.name!.text
              }]`
            );
          } else {
            imports.push(statement);
          }
        }
      }
    }
  }
}
