export interface IPureObject extends Record<string, any> {}

export type MapValueType<T> = T extends Map<any, infer V> ? V : never;

export interface IUnitBase {
  name: IDescriptionMeta;
  description: IWeakDescriptionMeta | null;
}

export interface IWeakDescriptionMeta {
  value: string;
  i18n: {
    [key: string]: string | null;
  };
}

export interface IDescriptionMeta extends IWeakDescriptionMeta {
  displayValue: string | null;
}

export type IBasicLiteralType = string | boolean | number | object;

export interface ICildAttachRefExpression {
  id: string;
  value: string;
}

export type TypeLiteralMeta = "object" | "string" | "number" | "boolean" | "enums" | "map";

export interface IMetaTypeMapItem {
  type?: string;
  allowValues?: any[];
  validate?: RegExp | ((value: any) => boolean);
}

export interface IMetaTypeMapInfo {
  key?: IMetaTypeMapItem["type"] | IMetaTypeMapItem["validate"] | IMetaTypeMapItem["allowValues"] | IMetaTypeMapItem;
  value?: IMetaTypeMapItem["type"] | IMetaTypeMapItem["validate"] | IMetaTypeMapItem["allowValues"] | IMetaTypeMapItem;
}

export interface IMetaTypeEnumRule {
  allowValues?: any[];
  validate?: (value: any) => boolean;
}

export type IMetaTypeEnumInfo = IMetaTypeEnumRule | IMetaTypeEnumRule["allowValues"] | IMetaTypeEnumRule["validate"];

export type MetaExpressionType = "literal" | "complexLogic" | "entityRef";

export type MetaEntityRefType = "reference" | "observable";

export interface IEntityRefExpressionType {
  ref: string;
  type: MetaEntityRefType;
  expression: string;
}

export interface IMetaType {
  meta: TypeLiteralMeta;
  expressionType: MetaExpressionType;
  entityRefType: MetaEntityRefType;
  enumsInfo: IMetaTypeEnumInfo | null;
  mapInfo: IMetaTypeMapInfo | null;
  constructor: any;
}

export interface IPropertyGroupBase extends IUnitBase {}

export interface IPropertyBase extends IUnitBase {
  realName: string;
  group: string | null;
  type: IMetaType;
  required: boolean;
}

/**
 * 基本可扩展参数结构体
 */
export interface ITypedSyntaxExpression<
  E extends unknown = never,
  P extends unknown = unknown,
  T extends Record<string, unknown> = Record<string, unknown>
> {
  type: E;
  expression: P;
  extensions?: Partial<T>;
}

export type RecordValue<T> = T extends Record<string, infer P> ? P : never;

/**
 * 基本可扩展参数结构体的字典类型
 */
export interface ITypedSyntaxExpressionMap<E extends unknown = never, P extends unknown = unknown> {
  [name: string]: ITypedSyntaxExpression<E, P>;
}

/**
 * 基本可扩展参数结构体（包含group）的字典类型
 */
export interface ITypedSyntaxExpressionGroupMap<E extends unknown = never, P extends unknown = unknown> {
  [groupOrName: string]: ITypedSyntaxExpressionMap<E, P> | ITypedSyntaxExpression<E, P>;
}

/** 组件、指令输入参数字典类型：字面量 */
export type IComponentInputMap = ITypedSyntaxExpressionGroupMap<"literal", IBasicLiteralType>;

/** 指令的输入参数字典类型：实体引用 */
export type IDirectiveInputEntityRefMap = ITypedSyntaxExpressionGroupMap<"entityRef", IEntityRefExpressionType>;

/** 指令的输入参数字典类型：字面量+指令引用 */
export type IDirectiveInputMap = IComponentInputMap | IDirectiveInputEntityRefMap;

/** 组件的附加参数字典类型：child附加列表 */
export type IComponentAttachMap = ITypedSyntaxExpressionMap<"childRefs", Array<ICildAttachRefExpression>>;

export interface ILiteralExpression extends ITypedSyntaxExpression<"literal", any, { type: TypeLiteralMeta }> {}

export interface IStateExpression extends ITypedSyntaxExpression<"state", string, { reverse: boolean }> {}

export interface IPropsExpression extends ITypedSyntaxExpression<"props", string, { reverse: boolean }> {}

export interface IEntityRefExpression extends ITypedSyntaxExpression<"entityRef", IEntityRefExpressionType, {}> {}

export interface IComplexLogicDefine {
  vars?: string[];
  expressions: string[];
}

export interface IComplexLogicExpression extends ITypedSyntaxExpression<"complexLogic", IComplexLogicDefine, {}> {}

export type IComponentProp =
  | ILiteralExpression
  | IStateExpression
  | IPropsExpression
  | IEntityRefExpression
  | IComplexLogicExpression;

/** comp-child的prop参数字典类型：字面量+状态 */
export type IComponentPropMap = Record<string, IComponentProp>;
