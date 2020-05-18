export const is = {
  stringOrNumberOrBoolean: (val: unknown): val is string | number | boolean =>
    is.string(val) || is.number(val) || is.boolean(val),
  nullOrUndefined: (val: unknown): val is null | undefined => val === null || val === void 0,
  undefined: (val: unknown): val is undefined => val === void 0,
  string: (val: unknown): val is string => typeof val === "string",
  boolean: (val: unknown): val is boolean => typeof val === "boolean",
  number: (val: unknown): val is number => typeof val === "number",
  object: (val: unknown): val is Record<string, any> => val && typeof val === "object" && !Array.isArray(val),
  array: (val: unknown): val is any[] => Array.isArray(val),
  notEmptyArray: (val: unknown): val is any[] => Array.isArray(val) && val.length > 0,
};
