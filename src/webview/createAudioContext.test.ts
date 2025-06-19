import createAudioContext from "./createAudioContext";
import { MockAudioContext } from "../__tests__/mocks/audioContext";

// Store the original mock
const originalAudioContext = (global as any).AudioContext;

// Create a jest mock for AudioContext
const mockAudioContextConstructor = jest
  .fn()
  .mockImplementation((options?: AudioContextOptions) => {
    return new MockAudioContext(options);
  });

// Override the global AudioContext with our mock
beforeAll(() => {
  (global as any).AudioContext = mockAudioContextConstructor;
});

// Restore after tests
afterAll(() => {
  (global as any).AudioContext = originalAudioContext;
});

describe("createAudioContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates AudioContext with specified sample rate", () => {
    const sampleRate = 44100;
    const context = createAudioContext(sampleRate);

    expect(mockAudioContextConstructor).toHaveBeenCalledWith({ sampleRate });
    expect(context.sampleRate).toBe(sampleRate);
  });

  it("creates AudioContext with different sample rates", () => {
    const testSampleRates = [8000, 16000, 22050, 44100, 48000, 96000];

    testSampleRates.forEach((sampleRate) => {
      const context = createAudioContext(sampleRate);
      expect(context.sampleRate).toBe(sampleRate);
    });

    expect(mockAudioContextConstructor).toHaveBeenCalledTimes(
      testSampleRates.length,
    );
  });

  it("returns AudioContext instance", () => {
    const context = createAudioContext(44100);

    // Should have AudioContext methods and properties
    expect(context).toHaveProperty("sampleRate");
    expect(context).toHaveProperty("createBuffer");
    expect(context).toHaveProperty("createBufferSource");
    expect(context).toHaveProperty("createGain");
    expect(context).toHaveProperty("close");
    expect(context).toHaveProperty("resume");
    expect(context).toHaveProperty("suspend");
  });

  it("handles high sample rates", () => {
    const highSampleRate = 192000;
    const context = createAudioContext(highSampleRate);

    expect(mockAudioContextConstructor).toHaveBeenCalledWith({
      sampleRate: highSampleRate,
    });
    expect(context.sampleRate).toBe(highSampleRate);
  });

  it("handles low sample rates", () => {
    const lowSampleRate = 8000;
    const context = createAudioContext(lowSampleRate);

    expect(mockAudioContextConstructor).toHaveBeenCalledWith({
      sampleRate: lowSampleRate,
    });
    expect(context.sampleRate).toBe(lowSampleRate);
  });

  it("preserves AudioContext constructor behavior", () => {
    const sampleRate = 48000;
    createAudioContext(sampleRate);

    // Verify constructor was called with exact options object
    const lastCall = mockAudioContextConstructor.mock.calls.slice(-1)[0];
    expect(lastCall[0]).toEqual({ sampleRate });
  });
});
