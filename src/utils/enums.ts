export function getEnumValues(target: any): (string | number)[] {
  return Object.getOwnPropertyNames(target).map(k => (<any>target)[k]);
}
