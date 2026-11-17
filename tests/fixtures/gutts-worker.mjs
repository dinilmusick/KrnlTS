import {chunk} from "../../dist/worker.js";
export default {async fetch(){const result=chunk([1,2,3,4],2);return Response.json({ok:result.length===2&&result[0].length===2,groups:result.length})}};
