import { Disposable } from "../dispose";

export enum EventType {
  // vscode
  VSCODE_MESSAGE = "message",
  // player
  UPDATE_SEEKBAR = "update-seekbar",
  UPDATE_IS_PLAYING = "update-is-playing",
  // playerSettings
  PS_UPDATE_ENABLE_HPF = "update-enable-hpf",
  PS_UPDATE_HPF_FREQUENCY = "update-hpf-frequency",
  PS_UPDATE_ENABLE_LPF = "update-enable-lpf",
  PS_UPDATE_LPF_FREQUENCY = "ps_update_lpf_frequency",
  PS_UPDATE_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM = "ps_update_match_filter_frequency_to_spectrogram",
  PS_UPDATE_PLAYBACK_RATE = "ps_update_playback_rate",
  // analyzer
  ANALYZE = "analyze",
  // analyzeSettings
  AS_UPDATE_WAVEFORM_VISIBLE = "as-update-waveform-visible",
  AS_UPDATE_SPECTROGRAM_VISIBLE = "as-update-spectrogram-visible",
  AS_UPDATE_WINDOW_SIZE_INDEX = "as-update-window-size-index",
  AS_UPDATE_FREQUENCY_SCALE = "as-update-frequency-scale",
  AS_UPDATE_MEL_FILTER_NUM = "as-update-mel-filter-num",
  AS_UPDATE_MIN_FREQUENCY = "as-update-min-frequency",
  AS_UPDATE_MAX_FREQUENCY = "as-update-max-frequency",
  AS_UPDATE_MIN_TIME = "as-update-min-time",
  AS_UPDATE_MAX_TIME = "as-update-max-time",
  AS_UPDATE_MIN_AMPLITUDE = "as-update-min-amplitude",
  AS_UPDATE_MAX_AMPLITUDE = "as-update-max-amplitude",
  AS_UPDATE_SPECTROGRAM_AMPLITUDE_RANGE = "as-update-spectrogram-amplitude-range",
  // other
  CLICK = "click",
  CHANGE = "change",
  INPUT = "input",
  KEY_DOWN = "keydown",
  KEY_UP = "keyup",
  MOUSE_DOWN = "mousedown",
  MOUSE_MOVE = "mousemove",
  MOUSE_UP = "mouseup",
  CONTEXT_MENU = "contextmenu",
}

export class DisposableEventListener extends Disposable {
  private _target: EventTarget;
  private _type: string;
  private _handler: EventListenerOrEventListenerObject;

  constructor(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
  ) {
    super();
    this._target = target;
    this._type = type;
    this._handler = handler;
    this._target.addEventListener(this._type, this._handler);
  }

  dispose() {
    this._target.removeEventListener(this._type, this._handler);
  }
}
