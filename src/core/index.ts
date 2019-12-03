import ts from "typescript";
import {
  Constructor,
  resolveModule,
  resolvePage,
  resolvePipe
} from "../decorators";
import { createSelectPage as createRootComponent } from "../utils";

interface IEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
  pages: { [name: string]: any };
  pipes: { [name: string]: any };
}

const GlobalMaps = {
  modules: <{ [key: string]: IEntry }>{},
  pages: <{ [key: string]: IEntry }>{},
  pipes: <{ [key: string]: IEntry }>{}
};

export function useModule(module: Constructor<any>) {
  const metadata = resolveModule(module);
  const moduleName = metadata.name || "[unnamed]";
  const thisModule: IEntry<any> = (GlobalMaps.modules[moduleName] = {
    name: moduleName,
    displayName: metadata.displayName || moduleName,
    value: module,
    pages: {},
    pipes: {}
  });
  if (metadata.pages) {
    metadata.pages.forEach(i => {
      const meta = resolvePage(i);
      const pageName = meta.name || "[unnamed]";
      thisModule.pages[pageName] = {
        name: pageName,
        displayName: meta.displayName || pageName,
        moduleName,
        value: i
      };
    });
  }
  if (metadata.pipes) {
    metadata.pipes.forEach(i => {
      const meta = resolvePipe(i);
      const pipeName = meta.name || "[unnamed]";
      thisModule.pipes[pipeName] = {
        name: pipeName,
        displayName: meta.displayName || pipeName,
        moduleName,
        value: i
      };
    });
  }
  // console.log(GlobalMaps);
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
              throw new Error(
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
            throw new Error(
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

export interface IModuleCreateOptions<T> {
  module: string;
  name: string;
  component: string;
  options?: any;
  post?: Array<T>;
}

export function createModuleStatements({
  module: MODULE,
  name: PAGE,
  component: NAME,
  post: POST,
  options: OPTS
}: IModuleCreateOptions<{ module: string; name: string; args?: any }>) {
  const page = GlobalMaps.modules[MODULE].pages[PAGE];
  if (!page) {
    throw new Error("page template not found");
  }
  const imports: ts.ImportDeclaration[] = [];
  function onUpdate(statements: ts.ImportDeclaration[]) {
    updateImportDeclarations(imports, statements);
  }
  const processors = (POST || []).map(({ module: md, name, args }) => [
    GlobalMaps.modules[md].pipes[name].value,
    args
  ]);
  const root = createRootComponent(
    NAME,
    page.value,
    OPTS || {},
    processors,
    onUpdate,
    true
  );
  return [...imports, root];
}
