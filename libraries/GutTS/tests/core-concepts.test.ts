import {describe,expect,it} from "vitest";
import {chunk,unique} from "../src/arrays/array-concepts.js";
import {clamp,sum} from "../src/numbers/number-concepts.js";
import {isPlainObject,pick} from "../src/objects/object-concepts.js";
import {getQueryParam,joinUrl} from "../src/urls/url-concepts.js";

describe("core utility concepts",()=>{
  it("handles arrays and numbers",()=>{
    expect(chunk([1,2,3],2)).toEqual([[1,2],[3]]);
    expect(unique([1,1,2])).toEqual([1,2]);
    expect(clamp(12,0,10)).toBe(10);
    expect(sum([1,2,3])).toBe(6);
  });

  it("handles objects and URLs",()=>{
    expect(pick({a:1,b:2},["a"])).toEqual({a:1});
    expect(isPlainObject({})).toBe(true);
    const url=joinUrl("https://example.com/","/api/","v1");
    expect(getQueryParam(url+"?page=2","page")).toBe("2");
  });
});
