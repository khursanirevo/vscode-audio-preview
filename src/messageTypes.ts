import { Config } from "./config";

// Extension to Webview Messages
export type ExtMessage = 
  | { type: 'EXT_CONFIG'; payload: Config }
  | { type: 'EXT_DATA'; payload: ExtDataPayload }
  | { type: 'EXT_RELOAD' };

export interface ExtDataPayload {
  samples: ArrayBufferLike;
  start: number;
  end: number;
  wholeLength: number;
  autoAnalyze?: boolean;
}

// Webview to Extension Messages
export type WebviewMessage =
  | { type: 'WV_CONFIG' }
  | { type: 'WV_DATA'; payload: WebviewDataPayload }
  | { type: 'WV_WRITE_WAV'; payload: WebviewWriteWavPayload }
  | { type: 'WV_ERROR'; payload: WebviewErrorPayload };

export interface WebviewDataPayload {
  start: number;
  end: number;
}

export interface WebviewWriteWavPayload {
  filename: string;
  samples: ArrayBufferLike;
}

export interface WebviewErrorPayload {
  message: string;
}

// Type guards for Extension messages
export function isExtConfigMessage(msg: ExtMessage): msg is Extract<ExtMessage, { type: 'EXT_CONFIG' }> {
  return msg.type === 'EXT_CONFIG';
}

export function isExtDataMessage(msg: ExtMessage): msg is Extract<ExtMessage, { type: 'EXT_DATA' }> {
  return msg.type === 'EXT_DATA';
}

export function isExtReloadMessage(msg: ExtMessage): msg is Extract<ExtMessage, { type: 'EXT_RELOAD' }> {
  return msg.type === 'EXT_RELOAD';
}

// Type guards for Webview messages
export function isWebviewConfigMessage(msg: WebviewMessage): msg is Extract<WebviewMessage, { type: 'WV_CONFIG' }> {
  return msg.type === 'WV_CONFIG';
}

export function isWebviewDataMessage(msg: WebviewMessage): msg is Extract<WebviewMessage, { type: 'WV_DATA' }> {
  return msg.type === 'WV_DATA';
}

export function isWebviewWriteWavMessage(msg: WebviewMessage): msg is Extract<WebviewMessage, { type: 'WV_WRITE_WAV' }> {
  return msg.type === 'WV_WRITE_WAV';
}

export function isWebviewErrorMessage(msg: WebviewMessage): msg is Extract<WebviewMessage, { type: 'WV_ERROR' }> {
  return msg.type === 'WV_ERROR';
}