import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { ExpressionGenerator } from "./expression";
import { IJsxAttrDefine, JsxAttributeGenerator } from "./jsx-attribute";
import { is } from "../../utils/is";
import { JsxExpressionGenerator } from "./jsx-expression";

export interface IJsxElementDefine {
  tagName: string;
  attrs?: Record<string, IJsxAttrDefine>;
  children?: Array<string | IJsxElementDefine>;
}

@Injectable(InjectScope.New)
export class JsxElementGenerator extends ExpressionGenerator<ts.JsxElement | ts.JsxSelfClosingElement> {
  protected tagName!: string;
  protected attrs: Record<string, JsxAttributeGenerator> = {};
  protected children: (string | JsxElementGenerator | JsxExpressionGenerator)[] = [];

  public setTagName(name: string) {
    this.tagName = name;
    return this;
  }

  public getJsxAttr(name: string) {
    return this.attrs[name] || null;
  }

  public addJsxAttr(name: string, value: IJsxAttrDefine): this;
  public addJsxAttr(attr: JsxAttributeGenerator): this;
  public addJsxAttr(name: string | JsxAttributeGenerator, value?: IJsxAttrDefine) {
    if (typeof name === "string") {
      this.attrs[name] = new JsxAttributeGenerator().setName(name).setValue(value!);
    } else {
      this.attrs[name["getName"]().text] = name;
    }
    return this;
  }

  public addJsxAttrs(kvs: JsxAttributeGenerator[] | Record<string, IJsxAttrDefine>) {
    if (is.array(kvs)) {
      for (const i of kvs) {
        this.addJsxAttr(i);
      }
    } else {
      const entries = Object.entries(kvs);
      for (const [k, v] of entries) {
        this.addJsxAttr(k, v);
      }
    }
    return this;
  }

  public addJsxChild(node: string | IJsxElementDefine | JsxElementGenerator | JsxExpressionGenerator) {
    if (typeof node === "string") {
      this.children.push(node);
    } else if (node instanceof JsxElementGenerator || node instanceof JsxExpressionGenerator) {
      this.children.push(node);
    } else {
      this.children.push(createJsxElement(node));
    }
    return this;
  }

  public addJsxChildren(nodes: Array<string | IJsxElementDefine | JsxElementGenerator | JsxExpressionGenerator>) {
    for (const node of nodes) {
      this.addJsxChild(node);
    }
    return this;
  }

  protected create(): ts.JsxElement | ts.JsxSelfClosingElement {
    const attrs = Object.entries(this.attrs).map(([_, attr]) => attr.emit());
    const childNodes = this.children.map(i => (typeof i === "string" ? ts.createJsxText(i) : i.emit()));
    const tagName = ts.createIdentifier(this.tagName);
    return this.children.length === 0
      ? ts.createJsxSelfClosingElement(tagName, [], ts.createJsxAttributes(attrs))
      : ts.createJsxElement(
          ts.createJsxOpeningElement(tagName, [], ts.createJsxAttributes(attrs)),
          childNodes,
          ts.createJsxClosingElement(tagName),
        );
  }
}

export function createJsxElement(node: IJsxElementDefine) {
  return new JsxElementGenerator()
    .setTagName(node.tagName)
    .addJsxAttrs(node.attrs || {})
    .addJsxChildren(node.children || []);
}
