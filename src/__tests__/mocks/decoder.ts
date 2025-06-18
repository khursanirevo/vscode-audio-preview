/**
 * Mock implementation of the audio decoder module
 */

export interface MockDecoder {
  readAudioInfo(): void;
  decode(): void;
  dispose(): void;
  sampleRate: number;
  numChannels: number;
  length: number;
  samples: Float32Array[];
}

class MockDecoderImpl implements MockDecoder {
  public sampleRate = 44100;
  public numChannels = 2;
  public length = 441000;
  public samples: Float32Array[] = [
    new Float32Array(441000).fill(0.1),
    new Float32Array(441000).fill(0.1)
  ];

  readAudioInfo(): void {
    // Mock implementation
  }

  decode(): void {
    // Mock implementation - samples already populated
  }

  dispose(): void {
    // Mock implementation
  }
}

const MockDecoder = {
  async create(fileData: Uint8Array): Promise<MockDecoder> {
    return new MockDecoderImpl();
  }
};

export default MockDecoder;