/**
 * @file KrnlResult.ts
 * @description Generic, standard typed operation result envelope.
 */

export interface KrnlResultEnvelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  code?: string | number;
}

export class KrnlResult<T> implements KrnlResultEnvelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  code?: string | number;

  private constructor(status: "success" | "error", message?: string, data?: T, code?: string | number) {
    this.status = status;
    if (message !== undefined) this.message = message;
    if (data !== undefined) this.data = data;
    if (code !== undefined) this.code = code;
  }

  static ok<T>(data?: T, message?: string): KrnlResult<T> {
    return new KrnlResult<T>("success", message, data);
  }

  static fail<T = any>(message: string, code?: string | number): KrnlResult<T> {
    return new KrnlResult<T>("error", message, undefined, code);
  }

  isSuccess(): boolean {
    return this.status === "success";
  }

  isError(): boolean {
    return this.status === "error";
  }
}
