import uuid from "uuid/v4";

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
