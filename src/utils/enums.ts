export function getEnumValues(target: Object): (string | number)[] {
  return Object.getOwnPropertyNames(target).map(k => (<any>target)[k]);
}
