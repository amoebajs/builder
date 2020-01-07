import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Primitive } from "utility-types";
import { resolveSyntaxInsert } from "../../core/base";
import { BasicHelper } from "./helper.basic";
import { IJsxAttrs } from "../../utils";
import { is } from "../../utils/is";
import { Injectable } from "../../core/decorators";

@Injectable(InjectScope.Singleton)
export class ReactHelper extends BasicHelper {
  public createObjectAttr(value: { [prop: string]: number | string | boolean | ts.Expression }) {
    const kvs: [string, string | number | boolean | ts.Expression][] = Object.keys(value).map(k => [k, value[k]]);
    return ts.createObjectLiteral(
      kvs.map(([n, v]) =>
        ts.createPropertyAssignment(
          ts.createIdentifier(n),
          resolveSyntaxInsert(typeof v, v, (_, e) => e),
        ),
      ),
      true,
    );
  }

  public createObjectLiteral(object: Record<string, unknown>) {
    const keys = Object.keys(object);
    const properties = keys.map(key => {
      const value = object[key];
      let expr: ts.Expression;
      if (is.stringOrNumberOrBoolean(value)) {
        expr = resolveSyntaxInsert(typeof value, value);
      } else if (is.array(value)) {
        expr = this.createArrayLiteral(value);
      } else {
        expr = this.createObjectLiteral(value as Record<string, Primitive>);
      }
      const property = ts.createPropertyAssignment(key, expr);
      return property;
    });
    const literal = ts.createObjectLiteral(properties, true);
    return literal;
  }

  public createArrayLiteral(array: unknown[]) {
    const elements = array.map(item => {
      let expr: ts.Expression;
      if (is.stringOrNumberOrBoolean(item)) {
        expr = resolveSyntaxInsert(typeof item, item);
      } else if (is.array(item)) {
        expr = this.createArrayLiteral(item);
      } else {
        expr = this.createObjectLiteral(item as Record<string, Primitive>);
      }
      return expr;
    });
    const literal = ts.createArrayLiteral(elements, true);
    return literal;
  }

  /**
   * @param chain property access chain e.g. userInfo.name
   */
  public createPropertyAccess(chain: string) {
    const identifiers = chain.split(".");
    let propertyAccess: ts.Expression = ts.createIdentifier(identifiers[0]);
    const len = identifiers.length;
    let i = 1;
    while (i < len) {
      propertyAccess = ts.createPropertyAccess(propertyAccess, ts.createIdentifier(identifiers[i]));
      i++;
    }
    return propertyAccess;
  }

  /**
   * @param chain property access chain e.g. userInfo.name
   * @param params default is []
   */
  public createMethodCall(chain: string | ts.Expression, params?: ts.Expression[]) {
    const propertyAccess = is.string(chain) ? this.createPropertyAccess(chain) : chain;
    return this.createFunctionCall(propertyAccess, params);
  }

  /**
   * @param name name of function or ts.Expression
   * @param params default is []
   */
  public createFunctionCall(name: string | ts.Expression, params: ts.Expression[] = []) {
    return ts.createCall(is.string(name) ? ts.createIdentifier(name) : name, undefined, params);
  }

  public createJsxElement(
    tagName: string,
    types: ts.TypeNode[],
    attrs: IJsxAttrs,
    children?: (ts.JsxChild | string)[],
  ) {
    return ts.createJsxElement(
      ts.createJsxOpeningElement(
        ts.createIdentifier(tagName),
        types,
        ts.createJsxAttributes(
          Object.keys(attrs)
            .filter(k => attrs.hasOwnProperty(k))
            .map(k =>
              ts.createJsxAttribute(
                ts.createIdentifier(k),
                typeof attrs[k] === "string"
                  ? ts.createStringLiteral(<string>attrs[k])
                  : ts.createJsxExpression(
                      undefined,
                      resolveSyntaxInsert(typeof attrs[k], attrs[k], (t, e) => e),
                    ),
              ),
            ),
        ),
      ),
      (children || []).map(i => (typeof i === "string" ? ts.createJsxText(i) : i)),
      ts.createJsxClosingElement(ts.createIdentifier(tagName)),
    );
  }

  public resolvePropState(expression: string): ts.PropertyAccessExpression;
  public resolvePropState(expression: string, type: "props" | "state"): ts.PropertyAccessExpression;
  public resolvePropState(
    expression: string,
    options: Partial<{
      type: "props" | "state";
      defaultValue: any;
      defaultCheck: "||" | "??";
    }>,
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
    let expr: ts.Expression = ts.createPropertyAccess(ts.createThis(), type + "." + expression.toString());
    if (defaultValue !== null) {
      expr = ts.createBinary(
        expr,
        defaultCheck === "||" ? ts.SyntaxKind.BarBarToken : ts.SyntaxKind.QuestionQuestionToken,
        resolveSyntaxInsert(typeof defaultValue, defaultValue, (_, __) =>
          is.array(defaultValue) ? this.createArrayLiteral(defaultValue) : this.createObjectLiteral(defaultValue),
        ),
      );
    }
    return expr;
  }

  public createImport(modulePath: string, names: Array<string | [string, string]> | string = []) {
    const ref = ts.createStringLiteral(modulePath);
    if (typeof names === "string") {
      return ts.createImportDeclaration([], [], ts.createImportClause(ts.createIdentifier(names), undefined), ref);
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
                ts.createIdentifier(Array.isArray(s) ? s[1] : s),
              ),
            ),
          ),
        ),
        ref,
      );
    }
  }
}
