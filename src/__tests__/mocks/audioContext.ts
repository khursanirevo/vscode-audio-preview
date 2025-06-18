/**
 * Web Audio API mocks for testing
 */

// Mock AudioBuffer
export class MockAudioBuffer {
  public sampleRate: number;
  public length: number;
  public duration: number;
  public numberOfChannels: number;
  private _channelData: Float32Array[];

  constructor(options: {
    numberOfChannels: number;
    length: number;
    sampleRate: number;
  }) {
    this.numberOfChannels = options.numberOfChannels;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.duration = options.length / options.sampleRate;
    
    // Initialize channel data with test patterns
    this._channelData = [];
    for (let i = 0; i < this.numberOfChannels; i++) {
      const data = new Float32Array(this.length);
      // Create a simple sine wave pattern for testing
      for (let j = 0; j < this.length; j++) {
        data[j] = Math.sin(2 * Math.PI * 440 * j / this.sampleRate) * 0.5;
      }
      this._channelData.push(data);
    }
  }

  getChannelData(channel: number): Float32Array {
    if (channel < 0 || channel >= this.numberOfChannels) {
      throw new Error(`Channel ${channel} does not exist`);
    }
    return this._channelData[channel];
  }

  copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void {
    const channelData = this.getChannelData(channelNumber);
    const start = startInChannel || 0;
    const end = Math.min(start + destination.length, channelData.length);
    
    for (let i = 0; i < end - start; i++) {
      destination[i] = channelData[start + i];
    }
  }

  copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void {
    const channelData = this.getChannelData(channelNumber);
    const start = startInChannel || 0;
    const end = Math.min(start + source.length, channelData.length);
    
    for (let i = 0; i < end - start; i++) {
      channelData[start + i] = source[i];
    }
  }
}

// Mock AudioNode base class
export class MockAudioNode {
  public context: MockAudioContext;
  public numberOfInputs: number = 1;
  public numberOfOutputs: number = 1;
  public channelCount: number = 2;
  public channelCountMode: ChannelCountMode = 'max';
  public channelInterpretation: ChannelInterpretation = 'speakers';
  private _connectedNodes: MockAudioNode[] = [];

  constructor(context: MockAudioContext) {
    this.context = context;
  }

  connect(destination: MockAudioNode | MockAudioParam, output?: number, input?: number): MockAudioNode {
    if (destination instanceof MockAudioNode) {
      this._connectedNodes.push(destination);
    }
    return destination as MockAudioNode;
  }

  disconnect(destination?: MockAudioNode | MockAudioParam, output?: number, input?: number): void {
    if (destination instanceof MockAudioNode) {
      const index = this._connectedNodes.indexOf(destination);
      if (index > -1) {
        this._connectedNodes.splice(index, 1);
      }
    } else {
      this._connectedNodes = [];
    }
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

// Mock AudioParam
export class MockAudioParam {
  public value: number = 0;
  public defaultValue: number = 0;
  public minValue: number = -3.4028235e38;
  public maxValue: number = 3.4028235e38;

  setValueAtTime(value: number, startTime: number): MockAudioParam {
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, endTime: number): MockAudioParam {
    this.value = value;
    return this;
  }

  exponentialRampToValueAtTime(value: number, endTime: number): MockAudioParam {
    this.value = value;
    return this;
  }

  setTargetAtTime(target: number, startTime: number, timeConstant: number): MockAudioParam {
    this.value = target;
    return this;
  }

  setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number): MockAudioParam {
    if (values.length > 0) {
      this.value = values[values.length - 1];
    }
    return this;
  }

  cancelScheduledValues(startTime: number): MockAudioParam {
    return this;
  }

  cancelAndHoldAtTime(cancelTime: number): MockAudioParam {
    return this;
  }
}

// Mock specific AudioNode types
export class MockGainNode extends MockAudioNode {
  public gain: MockAudioParam;

  constructor(context: MockAudioContext) {
    super(context);
    this.gain = new MockAudioParam();
    this.gain.value = 1.0;
  }
}

export class MockBiquadFilterNode extends MockAudioNode {
  public frequency: MockAudioParam;
  public detune: MockAudioParam;
  public Q: MockAudioParam;
  public gain: MockAudioParam;
  public type: BiquadFilterType = 'lowpass';

  constructor(context: MockAudioContext) {
    super(context);
    this.frequency = new MockAudioParam();
    this.frequency.value = 350;
    this.detune = new MockAudioParam();
    this.Q = new MockAudioParam();
    this.Q.value = 1;
    this.gain = new MockAudioParam();
  }

  getFrequencyResponse(frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array): void {
    // Simple mock implementation
    for (let i = 0; i < frequencyHz.length; i++) {
      magResponse[i] = 1.0;
      phaseResponse[i] = 0.0;
    }
  }
}

export class MockAudioBufferSourceNode extends MockAudioNode {
  public buffer: MockAudioBuffer | null = null;
  public detune: MockAudioParam;
  public loop: boolean = false;
  public loopEnd: number = 0;
  public loopStart: number = 0;
  public playbackRate: MockAudioParam;
  public onended: ((this: AudioBufferSourceNode, ev: Event) => any) | null = null;

  constructor(context: MockAudioContext) {
    super(context);
    this.detune = new MockAudioParam();
    this.playbackRate = new MockAudioParam();
    this.playbackRate.value = 1;
  }

  start(when?: number, offset?: number, duration?: number): void {
    // Simulate async playback completion
    setTimeout(() => {
      if (this.onended) {
        this.onended.call(this as any, new Event('ended'));
      }
    }, 100);
  }

  stop(when?: number): void {}
}

export class MockAnalyserNode extends MockAudioNode {
  public fftSize: number = 2048;
  public frequencyBinCount: number = 1024;
  public minDecibels: number = -100;
  public maxDecibels: number = -30;
  public smoothingTimeConstant: number = 0.8;

  constructor(context: MockAudioContext) {
    super(context);
  }

  getByteFrequencyData(array: Uint8Array): void {
    // Fill with mock frequency data
    for (let i = 0; i < array.length && i < this.frequencyBinCount; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  getByteTimeDomainData(array: Uint8Array): void {
    // Fill with mock time domain data
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.floor(Math.sin(i * 0.1) * 127);
    }
  }

  getFloatFrequencyData(array: Float32Array): void {
    // Fill with mock frequency data in dB
    for (let i = 0; i < array.length && i < this.frequencyBinCount; i++) {
      array[i] = this.minDecibels + Math.random() * (this.maxDecibels - this.minDecibels);
    }
  }

  getFloatTimeDomainData(array: Float32Array): void {
    // Fill with mock time domain data
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.sin(i * 0.1);
    }
  }
}

// Mock OfflineAudioContext
export class MockOfflineAudioContext extends MockAudioNode {
  public sampleRate: number;
  public currentTime: number = 0;
  public listener: any = {};
  public state: AudioContextState = 'running';
  public destination: MockAudioNode;
  public length: number;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    super(null as any);
    this.context = this;
    this.sampleRate = sampleRate;
    this.length = length;
    this.destination = new MockAudioNode(this);
  }

  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode(this);
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode(this);
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number): MockAudioBuffer {
    return new MockAudioBuffer({ numberOfChannels, length, sampleRate });
  }

  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode(this);
  }

  decodeAudioData(audioData: ArrayBuffer): Promise<MockAudioBuffer> {
    // Simulate decoding with a mock buffer
    return Promise.resolve(new MockAudioBuffer({
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100
    }));
  }

  startRendering(): Promise<MockAudioBuffer> {
    return Promise.resolve(new MockAudioBuffer({
      numberOfChannels: 2,
      length: this.length,
      sampleRate: this.sampleRate
    }));
  }

  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }

  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  dispatchEvent(event: Event): boolean { return true; }
}

// Mock AudioContext (extends OfflineAudioContext for simplicity)
export class MockAudioContext extends MockOfflineAudioContext {
  public baseLatency: number = 0.01;
  public outputLatency: number = 0.05;

  constructor() {
    super(2, 44100, 44100);
  }

  getOutputTimestamp(): AudioTimestamp {
    return {
      contextTime: this.currentTime,
      performanceTime: performance.now()
    };
  }
}

// Global setup function for tests
export function setupAudioContextMocks() {
  // Mock global AudioContext
  (global as any).AudioContext = MockAudioContext;
  (global as any).webkitAudioContext = MockAudioContext;
  (global as any).OfflineAudioContext = MockOfflineAudioContext;
  (global as any).webkitOfflineAudioContext = MockOfflineAudioContext;

  // Mock AnalyserNode
  (global as any).AnalyserNode = MockAnalyserNode;
  (global as any).GainNode = MockGainNode;
  (global as any).BiquadFilterNode = MockBiquadFilterNode;
  (global as any).AudioBufferSourceNode = MockAudioBufferSourceNode;
}

// Cleanup function
export function cleanupAudioContextMocks() {
  delete (global as any).AudioContext;
  delete (global as any).webkitAudioContext;
  delete (global as any).OfflineAudioContext;
  delete (global as any).webkitOfflineAudioContext;
  delete (global as any).AnalyserNode;
  delete (global as any).GainNode;
  delete (global as any).BiquadFilterNode;
  delete (global as any).AudioBufferSourceNode;
}

export default {
  MockAudioContext,
  MockOfflineAudioContext,
  MockAudioBuffer,
  MockAudioNode,
  MockGainNode,
  MockBiquadFilterNode,
  MockAudioBufferSourceNode,
  MockAnalyserNode,
  setupAudioContextMocks,
  cleanupAudioContextMocks
};