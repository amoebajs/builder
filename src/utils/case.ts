import camelCaseFn from "lodash/camelCase";
import kebabCaseFn from "lodash/kebabCase";

export function classCase(value: string) {
  const result = camelCaseFn(value);
  return result[0].toUpperCase() + result.slice(1);
}

export function kebabCase(value: string) {
  return kebabCaseFn(value);
}

export function camelCase(value: string) {
  return camelCaseFn(value);
}
