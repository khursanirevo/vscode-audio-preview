export default function createAudioContext(sampleRate: number): AudioContext {
  return new AudioContext({ sampleRate });
}