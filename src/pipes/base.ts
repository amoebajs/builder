import ts from "typescript";
import uuid from "uuid/v4";
import {
  IExtensivePageContext,
  ImportStatementsUpdater,
  ViewChildNodeCheckInHandler
} from "../plugins/pages";

export abstract class BasicPipe {
  protected pipeName!: string;
  private context!: IExtensivePageContext;
  protected updateImport!: ImportStatementsUpdater;
  private checkInViewNode!: ViewChildNodeCheckInHandler;
  protected childNodes: { [key: string]: ts.JsxElement } = {};

  constructor(protected params?: any) {}
  private onNodePatch(
    context: IExtensivePageContext,
    onImportsUpdate: ImportStatementsUpdater,
    onViewNodeCheckIn: ViewChildNodeCheckInHandler
  ) {
    this.context = context;
    this.updateImport = onImportsUpdate;
    this.checkInViewNode = onViewNodeCheckIn;
  }
  protected abstract onInit(): void;
}

export abstract class CommonPipe extends BasicPipe {
  protected onInit() {}

  protected setParent(parent: ts.HeritageClause) {
    if (parent.token !== ts.SyntaxKind.ExtendsKeyword) return;
    this["context"].extendParent = parent;
  }

  protected addImplement(implement: ts.HeritageClause) {
    if (implement.token !== ts.SyntaxKind.ImplementsKeyword) return;
    this["context"].implementParents.push(implement);
  }

  protected existMethod(methodName: string) {
    return (
      this["context"].methods.findIndex(
        i => ts.isIdentifier(i.name) && i.name.text === methodName
      ) >= 0
    );
  }

  protected addMethod(method: ts.MethodDeclaration) {
    if (ts.isIdentifier(method.name)) {
      const idx = this["context"].methods.findIndex(
        i =>
          ts.isIdentifier(i.name) &&
          i.name.text === (<ts.Identifier>method.name).text
      );
      if (idx >= 0) {
        this["context"].methods[idx] = method;
        return;
      }
    }
    this["context"].methods.push(method);
  }

  protected existField(fieldName: string) {
    return (
      this["context"].fields.findIndex(
        i => ts.isIdentifier(i.name) && i.name.text === fieldName
      ) >= 0
    );
  }

  protected addField(field: ts.PropertyDeclaration) {
    if (ts.isIdentifier(field.name)) {
      const idx = this["context"].fields.findIndex(
        i =>
          ts.isIdentifier(i.name) &&
          i.name.text === (<ts.Identifier>field.name).text
      );
      if (idx >= 0) {
        this["context"].fields[idx] = field;
        return;
      }
    }
    this["context"].fields.push(field);
  }

  protected existProperty(propName: string) {
    return (
      this["context"].properties.findIndex(
        i => ts.isIdentifier(i.name) && i.name.text === propName
      ) >= 0
    );
  }

  protected addProperty(prop: ts.PropertyDeclaration) {
    if (ts.isIdentifier(prop.name)) {
      const idx = this["context"].properties.findIndex(
        i =>
          ts.isIdentifier(i.name) &&
          i.name.text === (<ts.Identifier>prop.name).text
      );
      if (idx >= 0) {
        this["context"].properties[idx] = prop;
        return;
      }
    }
    this["context"].properties.push(prop);
  }
}

export abstract class RenderPipe extends CommonPipe {
  protected onInit() {}

  protected addChildNode(node: ts.JsxElement) {
    this["context"].rootChildren.push(node);
    if (this["checkInViewNode"]) {
      this["checkInViewNode"](this.pipeName + "-" + uuid().slice(0, 8), node);
    }
  }
}
