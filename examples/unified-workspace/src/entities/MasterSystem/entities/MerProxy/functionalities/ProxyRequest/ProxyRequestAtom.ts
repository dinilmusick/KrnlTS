export interface ProxyRequestInput {
  targetSubApp: string;
  payload: any;
}
export interface ProxyRequestOutput {
  proxied: boolean;
  targetSubApp: string;
  sanitizedPayload: any;
  timestamp: number;
}
