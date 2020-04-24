import uuid from "uuid/v4";
import { classCase } from "./case";

export * from "./constants";
export * from "./case";
export * from "./is";
export * from "./jsx";
export * from "./enums";

export function createEntityId() {
  return (
    "E" +
    uuid()
      .split("-")
      .join("")
  );
}

export function connectParentChildEntityScope(parentScope: string, newId: string): string {
  return parentScope + "_" + newId;
}

export function connectReferenceName(entityid: string, name: string) {
  return entityid + "_" + classCase(name);
}
