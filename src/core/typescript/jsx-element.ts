import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { ExpressionGenerator } from "./expression";
import { IJsxAttrDefine, JsxAttrGenerator } from "./jsx-attr";
import { is } from "../../utils/is";

export interface IJsxElementDefine {
  tagName: string;
  attrs?: Record<string, IJsxAttrDefine>;
  children?: Array<string | IJsxElementDefine>;
}

@Injectable(InjectScope.New)
export class JsxElementGenerator extends ExpressionGenerator<ts.JsxElement | ts.JsxSelfClosingElement> {
  protected tagName!: string;
  protected attrs: Record<string, JsxAttrGenerator> = {};
  protected children: (string | JsxElementGenerator)[] = [];

  public setTagName(name: string) {
    this.tagName = name;
    return this;
  }

  public addJsxAttr(name: string, value: IJsxAttrDefine): this;
  public addJsxAttr(attr: JsxAttrGenerator): this;
  public addJsxAttr(name: string | JsxAttrGenerator, value?: IJsxAttrDefine) {
    if (typeof name === "string") {
      this.attrs[name] = new JsxAttrGenerator().setName(name).setValue(value!);
    } else {
      this.attrs[name["getName"]().text] = name;
    }
    return this;
  }

  public addJsxAttrs(kvs: ([string, IJsxAttrDefine] | JsxAttrGenerator)[]) {
    for (const i of kvs) {
      is.array(i) ? this.addJsxAttr(i[0], i[1]) : this.addJsxAttr(i);
    }
    return this;
  }

  public addJsxChild(node: string | IJsxElementDefine | JsxElementGenerator) {
    if (typeof node === "string") {
      this.children.push(node);
    } else if (node instanceof JsxElementGenerator) {
      this.children.push(node);
    } else {
      this.children.push(createJsxElement(node));
    }
    return this;
  }

  public addJsxChildren(nodes: Array<string | IJsxElementDefine | JsxElementGenerator>) {
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
  const childNode = new JsxElementGenerator().setTagName(node.tagName);
  Object.entries(node.attrs || {}).forEach(([name, attr]) => childNode.addJsxAttr(name, attr));
  (node.children || []).forEach(e => childNode.addJsxChild(e));
  return childNode;
}
