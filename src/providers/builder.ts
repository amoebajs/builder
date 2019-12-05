import ts from "typescript";
import { Builder, IPageCreateOptions } from "../contracts";
import {
  createReactSourceFile,
  emitSourceFileSync,
  createReactMainFile,
  createSelectPage
} from "../utils";

export interface IModuleCreateOptions<T> {
  module: string;
  name: string;
  component: string;
  options?: any;
  post?: Array<T>;
}

export class BuilderProvider extends Builder {
  protected createModuleStatements({
    module: MODULE,
    name: PAGE,
    component: NAME,
    post: POST,
    options: OPTS
  }: IModuleCreateOptions<{ module: string; name: string; args?: any }>) {
    const page = this.globalMap.getPage(MODULE, PAGE);
    if (!page) {
      throw new Error("page template not found");
    }
    const imports: ts.ImportDeclaration[] = [];
    function onUpdate(statements: ts.ImportDeclaration[]) {
      updateImportDeclarations(imports, statements);
    }
    const processors = (POST || []).map(({ module: md, name, args }) => [
      this.globalMap.getPipe(md, name).value,
      args
    ]);
    const root = createSelectPage(
      NAME,
      page.value,
      OPTS || {},
      processors,
      onUpdate,
      true
    );
    return [...imports, root];
  }

  public async createSource(
    outDir: string,
    fileName: string,
    configs: IPageCreateOptions
  ): Promise<void> {
    const compName = "App";
    await emitSourceFileSync({
      folder: outDir,
      filename: fileName + ".tsx",
      statements: createReactSourceFile(
        this.createModuleStatements({
          module: configs.page.module,
          name: configs.page.name,
          component: compName,
          options: configs.page.options || {},
          post: configs.page.post || []
        })
      )
    });
    await emitSourceFileSync({
      folder: outDir,
      filename: "main.tsx",
      statements: createReactMainFile(compName, fileName)
    });
  }
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
