/**
 * Filters out undefined values from an object. 
 * Useful for Firestore which throws errors when encountering "undefined".
 */
export function cleanData<T extends object>(data: T): T {
  const result: any = {};
  Object.keys(data).forEach(key => {
    const val = (data as any)[key];
    if (val !== undefined) {
      result[key] = val;
    }
  });
  return result;
}
