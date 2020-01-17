import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";

@Injectable(InjectScope.New)
export abstract class NodeGenerator<T extends ts.Node = ts.Node> {
  private readonly __transformer: Array<(node: T) => T> = [];

  public pushTransformerBeforeEmit(fn: (node: T) => T) {
    this.__transformer.push(fn);
    return this;
  }

  protected exist<M>(arr: (M | undefined)[]): M[] {
    return <M[]>arr.filter(i => !!i);
  }

  protected abstract create(): T;

  public emit() {
    let node = this.create();
    for (const transformer of this.__transformer) {
      node = transformer(node);
    }
    return node;
  }
}
