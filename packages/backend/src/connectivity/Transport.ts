/**
 * @file Transport.ts
 * @description Pluggable transport abstraction decoupling business logic from underlying network protocols.
 */

import { Message } from './types.js';

export type MessageHandler = (message: Message) => void;
export type ErrorHandler = (error: Error) => void;

export interface ITransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  request<T = unknown, R = unknown>(message: Message<T>): Promise<Message<R>>;
  send<T = unknown>(message: Message<T>): Promise<void>;

  subscribe(channel: string, handler?: MessageHandler): () => void;
  unsubscribe(channel: string): void;

  onMessage(handler: MessageHandler): () => void;
  onError(handler: ErrorHandler): () => void;
}
