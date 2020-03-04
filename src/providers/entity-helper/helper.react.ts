import ts from "typescript";
import kebabCase from "lodash/kebabCase";
import camelCase from "lodash/camelCase";
import { InjectScope } from "@bonbons/di";
import { is, IJsxAttrs, TYPES } from "../../utils";
import {
  IComplexLogicExpression,
  ImportGenerator,
  Injectable,
  JsxElementGenerator,
  resolveSyntaxInsert,
  IStateExpression,
  IPropsExpression,
} from "../../core";
import { BasicHelper } from "./helper.basic";
import { IJsxAttrDefine } from "../../core/typescript/jsx-attribute";
import { IJsxElementDefine } from "../../core/typescript/jsx-element";

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
  public readonly DEFAULT_CONTEXT_NAME = "props.CONTEXT";
  public readonly DEFINE_IS_REGEXP = /^([0-9a-zA-Z_]+)\s+is\s+(.+)$/;
  public readonly CEVALUE_REGEXP = /^\$\((!)?([0-9a-zA-Z_!]+)\s+\|\s+bind:(state|props|setState)\)$/;

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

  public createJsxArrowEventHandler(expression: ts.Expression) {
    return ts.createJsxExpression(
      undefined,
      ts.createArrowFunction(
        [],
        [],
        [
          ts.createParameter(
            [],
            [],
            ts.createToken(ts.SyntaxKind.DotDotDotToken),
            ts.createIdentifier("args"),
            undefined,
            TYPES.Any,
            undefined,
          ),
        ],
        undefined,
        undefined,
        ts.createBlock([ts.createStatement(expression)], false),
      ),
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

  public useStateExpression(exp: IStateExpression, contextName: string) {
    const [p01, ...ps] = String(exp.expression).split(".");
    return `${this.useReverse(exp)}${contextName}.state.${[p01, "value", ...ps].join(".")}`;
  }

  public usePropExpression(exp: IPropsExpression) {
    return `${this.useReverse(exp)}props.${exp.expression}`;
  }

  public useComplexLogicExpression(exp: IComplexLogicExpression, contextName: string) {
    const { vars = [], expressions = [] } = exp.expression;
    const context: Array<string> = [];
    for (const each of vars) {
      const result = this.DEFINE_IS_REGEXP.exec(each);
      if (result) {
        const value = this.useBindExpression(result[2].trimLeft(), contextName);
        context.push(`let ${result[1]} = ${value};`);
      }
    }
    return [...context, ...expressions].join(" ");
  }

  private useBindExpression(target: string, contextName = this.DEFAULT_CONTEXT_NAME) {
    const matched = this.CEVALUE_REGEXP.exec(target);
    let value = undefined;
    if (matched !== null) {
      const [_, reverse, vName, vType] = matched;
      if (vType === "props") {
        value = `${reverse || ""}props.${vName}`;
      } else {
        value = `${reverse || ""}${contextName}.state.${vName}.${vType === "state" ? "value" : "setState"}`;
      }
    }
    return value;
  }

  private useReverse(exp: IStateExpression | IPropsExpression) {
    return exp.extensions?.reverse ?? false ? "!" : "";
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
