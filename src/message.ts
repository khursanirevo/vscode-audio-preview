import { Config } from "./config";

// Type of messages from Extension to Webview
export class ExtMessageType {
  public static readonly CONFIG = "CONFIG";
  public static readonly DATA = "DATA";
  public static readonly RELOAD = "RELOAD";
  public static readonly LABEL = "LABEL";

  public static isCONFIG(msg: ExtMessage): msg is ExtConfigMessage {
    return msg.type === ExtMessageType.CONFIG;
  }

  public static isDATA(msg: ExtMessage): msg is ExtDataMessage {
    return msg.type === ExtMessageType.DATA;
  }

  public static isRELOAD(msg: ExtMessage): msg is ExtReloadMessage {
    return msg.type === ExtMessageType.RELOAD;
  }

  public static isLABEL(msg: ExtMessage): msg is ExtLabelMessage {
    return msg.type === ExtMessageType.LABEL;
  }
}

export type ExtMessage =
  | ExtConfigMessage
  | ExtDataMessage
  | ExtReloadMessage
  | ExtLabelMessage;

export class ExtConfigMessage {
  type = ExtMessageType.CONFIG;
  data: Config;
}

export class ExtLabelMessage {
  type = ExtMessageType.LABEL;
  data: string;
}

export class ExtDataMessage {
  type = ExtMessageType.DATA;
  data: ExtDataMessageData;
}

export interface ExtDataMessageData {
  samples: ArrayBufferLike;
  start: number;
  end: number;
  wholeLength: number;
}

export class ExtReloadMessage {
  type = ExtMessageType.RELOAD;
}

// Type of messages from Webview to Extension
export class WebviewMessageType {
  public static readonly CONFIG = "CONFIG";
  public static readonly DATA = "DATA";
  public static readonly WRITE_WAV = "WRITE_WAV";
  public static readonly ERROR = "RELOAD";
  public static readonly GET_LABEL = "GET_LABEL";
  public static readonly SAVE_LABEL = "SAVE_LABEL";

  public static isCONFIG(msg: WebviewMessage): msg is WebviewConfigMessage {
    return msg.type === WebviewMessageType.CONFIG;
  }

  public static isDATA(msg: WebviewMessage): msg is WebviewDataMessage {
    return msg.type === WebviewMessageType.DATA;
  }

  public static isWriteWav(msg: WebviewMessage): msg is WebviewWriteWavMessage {
    return msg.type === WebviewMessageType.WRITE_WAV;
  }

  public static isERROR(msg: WebviewMessage): msg is WebviewErrorMessage {
    return msg.type === WebviewMessageType.ERROR;
  }

  public static isGetLabel(msg: WebviewMessage): msg is WebviewGetLabelMessage {
    return msg.type === WebviewMessageType.GET_LABEL;
  }

  public static isSaveLabel(
    msg: WebviewMessage,
  ): msg is WebviewSaveLabelMessage {
    return msg.type === WebviewMessageType.SAVE_LABEL;
  }
}

export type WebviewMessage =
  | WebviewConfigMessage
  | WebviewDataMessage
  | WebviewWriteWavMessage
  | WebviewErrorMessage
  | WebviewGetLabelMessage
  | WebviewSaveLabelMessage;

export class WebviewConfigMessage {
  type = WebviewMessageType.CONFIG;
}

export class WebviewGetLabelMessage {
  type = WebviewMessageType.GET_LABEL;
}

export class WebviewSaveLabelMessage {
  type = WebviewMessageType.SAVE_LABEL;
  data: string;
}

export class WebviewDataMessage {
  type = WebviewMessageType.DATA;
  data: WebviewDataMessageData;
}

export interface WebviewDataMessageData {
  start: number;
  end: number;
}

export class WebviewWriteWavMessage {
  type = WebviewMessageType.WRITE_WAV;
  data: WebviewWriteWavMessageData;
}

export interface WebviewWriteWavMessageData {
  filename: string;
  samples: ArrayBufferLike;
}

export class WebviewErrorMessage {
  type = WebviewMessageType.ERROR;
  data: WebviewErrorMessageData;
}

export interface WebviewErrorMessageData {
  message: string;
}

// Type of post message funtion
export type PostMessage = (message: WebviewMessage) => void;
