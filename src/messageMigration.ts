import * as OldMsg from "./message";
import * as NewMsg from "./messageTypes";

// Convert old Extension messages to new format
export function migrateExtMessage(oldMsg: OldMsg.ExtMessage): NewMsg.ExtMessage {
  if (OldMsg.ExtMessageType.isCONFIG(oldMsg)) {
    return { type: 'EXT_CONFIG', payload: oldMsg.data };
  }
  if (OldMsg.ExtMessageType.isDATA(oldMsg)) {
    return { type: 'EXT_DATA', payload: oldMsg.data };
  }
  if (OldMsg.ExtMessageType.isRELOAD(oldMsg)) {
    return { type: 'EXT_RELOAD' };
  }
  throw new Error(`Unknown ExtMessage type: ${(oldMsg as any).type}`);
}

// Convert new Extension messages to old format
export function unmigrateExtMessage(newMsg: NewMsg.ExtMessage): OldMsg.ExtMessage {
  switch (newMsg.type) {
    case 'EXT_CONFIG': {
      const msg = new OldMsg.ExtConfigMessage();
      msg.data = newMsg.payload;
      return msg;
    }
    case 'EXT_DATA': {
      const msg = new OldMsg.ExtDataMessage();
      msg.data = newMsg.payload;
      return msg;
    }
    case 'EXT_RELOAD':
      return new OldMsg.ExtReloadMessage();
  }
}

// Convert old Webview messages to new format
export function migrateWebviewMessage(oldMsg: OldMsg.WebviewMessage): NewMsg.WebviewMessage {
  if (OldMsg.WebviewMessageType.isCONFIG(oldMsg)) {
    return { type: 'WV_CONFIG' };
  }
  if (OldMsg.WebviewMessageType.isDATA(oldMsg)) {
    const dataMsg = oldMsg as OldMsg.WebviewDataMessage;
    return { type: 'WV_DATA', payload: dataMsg.data };
  }
  if (OldMsg.WebviewMessageType.isWriteWav(oldMsg)) {
    const writeMsg = oldMsg as OldMsg.WebviewWriteWavMessage;
    return { type: 'WV_WRITE_WAV', payload: writeMsg.data };
  }
  if (OldMsg.WebviewMessageType.isERROR(oldMsg)) {
    const errorMsg = oldMsg as OldMsg.WebviewErrorMessage;
    return { type: 'WV_ERROR', payload: errorMsg.data };
  }
  throw new Error(`Unknown WebviewMessage type: ${(oldMsg as any).type}`);
}

// Convert new Webview messages to old format
export function unmigrateWebviewMessage(newMsg: NewMsg.WebviewMessage): OldMsg.WebviewMessage {
  switch (newMsg.type) {
    case 'WV_CONFIG':
      return new OldMsg.WebviewConfigMessage();
    case 'WV_DATA': {
      const msg = new OldMsg.WebviewDataMessage();
      msg.data = newMsg.payload;
      return msg;
    }
    case 'WV_WRITE_WAV': {
      const msg = new OldMsg.WebviewWriteWavMessage();
      msg.data = newMsg.payload;
      return msg;
    }
    case 'WV_ERROR': {
      const msg = new OldMsg.WebviewErrorMessage();
      msg.data = newMsg.payload;
      return msg;
    }
  }
}