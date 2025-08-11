export const dataTypeLabels: { [K in TypeUtil.DataTypeStringKey]: TypeUtil.DataTypeString<K> } = {
  string: '[object String]',
  number: '[object Number]',
  boolean: '[object Boolean]',
  null: '[object Null]',
  undefined: '[object Undefined]',
  symbol: '[object Symbol]',
  bigInt: '[object BigInt]',
  object: '[object Object]',
  function: '[object Function]',
  array: '[object Array]',
  date: '[object Date]',
  regExp: '[object RegExp]',
  promise: '[object Promise]',
  set: '[object Set]',
  map: '[object Map]',
  file: '[object File]'
};


function getDataTypeString<K extends TypeUtil.DataTypeStringKey>(value: unknown) {
  return Object.prototype.toString.call(value) as TypeUtil.DataTypeString<K>;
}

export function isNumber<T extends number>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.number;
}

export function isString<T extends string>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.string;
}

export function isBoolean<T extends boolean>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.boolean;
}

export function isNull<T extends null>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.null;
}

export function isUndefined<T extends undefined>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.undefined;
}

export function isSymbol<T extends symbol>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.symbol;
}

export function isBigInt<T extends bigint>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.bigInt;
}

export function isObject<T extends Record<string, any>>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.object;
}

export function isArray<T extends any[]>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.array;
}

export function isFunction<T extends (...args: any[]) => any | void>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.function;
}

export function isDate<T extends Date>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.date;
}

export function isRegExp<T extends RegExp>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.regExp;
}

export function isPromise<T extends Promise<any>>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.promise;
}

export function isSet<T extends Set<any>>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.set;
}

export function isMap<T extends Map<any, any>>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.map;
}

export function isFile<T extends File>(value: T | unknown): value is T {
  return getDataTypeString(value) === dataTypeLabels.file;
}

export function isEmpty(value) {
  return value === null || value === undefined;
}

declare namespace TypeUtil {
  type Noop = (...args: any) => any;

  interface DataType {
    number: number;
    string: string;
    boolean: boolean;
    null: null;
    undefined: undefined;
    symbol: symbol;
    bigInt: bigint;
    object: Record<string, any>;
    array: Array<any>;
    function: (...args: any[]) => any | void;
    date: Date;
    regExp: RegExp;
    promise: Promise<any>;
    set: Set<any>;
    map: Map<any, any>;
    file: File;
  }

  type DataTypeStringKey = keyof DataType;

  type DataTypeString<T extends DataTypeStringKey = DataTypeStringKey> = `[object ${Capitalize<T>}]`;

  type UnionInclude<T, K extends keyof T> = K extends keyof T ? true : false;

  type Writable<T> = { [K in keyof T]: T[K] };

  type FirstOfArray<T extends any[]> = T extends [infer First, ...infer _Rest] ? First : never;

  type LastOfArray<T extends any[]> = T extends [...infer _Rest, infer Last] ? Last : never;

  // union to tuple
  type Union2IntersectionFn<T> = (T extends unknown ? (k: () => T) => void : never) extends (k: infer R) => void
    ? R
    : never;
  type GetUnionLast<U> = Union2IntersectionFn<U> extends () => infer I ? I : never;

  type UnionToTuple<T, R extends any[] = []> = [T] extends [never]
    ? R
    : UnionToTuple<Exclude<T, GetUnionLast<T>>, [GetUnionLast<T>, ...R]>;
}