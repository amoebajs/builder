import { camelCase } from "lodash";

export function classCase(value: string) {
  const result = camelCase(value);
  return result[0].toUpperCase() + result.slice(1);
}
