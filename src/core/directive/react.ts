import { IPureObject } from "../base";
import { BasicDirective } from "./basic";
import { BasicReactContainer } from "../component";
import ts = require("typescript");
import { NotFoundError } from "../../errors";

export abstract class ReactDirective<
  T extends IPureObject = IPureObject
> extends BasicDirective<T> {
  private readonly __parentId!: string;
  private readonly __parentRef!: BasicReactContainer;

  protected getElementById(entityId: string) {
    const map = this.__parentRef["__elementMap"];
    return map.get(entityId) || null;
  }

  protected setElementById(entityId: string, element: any) {
    const map = this.__parentRef["__elementMap"];
    map.set(entityId, element);
  }

  protected appendJsxAttribute(
    entityId: string,
    name: string,
    value: ts.JsxExpression | ts.StringLiteral
  ) {
    const element = this.getElementById(entityId);
    if (!element) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    const openEle = element.openingElement;
    const props = openEle.attributes.properties.filter(
      i => i.name && ts.isIdentifier(i.name) && i.name.text !== name
    );
    const newAttrs = ts.updateJsxAttributes(openEle.attributes, [
      ...props,
      ts.createJsxAttribute(ts.createIdentifier(name), value)
    ]);
    const newElement = ts.updateJsxOpeningElement(
      openEle,
      openEle.tagName,
      openEle.typeArguments,
      newAttrs
    );
    this.setElementById(
      entityId,
      ts.updateJsxElement(
        element,
        newElement,
        element.children,
        element.closingElement
      )
    );
  }
}
