import React from 'react';
import { createRoot } from 'react-dom/client';
import { WebView } from './components/WebView';
import "./styles/vscode.css";

// React entry point
const root = document.getElementById('root');
if (root) {
  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <WebView />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}