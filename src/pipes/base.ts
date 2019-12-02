import ts from "typescript";
import {
  IExtensivePageContext,
  ImportStatementsUpdater,
  ViewChildNodeCheckInHandler
} from "../plugins/pages";
import { Pipe } from "../decorators";

export interface ISimpleObject {
  [key: string]: any;
}

export abstract class BasicPipe<T extends ISimpleObject = {}> {
  private context!: IExtensivePageContext;
  protected updateImport!: ImportStatementsUpdater;
  private checkInViewNode!: ViewChildNodeCheckInHandler;

  constructor(protected params: T) {}
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

export function DescribePipe<T>(
  params: T extends BasicPipe<infer B> ? B : any
) {
  return Pipe<any>(params);
}

export abstract class CommonPipe<
  T extends ISimpleObject = {}
> extends BasicPipe<T> {
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

export abstract class RenderPipe<
  T extends ISimpleObject = {}
> extends CommonPipe<T> {
  protected onInit() {}

  protected addChildNode(key: string, node: ts.JsxElement) {
    this["context"].rootChildren.push(node);
    if (this["checkInViewNode"]) {
      this["checkInViewNode"](key, node);
    }
  }
}
