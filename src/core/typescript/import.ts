import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { is } from "../../utils";
import { Injectable } from "../decorators";
import { StatementGenerator } from "./statement";

@Injectable(InjectScope.New)
export class ImportGenerator extends StatementGenerator<ts.ImportDeclaration> {
  protected defaultName: string | undefined = void 0;
  protected namespaceName: string | undefined = void 0;
  protected modulePath = "demo";
  protected namedBinds: Record<string, string[]> = {};

  public addNamedBinding(name: string, alias?: string) {
    const exist = this.namedBinds[name];
    if (is.nullOrUndefined(exist)) {
      this.namedBinds[name] = is.nullOrUndefined(alias) ? [] : [alias];
    } else if (!is.nullOrUndefined(alias)) {
      exist.push(...[alias].filter(e => exist.findIndex(i => i === e) < 0));
    }
    return this;
  }

  public removeNamedBinding(name: string, isAlias = false) {
    if (isAlias) {
      const entries = Object.entries(this.namedBinds);
      for (const [n, a] of entries) {
        if (a.findIndex(i => i === name)) {
          this.namedBinds[n] = this.namedBinds[n].filter(i => i !== name);
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

  protected create(): ts.ImportDeclaration {
    let importClause: ts.ImportClause | undefined = void 0;
    if (is.nullOrUndefined(this.namespaceName)) {
      let defaultName: ts.Identifier | undefined = void 0;
      if (!is.nullOrUndefined(this.defaultName)) {
        defaultName = ts.createIdentifier(this.defaultName);
      }
      let nameBindings: ts.NamedImports | undefined = void 0;
      if (Object.keys(this.namedBinds).length > 0) {
        nameBindings = ts.createNamedImports(
          Object.entries(this.namedBinds)
            .map(([n, a]) => createNamedAsImport(a, n))
            .reduce((p, c) => [...p, ...c], []),
        );
      }
      importClause =
        Object.keys(this.namedBinds).length === 0 && is.nullOrUndefined(this.defaultName)
          ? void 0
          : ts.createImportClause(defaultName, nameBindings);
    } else {
      importClause = ts.createImportClause(void 0, ts.createNamespaceImport(ts.createIdentifier(this.namespaceName)));
    }
    return ts.createImportDeclaration([], [], importClause, ts.createStringLiteral(this.modulePath));
  }
}

function createNamedAsImport(alias: string[], name: string): ts.ImportSpecifier[] {
  return alias.map(a =>
    ts.createImportSpecifier(
      is.nullOrUndefined(alias) ? void 0 : ts.createIdentifier(name),
      ts.createIdentifier(a || name),
    ),
  );
}
