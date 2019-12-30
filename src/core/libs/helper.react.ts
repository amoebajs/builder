import ts from "typescript";
import { resolveSyntaxInsert, ReactVbRef, PropertyRef } from "../base";
import { BasicHelper } from "./helper.basic";
import { IJsxAttrs } from "../../utils";

export class ReactHelper extends BasicHelper {
  public getRef(name: string): ReactVbRef | null;
  public getRef(name: string): PropertyRef | null;
  public getRef(name: string) {
    const ref = super.getRef(name);
    if (ref instanceof ReactVbRef) {
      return ref;
    }
    return null;
  }

  public resolveRef(name: string): ts.Expression | null {
    const ref = this.getRef(name);
    if (ref) {
      if (ref.type === "props") {
        return ts.createPropertyAccess(ts.createThis(), ref["expression"]);
      }
    }
    return super.resolveRef(name);
  }

  public resolveJsxAttrs(attrs: {
    [name: string]: string | ts.Expression | null;
  }): IJsxAttrs {
    return Object.keys(attrs)
      .filter(i => attrs.hasOwnProperty(i))
      .map(k => ({
        [k]:
          typeof attrs[k] === "string"
            ? <string>attrs[k]
            : ts.createJsxExpression(undefined, <any>attrs[k]!)
      }))
      .reduce((p, c) => ({ ...p, ...c }), {});
  }

  public resolvePropState(expression: string): ts.PropertyAccessExpression;
  public resolvePropState(
    expression: string,
    type: "props" | "state"
  ): ts.PropertyAccessExpression;
  public resolvePropState(
    expression: string,
    options: Partial<{
      type: "props" | "state";
      defaultValue: any;
      defaultCheck: "||" | "??";
    }>
  ): ts.PropertyAccessExpression;
  public resolvePropState(expression: string, sec?: any) {
    let type: "props" | "state" = "props";
    let defaultCheck: "||" | "??" = "||";
    let defaultValue: any = null;
    if (typeof sec === "string") type = <any>sec;
    if (typeof sec === "object") {
      if (sec.type) type = sec.type;
      if (sec.defaultCheck) defaultCheck = sec.defaultCheck;
      if (sec.defaultValue !== null && sec.defaultValue !== void 0) {
        defaultValue = sec.defaultValue;
      }
    }
    let expr: ts.Expression = ts.createPropertyAccess(
      ts.createThis(),
      type + "." + expression.toString()
    );
    if (defaultValue !== null) {
      expr = ts.createBinary(
        expr,
        defaultCheck === "||"
          ? ts.SyntaxKind.BarBarToken
          : ts.SyntaxKind.QuestionQuestionToken,
        resolveSyntaxInsert(typeof defaultValue, defaultValue, (_, v) =>
          ts.createStringLiteral(String(defaultValue))
        )
      );
    }
    return expr;
  }

  public createImport(
    modulePath: string,
    names: Array<string | [string, string]> | string = []
  ) {
    const ref = ts.createStringLiteral(modulePath);
    if (typeof names === "string") {
      return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(ts.createIdentifier(names), undefined),
        ref
      );
    } else if (names.length === 0) {
      return ts.createImportDeclaration([], [], undefined, ref);
    } else {
      return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(
          undefined,
          ts.createNamedImports(
            names.map(s =>
              ts.createImportSpecifier(
                Array.isArray(s) ? ts.createIdentifier(s[0]) : undefined,
                ts.createIdentifier(Array.isArray(s) ? s[1] : s)
              )
            )
          )
        ),
        ref
      );
    }
  }
}
