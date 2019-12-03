import ts from "typescript";
import { Constructor, resolveModule, resolvePage } from "../decorators";
import {
  createSelectPage as createRootComponent,
  ProcessorType
} from "../utils";

interface IEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
}

const GlobalMaps = {
  modules: <{ [key: string]: IEntry }>{},
  pages: <{ [key: string]: IEntry }>{}
};

export function useModule(module: Constructor<any>) {
  const metadata = resolveModule(module);
  const moduleName = metadata.name || "[unnamed]";
  GlobalMaps.modules[moduleName] = {
    name: moduleName,
    displayName: metadata.displayName || moduleName,
    value: module
  };
  if (metadata.pages) {
    metadata.pages.forEach(i => {
      const meta = resolvePage(i);
      const pageName = meta.name || "[unnamed]";
      GlobalMaps.pages[`${moduleName}@${pageName}`] = {
        name: pageName,
        displayName: meta.displayName || pageName,
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
  name: string;
  page: string;
  options?: any;
  post?: Array<T>;
}

export function createModuleStatements<T extends ProcessorType>({
  page: PAGE,
  name: NAME,
  post: POST,
  options: OPTS
}: IModuleCreateOptions<T>) {
  const page = GlobalMaps.pages[PAGE];
  if (!page) {
    throw new Error("page template not found");
  }
  const imports: ts.ImportDeclaration[] = [];
  function onUpdate(statements: ts.ImportDeclaration[]) {
    updateImportDeclarations(imports, statements);
  }
  const processors = POST || [];
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
