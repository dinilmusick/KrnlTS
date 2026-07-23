/**
 * @file ObjectKit.ts
 * @description Deep clone, deep merge, deep equal, object diffing, and dot-notation in-memory path accessor tools.
 */
export class ObjectKit {
    /**
     * Structurally deep clones an object with circular dependency check.
     */
    static deepClone(obj, seen = new Map()) {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }
        if (seen.has(obj)) {
            return seen.get(obj);
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof RegExp) {
            return new RegExp(obj.source, obj.flags);
        }
        if (Array.isArray(obj)) {
            const cloneArr = [];
            seen.set(obj, cloneArr);
            for (const item of obj) {
                cloneArr.push(ObjectKit.deepClone(item, seen));
            }
            return cloneArr;
        }
        const cloneObj = Object.create(Object.getPrototypeOf(obj));
        seen.set(obj, cloneObj);
        for (const key of Reflect.ownKeys(obj)) {
            const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
            if (descriptor) {
                descriptor.value = ObjectKit.deepClone(descriptor.value, seen);
                Object.defineProperty(cloneObj, key, descriptor);
            }
        }
        return cloneObj;
    }
    /**
     * Recursively deep merges override objects into a base.
     */
    static deepMerge(base, ...overrides) {
        let result = ObjectKit.deepClone(base);
        for (const override of overrides) {
            if (override === null || typeof override !== "object") {
                continue;
            }
            for (const key of Object.keys(override)) {
                const val = override[key];
                if (val === undefined) {
                    delete result[key];
                }
                else if (val && typeof val === "object" && !Array.isArray(val)) {
                    if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
                        result[key] = ObjectKit.deepMerge(result[key], val);
                    }
                    else {
                        result[key] = ObjectKit.deepClone(val);
                    }
                }
                else {
                    result[key] = ObjectKit.deepClone(val);
                }
            }
        }
        return result;
    }
    /**
     * Performs a strict structural equality check.
     */
    static deepEqual(a, b) {
        if (Object.is(a, b))
            return true;
        if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
            return false;
        }
        if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
            return false;
        }
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }
        if (a instanceof RegExp && b instanceof RegExp) {
            return a.toString() === b.toString();
        }
        const keysA = Reflect.ownKeys(a);
        const keysB = Reflect.ownKeys(b);
        if (keysA.length !== keysB.length)
            return false;
        const setB = new Set(keysB);
        for (const key of keysA) {
            if (!setB.has(key))
                return false;
            if (!ObjectKit.deepEqual(a[key], b[key]))
                return false;
        }
        return true;
    }
    /**
     * Performs an object diff between before and after states.
     */
    static objectDiff(before, after) {
        const added = {};
        const removed = {};
        const changed = {};
        if (before === null || typeof before !== "object" || after === null || typeof after !== "object") {
            return { added, removed, changed };
        }
        const keysBefore = Object.keys(before);
        const keysAfter = Object.keys(after);
        for (const key of keysAfter) {
            if (!(key in before)) {
                added[key] = ObjectKit.deepClone(after[key]);
            }
            else if (!ObjectKit.deepEqual(before[key], after[key])) {
                if (before[key] &&
                    typeof before[key] === "object" &&
                    after[key] &&
                    typeof after[key] === "object" &&
                    !Array.isArray(before[key]) &&
                    !Array.isArray(after[key])) {
                    const nested = ObjectKit.objectDiff(before[key], after[key]);
                    if (Object.keys(nested.added).length > 0 || Object.keys(nested.removed).length > 0 || Object.keys(nested.changed).length > 0) {
                        changed[key] = nested;
                    }
                }
                else {
                    changed[key] = { from: ObjectKit.deepClone(before[key]), to: ObjectKit.deepClone(after[key]) };
                }
            }
        }
        for (const key of keysBefore) {
            if (!(key in after)) {
                removed[key] = ObjectKit.deepClone(before[key]);
            }
        }
        return { added, removed, changed };
    }
    /**
     * Accesses an in-memory object by dot-notation.
     */
    static getPath(obj, path, defaultValue) {
        if (!path)
            return obj;
        const parts = path.split(".");
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) {
                return defaultValue;
            }
            current = current[part];
        }
        return current !== undefined ? current : defaultValue;
    }
    /**
     * Mutates or sets an in-memory object by dot-notation.
     */
    static setPath(obj, path, value) {
        if (!path)
            return obj;
        const parts = path.split(".");
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] === undefined || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
        return obj;
    }
}
//# sourceMappingURL=ObjectKit.js.map