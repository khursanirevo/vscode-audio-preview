import { roundToNearestNiceNumber, hzToMel, melToHz } from "./math";

describe("Math Utilities", () => {
  describe("roundToNearestNiceNumber", () => {
    it("rounds to nice numbers correctly", () => {
      // Test basic nice number rounding
      expect(roundToNearestNiceNumber(1.3)[0]).toBeCloseTo(1.0);
      expect(roundToNearestNiceNumber(1.8)[0]).toBeCloseTo(2.0);
      expect(roundToNearestNiceNumber(3.5)[0]).toBeCloseTo(5.0);
      expect(roundToNearestNiceNumber(7.5)[0]).toBeCloseTo(10.0);
    });

    it("handles different scales", () => {
      // Test with larger numbers
      expect(roundToNearestNiceNumber(13)[0]).toBeCloseTo(10);
      expect(roundToNearestNiceNumber(18)[0]).toBeCloseTo(20);
      expect(roundToNearestNiceNumber(35)[0]).toBeCloseTo(50);
      expect(roundToNearestNiceNumber(75)[0]).toBeCloseTo(100);

      // Test with smaller numbers
      expect(roundToNearestNiceNumber(0.13)[0]).toBeCloseTo(0.1);
      expect(roundToNearestNiceNumber(0.18)[0]).toBeCloseTo(0.2);
      expect(roundToNearestNiceNumber(0.35)[0]).toBeCloseTo(0.5);
      expect(roundToNearestNiceNumber(0.75)[0]).toBeCloseTo(1.0);
    });

    it("returns correct decimal digits", () => {
      // Test digit count for display
      const [, digits1] = roundToNearestNiceNumber(1.3);
      expect(digits1).toBe(0);

      const [, digits2] = roundToNearestNiceNumber(0.13);
      expect(digits2).toBe(1);

      const [, digits3] = roundToNearestNiceNumber(0.013);
      expect(digits3).toBe(2);

      const [, digits4] = roundToNearestNiceNumber(13);
      expect(digits4).toBe(0);

      const [, digits5] = roundToNearestNiceNumber(130);
      expect(digits5).toBe(0);
    });

    it("handles edge cases", () => {
      // Test zero and negative numbers
      expect(roundToNearestNiceNumber(0)).toEqual([0, 0]);
      expect(roundToNearestNiceNumber(-5)).toEqual([0, 0]);

      // Test very small positive numbers
      const [value, digits] = roundToNearestNiceNumber(0.00001);
      expect(value).toBeGreaterThan(0);
      expect(digits).toBeGreaterThanOrEqual(0);

      // Test very large numbers
      const [largeValue, largeDigits] = roundToNearestNiceNumber(1000000);
      expect(largeValue).toBeGreaterThan(0);
      expect(largeDigits).toBe(0);
    });

    it("chooses closest nice number", () => {
      // Test boundary cases between nice numbers
      expect(roundToNearestNiceNumber(1.5)[0]).toBeCloseTo(2.0); // Closer to 2 than 1
      expect(roundToNearestNiceNumber(3.0)[0]).toBeCloseTo(2.0); // Closer to 2 than 5
      expect(roundToNearestNiceNumber(6.0)[0]).toBeCloseTo(5.0); // Closer to 5 than 10
    });

    it("handles exact nice numbers", () => {
      // Test when input is already a nice number
      expect(roundToNearestNiceNumber(1.0)[0]).toBeCloseTo(1.0);
      expect(roundToNearestNiceNumber(2.0)[0]).toBeCloseTo(2.0);
      expect(roundToNearestNiceNumber(5.0)[0]).toBeCloseTo(5.0);
      expect(roundToNearestNiceNumber(10.0)[0]).toBeCloseTo(10.0);
    });
  });

  describe("hzToMel", () => {
    it("converts Hz to Mel scale correctly", () => {
      // Test known conversions
      expect(hzToMel(0)).toBeCloseTo(0, 1);
      expect(hzToMel(700)).toBeCloseTo(781.17, 1); // Using actual formula result
      expect(hzToMel(1000)).toBeCloseTo(1000.0, 0);
      expect(hzToMel(2000)).toBeCloseTo(1521.36, 1);
    });

    it("handles frequency range correctly", () => {
      // Test typical audio frequency range
      expect(hzToMel(100)).toBeGreaterThan(0);
      expect(hzToMel(440)).toBeGreaterThan(hzToMel(100)); // A4 note
      expect(hzToMel(22050)).toBeGreaterThan(hzToMel(440)); // Nyquist for 44.1kHz
    });

    it("is monotonically increasing", () => {
      // Mel scale should be monotonically increasing
      const freqs = [100, 200, 500, 1000, 2000, 5000, 10000];
      const mels = freqs.map(hzToMel);

      for (let i = 1; i < mels.length; i++) {
        expect(mels[i]).toBeGreaterThan(mels[i - 1]);
      }
    });

    it("handles edge cases", () => {
      // Test zero frequency
      expect(hzToMel(0)).toBe(0);

      // Test very small frequencies
      expect(hzToMel(1)).toBeGreaterThan(0);

      // Test very large frequencies
      expect(hzToMel(100000)).toBeGreaterThan(hzToMel(10000));
    });
  });

  describe("melToHz", () => {
    it("converts Mel to Hz correctly", () => {
      // Test known conversions
      expect(melToHz(0)).toBeCloseTo(0, 1);
      expect(melToHz(781.2)).toBeCloseTo(700, 0); // Using actual formula result
      expect(melToHz(1000.0)).toBeCloseTo(1000, 0);
      expect(melToHz(1521.4)).toBeCloseTo(2000, 0);
    });

    it("is inverse of hzToMel", () => {
      // Test that melToHz(hzToMel(x)) ≈ x
      const testFreqs = [100, 440, 1000, 2000, 5000, 10000, 22050];

      testFreqs.forEach((freq) => {
        const mel = hzToMel(freq);
        const backToHz = melToHz(mel);
        expect(backToHz).toBeCloseTo(freq, 0);
      });
    });

    it("is monotonically increasing", () => {
      // melToHz should be monotonically increasing
      const mels = [100, 500, 1000, 1500, 2000, 2500, 3000];
      const freqs = mels.map(melToHz);

      for (let i = 1; i < freqs.length; i++) {
        expect(freqs[i]).toBeGreaterThan(freqs[i - 1]);
      }
    });

    it("handles edge cases", () => {
      // Test zero mel
      expect(melToHz(0)).toBe(0);

      // Test very small mel values
      expect(melToHz(1)).toBeGreaterThan(0);

      // Test large mel values
      expect(melToHz(5000)).toBeGreaterThan(melToHz(1000));
    });
  });

  describe("Hz-Mel conversion round-trip", () => {
    it("maintains precision for typical audio frequencies", () => {
      // Test common audio frequencies
      const audioFreqs = [
        20, // Sub-bass
        60, // Bass
        250, // Low midrange
        500, // Midrange
        2000, // Upper midrange
        4000, // Presence
        8000, // Brilliance
        16000, // Air
        22050, // Nyquist for 44.1kHz
      ];

      audioFreqs.forEach((freq) => {
        const roundTrip = melToHz(hzToMel(freq));
        expect(roundTrip).toBeCloseTo(freq, 0);
      });
    });

    it("maintains precision for mel scale values", () => {
      // Test common mel scale values
      const melValues = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500];

      melValues.forEach((mel) => {
        const roundTrip = hzToMel(melToHz(mel));
        expect(roundTrip).toBeCloseTo(mel, 0);
      });
    });
  });

  describe("Performance and numerical stability", () => {
    it("handles extreme values without errors", () => {
      // Test that functions don't throw or return NaN/Infinity
      expect(() => hzToMel(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => melToHz(Number.MAX_SAFE_INTEGER)).not.toThrow();

      expect(isFinite(hzToMel(1e6))).toBe(true);
      expect(isFinite(melToHz(1e4))).toBe(true); // Use smaller value to avoid overflow
    });

    it("produces consistent results", () => {
      // Test that multiple calls with same input produce same output
      const freq = 1000;
      const mel1 = hzToMel(freq);
      const mel2 = hzToMel(freq);
      expect(mel1).toBe(mel2);

      const mel = 1500;
      const hz1 = melToHz(mel);
      const hz2 = melToHz(mel);
      expect(hz1).toBe(hz2);
    });
  });
});
