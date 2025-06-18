import React from 'react';
import { createRoot } from 'react-dom/client';
import { WebView } from './components/react/WebView';
import { WebviewMessage } from '../messageTypes';
import Decoder from './decoder';
import "./styles/vscode.css";

export interface vscode {
  postMessage(message: WebviewMessage): void;
}

// vscode must be passed by this special function
declare function acquireVsCodeApi(): vscode;

function createAudioContext(sampleRate: number) {
  return new AudioContext({ sampleRate });
}

function createDecoder(fileData: Uint8Array) {
  return Decoder.create(fileData);
}

// React entry point
const root = document.getElementById('root');
if (root) {
  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <WebView
        createAudioContext={createAudioContext}
        createDecoder={createDecoder}
      />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}