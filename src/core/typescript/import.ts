import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { StatementDelegate } from "./statement";
import { is } from "../../utils/is";

@Injectable(InjectScope.New)
export class ImportDelegate extends StatementDelegate<ts.ImportDeclaration> {
  protected defaultName: string | undefined = void 0;
  protected namespaceName: string | undefined = void 0;
  protected modulePath = "demo";
  protected namedBinds: Record<string, string | undefined> = {};

  public addNamedBinding(name: string, alias?: string) {
    this.namedBinds[name] = alias;
    return this;
  }

  public removeNamedBinding(name: string, isAlias = false) {
    if (isAlias) {
      const entries = Object.entries(this.namedBinds);
      for (const [n, a] of entries) {
        if (a === name) {
          delete this.namedBinds[n];
          break;
        }
      }
    } else {
      delete this.namedBinds[name];
    }
    return this;
  }

  public setDefaultName(name: string) {
    this.defaultName = name;
    return this;
  }

  public removeDefaultName() {
    this.defaultName = void 0;
    return this;
  }

  public setNamespaceName(name: string) {
    this.namespaceName = name;
    return this;
  }

  public removeNamespaceName() {
    this.namespaceName = void 0;
    return this;
  }

  public setModulePath(modulePath: string) {
    this.modulePath = modulePath;
    return this;
  }

  public emit(): ts.ImportDeclaration {
    let importClause: ts.ImportClause | undefined = void 0;
    if (is.nullOrUndefined(this.namespaceName)) {
      let defaultName: ts.Identifier | undefined = void 0;
      if (!is.nullOrUndefined(this.defaultName)) {
        defaultName = ts.createIdentifier(this.defaultName);
      }
      let nameBindings: ts.NamedImports | undefined = void 0;
      if (Object.keys(this.namedBinds).length > 0) {
        nameBindings = ts.createNamedImports(
          Object.entries(this.namedBinds).map(([n, a]) => createNamedAsImport(a, n)),
        );
      }
      importClause = ts.createImportClause(defaultName, nameBindings);
    } else {
      importClause = ts.createImportClause(void 0, ts.createNamespaceImport(ts.createIdentifier(this.namespaceName)));
    }
    return ts.createImportDeclaration([], [], importClause, ts.createStringLiteral(this.modulePath));
  }
}

function createNamedAsImport(alias: string | undefined, name: string): ts.ImportSpecifier {
  return ts.createImportSpecifier(
    is.nullOrUndefined(alias) ? void 0 : ts.createIdentifier(name),
    ts.createIdentifier(alias || name),
  );
}
