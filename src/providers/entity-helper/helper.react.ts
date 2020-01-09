import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { resolveSyntaxInsert } from "../../core/base";
import { BasicHelper } from "./helper.basic";
import { IJsxAttrs } from "../../utils";
import { is } from "../../utils/is";
import { Injectable } from "../../core/decorators";
import { camelCase, kebabCase } from "lodash";

export interface IFrontLibImportOptions {
  libRoot?: string;
  styleRoot?: string;
  nameCase?: "camel" | "kebab";
  module: string;
  imports: Array<string | [string, string]>;
}

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

  public createReactPropsAccess(
    propName: string,
    options?: Partial<{
      defaultValue: any;
      checkOperatorForDefaultValue: "||" | "??";
    }>,
  ) {
    const { defaultValue, checkOperatorForDefaultValue = "||" } = options || {};
    let expr: ts.Expression = this.createPropertyAccess("props", propName);
    if (!is.undefined(defaultValue)) {
      expr = ts.createBinary(
        expr,
        checkOperatorForDefaultValue === "||" ? ts.SyntaxKind.BarBarToken : ts.SyntaxKind.QuestionQuestionToken,
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

  public createFrontLibImports(options: IFrontLibImportOptions) {
    const { imports = [], module: modulePath, libRoot, styleRoot, nameCase = "kebab" } = options;
    const importList: ts.ImportDeclaration[] = [];
    const nameCaseParser = nameCase === "kebab" ? kebabCase : camelCase;
    for (const iterator of imports) {
      const binding = { name: "", alias: "" };
      if (!libRoot || !styleRoot) continue;
      if (is.array(iterator)) {
        binding.name = iterator[0];
        binding.alias = iterator[1];
      } else {
        binding.name = iterator;
        binding.alias = iterator;
      }
      const pathName = nameCaseParser(binding.name);
      const libPath = [modulePath, libRoot, pathName].join("/");
      const stylePath = [modulePath, styleRoot, pathName].join("/") + ".css";
      importList.push(this.createImport(libPath, binding.name));
      importList.push(this.createImport(stylePath));
    }
    return importList;
  }
}
