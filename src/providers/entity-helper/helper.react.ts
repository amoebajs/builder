import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { is } from "#utils/is";
import { ImportGenerator, Injectable, JsxElementGenerator, resolveSyntaxInsert } from "#core";
import { camelCase, kebabCase } from "lodash";
import { IJsxAttrDefine } from "#core/typescript/jsx-attribute";
import { IJsxElementDefine } from "#core/typescript/jsx-element";
import { IJsxAttrs } from "../../utils";
import { BasicHelper } from "./helper.basic";

export interface IFrontLibImports {
  default?: string;
  named: Array<string | [string, string]>;
}

export interface IFrontLibImportOptions {
  libRoot: string;
  styleRoot: string;
  module: string;
  libName?: string;
  imports: Array<string | [string, string]> | IFrontLibImports;
  nameCase?: "camel" | "kebab";
}

@Injectable(InjectScope.Singleton)
export class ReactHelper extends BasicHelper {
  public createObjectAttr(value: Record<string, number | string | boolean | ts.Expression>) {
    return ts.createObjectLiteral(
      Object.entries(value)
        .filter(i => i[1] !== void 0)
        .map(([n, v]) =>
          ts.createPropertyAssignment(
            ts.createIdentifier(n),
            resolveSyntaxInsert(typeof v, v, (_, e) => e),
          ),
        ),
      true,
    );
  }

  public createViewElement(
    tagnname: string,
    attrs: Record<string, IJsxAttrDefine> = {},
    children: IJsxElementDefine[] = [],
  ) {
    return this.injector
      .get(JsxElementGenerator)
      .setTagName(tagnname)
      .addJsxAttrs(attrs)
      .addJsxChildren(children);
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
          Object.entries(attrs)
            .filter(([k]) => attrs.hasOwnProperty(k))
            .map(([key, value]) =>
              ts.createJsxAttribute(
                ts.createIdentifier(key),
                ts.createJsxExpression(
                  undefined,
                  is.stringOrNumberOrBoolean(value) ? this.createLiteral(value) : value,
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
        resolveSyntaxInsert(typeof defaultValue, defaultValue, (_, __) => this.createLiteral(defaultValue)),
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
        resolveSyntaxInsert(typeof defaultValue, defaultValue, (_, __) => this.createLiteral(defaultValue)),
      );
    }
    return expr;
  }

  public createReactPropsMixinAccess(propName: string, obj: Record<string, string | number | boolean | ts.Expression>) {
    const access = this.createPropertyAccess("props", propName);
    const objExp = this.createObjectAttr(obj);
    return ts.createObjectLiteral([ts.createSpreadAssignment(access), ...objExp.properties]);
  }

  public createFunctionCall(name: string, parameters: (string | ts.Expression)[]) {
    return ts.createCall(
      ts.createIdentifier(name),
      undefined,
      parameters.map(param => (is.string(param) ? ts.createIdentifier(param) : param)),
    );
  }

  public updateJsxElementAttr(gen: JsxElementGenerator, name: string, value: ts.StringLiteral | ts.JsxExpression) {
    gen.pushTransformerBeforeEmit(element => updateJsxElementAttr(element, name, value));
  }

  public createFrontLibImports(options: IFrontLibImportOptions) {
    const { imports = [], module: modulePath, libRoot, libName, styleRoot, nameCase = "kebab" } = options;
    const importList: ImportGenerator[] = [];
    const nameCaseParser = nameCase === "kebab" ? kebabCase : camelCase;
    if (is.array(imports)) {
      for (const iterator of imports) {
        const binding = { name: "", alias: "" };
        if (is.array(iterator)) {
          binding.name = iterator[0];
          binding.alias = iterator[1];
        } else {
          binding.name = iterator;
          binding.alias = iterator;
        }
        const pathName = nameCaseParser(libName || binding.name);
        const libPath = [modulePath, libRoot, pathName].join("/");
        const stylePath = [modulePath, styleRoot, pathName].join("/") + ".css";
        importList.push(this.createImport(libPath, binding.alias));
        importList.push(this.createImport(stylePath));
      }
    } else {
      const pathName = nameCaseParser(libName || imports.default);
      const libPath = [modulePath, libRoot, pathName].join("/");
      const stylePath = [modulePath, styleRoot, pathName].join("/") + ".css";
      importList.push(this.createImport(libPath, imports.default, imports.named));
      importList.push(this.createImport(stylePath));
    }
    return importList;
  }
}

export function updateJsxElementAttr(
  element: ts.JsxSelfClosingElement | ts.JsxElement,
  name: string,
  value: ts.StringLiteral | ts.JsxExpression,
) {
  if (ts.isJsxSelfClosingElement(element)) {
    return updateSelfCloseingJsxElementAttr(element, name, value);
  } else {
    return updateOpenedJsxElementAttr(element, name, value);
  }
}

function updateSelfCloseingJsxElementAttr(
  element: ts.JsxSelfClosingElement,
  name: string,
  value: ts.StringLiteral | ts.JsxExpression,
) {
  const openEle = element;
  const props = openEle.attributes.properties.filter(i => i.name && ts.isIdentifier(i.name) && i.name.text !== name);
  const newAttrs = ts.updateJsxAttributes(openEle.attributes, [
    ...props,
    ts.createJsxAttribute(ts.createIdentifier(name), value),
  ]);
  return ts.updateJsxSelfClosingElement(openEle, openEle.tagName, openEle.typeArguments, newAttrs);
}

function updateOpenedJsxElementAttr(element: ts.JsxElement, name: string, value: ts.StringLiteral | ts.JsxExpression) {
  const openEle = element.openingElement;
  const props = openEle.attributes.properties.filter(i => i.name && ts.isIdentifier(i.name) && i.name.text !== name);
  const newAttrs = ts.updateJsxAttributes(openEle.attributes, [
    ...props,
    ts.createJsxAttribute(ts.createIdentifier(name), value),
  ]);
  const newElement = ts.updateJsxOpeningElement(openEle, openEle.tagName, openEle.typeArguments, newAttrs);
  return ts.updateJsxElement(element, newElement, element.children, element.closingElement);
}
