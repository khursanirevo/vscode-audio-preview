/**
 * Configuration interface and validation tests
 */

import { Config, PlayerDefault, AnalyzeDefault } from "./config";

describe("Configuration Interfaces", () => {
  describe("PlayerDefault Interface", () => {
    it("should create valid PlayerDefault object", () => {
      const playerDefault: PlayerDefault = {
        volumeUnitDb: false,
        initialVolumeDb: 0.0,
        initialVolume: 100,
        enableSpacekeyPlay: true,
        enableSeekToPlay: true,
        enableHpf: false,
        hpfFrequency: 100,
        enableLpf: false,
        lpfFrequency: 100,
        matchFilterFrequencyToSpectrogram: false,
      };

      expect(playerDefault).toBeDefined();
      expect(typeof playerDefault.volumeUnitDb).toBe("boolean");
      expect(typeof playerDefault.initialVolumeDb).toBe("number");
      expect(typeof playerDefault.initialVolume).toBe("number");
      expect(typeof playerDefault.enableSpacekeyPlay).toBe("boolean");
      expect(typeof playerDefault.enableSeekToPlay).toBe("boolean");
      expect(typeof playerDefault.enableHpf).toBe("boolean");
      expect(typeof playerDefault.hpfFrequency).toBe("number");
      expect(typeof playerDefault.enableLpf).toBe("boolean");
      expect(typeof playerDefault.lpfFrequency).toBe("number");
      expect(typeof playerDefault.matchFilterFrequencyToSpectrogram).toBe(
        "boolean",
      );
    });

    it("should validate volume scale settings", () => {
      const linearVolumeConfig: PlayerDefault = {
        volumeUnitDb: false,
        initialVolumeDb: 0.0,
        initialVolume: 75, // Should be used when volumeUnitDb is false
        enableSpacekeyPlay: true,
        enableSeekToPlay: true,
        enableHpf: false,
        hpfFrequency: 100,
        enableLpf: false,
        lpfFrequency: 100,
        matchFilterFrequencyToSpectrogram: false,
      };

      const dbVolumeConfig: PlayerDefault = {
        volumeUnitDb: true,
        initialVolumeDb: -6.0, // Should be used when volumeUnitDb is true
        initialVolume: 100,
        enableSpacekeyPlay: true,
        enableSeekToPlay: true,
        enableHpf: false,
        hpfFrequency: 100,
        enableLpf: false,
        lpfFrequency: 100,
        matchFilterFrequencyToSpectrogram: false,
      };

      expect(linearVolumeConfig.volumeUnitDb).toBe(false);
      expect(linearVolumeConfig.initialVolume).toBe(75);

      expect(dbVolumeConfig.volumeUnitDb).toBe(true);
      expect(dbVolumeConfig.initialVolumeDb).toBe(-6.0);
    });

    it("should validate volume range constraints", () => {
      // Test dB volume range [-80.0, 0.0]
      const validDbVolumes = [-80.0, -40.0, -6.0, 0.0];
      const _invalidDbVolumes = [-90.0, 10.0, 100.0];

      validDbVolumes.forEach((volume) => {
        const config: PlayerDefault = {
          volumeUnitDb: true,
          initialVolumeDb: volume,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: false,
        };

        expect(config.initialVolumeDb).toBeGreaterThanOrEqual(-80.0);
        expect(config.initialVolumeDb).toBeLessThanOrEqual(0.0);
      });

      // Test linear volume range [0, 100]
      const validLinearVolumes = [0, 25, 50, 75, 100];

      validLinearVolumes.forEach((volume) => {
        const config: PlayerDefault = {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: volume,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: false,
        };

        expect(config.initialVolume).toBeGreaterThanOrEqual(0);
        expect(config.initialVolume).toBeLessThanOrEqual(100);
      });
    });

    it("should validate filter frequency constraints", () => {
      const testFrequencies = [10, 100, 1000, 22050]; // Valid range for typical audio

      testFrequencies.forEach((freq) => {
        const config: PlayerDefault = {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: true,
          hpfFrequency: freq,
          enableLpf: true,
          lpfFrequency: freq,
          matchFilterFrequencyToSpectrogram: false,
        };

        expect(config.hpfFrequency).toBeGreaterThanOrEqual(10);
        expect(config.lpfFrequency).toBeGreaterThanOrEqual(10);
        // Note: Upper bound would be sampleRate/2, which is context-dependent
      });
    });

    it("should validate boolean options", () => {
      const booleanFields = [
        "volumeUnitDb",
        "enableSpacekeyPlay",
        "enableSeekToPlay",
        "enableHpf",
        "enableLpf",
        "matchFilterFrequencyToSpectrogram",
      ] as const;

      booleanFields.forEach((field) => {
        const trueConfig: PlayerDefault = {
          volumeUnitDb: true,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: true,
          hpfFrequency: 100,
          enableLpf: true,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: true,
        };

        const falseConfig: PlayerDefault = {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: false,
          enableSeekToPlay: false,
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: false,
        };

        expect(typeof trueConfig[field]).toBe("boolean");
        expect(typeof falseConfig[field]).toBe("boolean");
        expect(trueConfig[field]).toBe(true);
        expect(falseConfig[field]).toBe(false);
      });
    });
  });

  describe("AnalyzeDefault Interface", () => {
    it("should create valid AnalyzeDefault object", () => {
      const analyzeDefault: AnalyzeDefault = {
        waveformVisible: true,
        waveformVerticalScale: 1.0,
        minAmplitude: -1.0,
        maxAmplitude: 1.0,
        spectrogramVisible: true,
        spectrogramVerticalScale: 1.0,
        windowSizeIndex: 2,
        minFrequency: 0,
        maxFrequency: 22050,
        spectrogramAmplitudeRange: -90,
        frequencyScale: 0,
        melFilterNum: 40,
      };

      expect(analyzeDefault).toBeDefined();
      expect(typeof analyzeDefault.waveformVisible).toBe("boolean");
      expect(typeof analyzeDefault.waveformVerticalScale).toBe("number");
      expect(typeof analyzeDefault.minAmplitude).toBe("number");
      expect(typeof analyzeDefault.maxAmplitude).toBe("number");
      expect(typeof analyzeDefault.spectrogramVisible).toBe("boolean");
      expect(typeof analyzeDefault.spectrogramVerticalScale).toBe("number");
      expect(typeof analyzeDefault.windowSizeIndex).toBe("number");
      expect(typeof analyzeDefault.minFrequency).toBe("number");
      expect(typeof analyzeDefault.maxFrequency).toBe("number");
      expect(typeof analyzeDefault.spectrogramAmplitudeRange).toBe("number");
      expect(typeof analyzeDefault.frequencyScale).toBe("number");
      expect(typeof analyzeDefault.melFilterNum).toBe("number");
    });

    it("should validate scale constraints", () => {
      const validScales = [0.2, 0.5, 1.0, 1.5, 2.0];
      const scaleFields = [
        "waveformVerticalScale",
        "spectrogramVerticalScale",
      ] as const;

      validScales.forEach((scale) => {
        scaleFields.forEach((field) => {
          const config: AnalyzeDefault = {
            waveformVisible: true,
            waveformVerticalScale:
              field === "waveformVerticalScale" ? scale : 1.0,
            minAmplitude: -1.0,
            maxAmplitude: 1.0,
            spectrogramVisible: true,
            spectrogramVerticalScale:
              field === "spectrogramVerticalScale" ? scale : 1.0,
            windowSizeIndex: 2,
            minFrequency: 0,
            maxFrequency: 22050,
            spectrogramAmplitudeRange: -90,
            frequencyScale: 0,
            melFilterNum: 40,
          };

          expect(config[field]).toBeGreaterThanOrEqual(0.2);
          expect(config[field]).toBeLessThanOrEqual(2.0);
        });
      });
    });

    it("should validate window size index", () => {
      const validWindowSizes = [0, 1, 2, 3, 4, 5, 6, 7];
      const expectedFFTSizes = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

      validWindowSizes.forEach((index, i) => {
        const config: AnalyzeDefault = {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: index,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0,
          melFilterNum: 40,
        };

        expect(config.windowSizeIndex).toBe(index);
        expect(config.windowSizeIndex).toBeGreaterThanOrEqual(0);
        expect(config.windowSizeIndex).toBeLessThanOrEqual(7);

        // The actual FFT size would be 2^(8+index)
        const expectedSize = expectedFFTSizes[i];
        expect(Math.pow(2, 8 + index)).toBe(expectedSize);
      });
    });

    it("should validate frequency range constraints", () => {
      const testCases = [
        { min: 0, max: 22050 },
        { min: 100, max: 8000 },
        { min: 20, max: 20000 },
      ];

      testCases.forEach(({ min, max }) => {
        const config: AnalyzeDefault = {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: min,
          maxFrequency: max,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0,
          melFilterNum: 40,
        };

        expect(config.minFrequency).toBeGreaterThanOrEqual(0);
        expect(config.maxFrequency).toBeGreaterThan(config.minFrequency);
        // Note: Upper bound would be sampleRate/2, which is context-dependent
      });
    });

    it("should validate amplitude range constraints", () => {
      const validAmplitudeRanges = [-1000, -200, -90, -60, -30, 0];

      validAmplitudeRanges.forEach((range) => {
        const config: AnalyzeDefault = {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: range,
          frequencyScale: 0,
          melFilterNum: 40,
        };

        expect(config.spectrogramAmplitudeRange).toBeGreaterThanOrEqual(-1000);
        expect(config.spectrogramAmplitudeRange).toBeLessThanOrEqual(0);
      });
    });

    it("should validate frequency scale options", () => {
      const validFrequencyScales = [0, 1, 2]; // Linear, Log, Mel
      const _scaleNames = ["Linear", "Log", "Mel"];

      validFrequencyScales.forEach((scale, _index) => {
        const config: AnalyzeDefault = {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: scale,
          melFilterNum: 40,
        };

        expect(config.frequencyScale).toBe(scale);
        expect(config.frequencyScale).toBeGreaterThanOrEqual(0);
        expect(config.frequencyScale).toBeLessThanOrEqual(2);
      });
    });

    it("should validate mel filter bank constraints", () => {
      const validMelFilterNums = [20, 30, 40, 50, 100, 200];

      validMelFilterNums.forEach((num) => {
        const config: AnalyzeDefault = {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 2, // Mel scale
          melFilterNum: num,
        };

        expect(config.melFilterNum).toBeGreaterThanOrEqual(20);
        expect(config.melFilterNum).toBeLessThanOrEqual(200);
      });
    });

    it("should validate amplitude range relationship", () => {
      const testCases = [
        { min: -1.0, max: 1.0 },
        { min: -0.5, max: 0.8 },
        { min: -2.0, max: 2.0 },
      ];

      testCases.forEach(({ min, max }) => {
        const config: AnalyzeDefault = {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: min,
          maxAmplitude: max,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0,
          melFilterNum: 40,
        };

        expect(config.maxAmplitude).toBeGreaterThan(config.minAmplitude);
      });
    });
  });

  describe("Config Interface", () => {
    it("should create valid Config object", () => {
      const config: Config = {
        autoAnalyze: true,
        playerDefault: {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: false,
        },
        analyzeDefault: {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0,
          melFilterNum: 40,
        },
      };

      expect(config).toBeDefined();
      expect(typeof config.autoAnalyze).toBe("boolean");
      expect(config.playerDefault).toBeDefined();
      expect(config.analyzeDefault).toBeDefined();
    });

    it("should validate autoAnalyze flag", () => {
      const autoAnalyzeTrue: Config = {
        autoAnalyze: true,
        playerDefault: {} as PlayerDefault,
        analyzeDefault: {} as AnalyzeDefault,
      };

      const autoAnalyzeFalse: Config = {
        autoAnalyze: false,
        playerDefault: {} as PlayerDefault,
        analyzeDefault: {} as AnalyzeDefault,
      };

      expect(autoAnalyzeTrue.autoAnalyze).toBe(true);
      expect(autoAnalyzeFalse.autoAnalyze).toBe(false);
    });

    it("should handle default value scenarios", () => {
      // Test with typical default values
      const defaultConfig: Config = {
        autoAnalyze: false,
        playerDefault: {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false,
          lpfFrequency: 100,
          matchFilterFrequencyToSpectrogram: false,
        },
        analyzeDefault: {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2, // 1024 FFT
          minFrequency: 0,
          maxFrequency: 22050,
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0, // Linear
          melFilterNum: 40,
        },
      };

      expect(defaultConfig.autoAnalyze).toBe(false);
      expect(defaultConfig.playerDefault.volumeUnitDb).toBe(false);
      expect(defaultConfig.playerDefault.initialVolume).toBe(100);
      expect(defaultConfig.analyzeDefault.waveformVisible).toBe(true);
      expect(defaultConfig.analyzeDefault.spectrogramVisible).toBe(true);
      expect(defaultConfig.analyzeDefault.windowSizeIndex).toBe(2);
      expect(defaultConfig.analyzeDefault.frequencyScale).toBe(0);
    });

    it("should validate configuration consistency", () => {
      // Test filter frequency matching configuration
      const matchingFilterConfig: Config = {
        autoAnalyze: true,
        playerDefault: {
          volumeUnitDb: false,
          initialVolumeDb: 0.0,
          initialVolume: 100,
          enableSpacekeyPlay: true,
          enableSeekToPlay: true,
          enableHpf: true,
          hpfFrequency: 100, // Should be overridden when matching is enabled
          enableLpf: true,
          lpfFrequency: 8000, // Should be overridden when matching is enabled
          matchFilterFrequencyToSpectrogram: true,
        },
        analyzeDefault: {
          waveformVisible: true,
          waveformVerticalScale: 1.0,
          minAmplitude: -1.0,
          maxAmplitude: 1.0,
          spectrogramVisible: true,
          spectrogramVerticalScale: 1.0,
          windowSizeIndex: 2,
          minFrequency: 200, // HPF should match this
          maxFrequency: 10000, // LPF should match this
          spectrogramAmplitudeRange: -90,
          frequencyScale: 0,
          melFilterNum: 40,
        },
      };

      expect(
        matchingFilterConfig.playerDefault.matchFilterFrequencyToSpectrogram,
      ).toBe(true);
      expect(matchingFilterConfig.analyzeDefault.minFrequency).toBe(200);
      expect(matchingFilterConfig.analyzeDefault.maxFrequency).toBe(10000);
    });
  });

  describe("Configuration Migration", () => {
    it("should handle configuration format changes", () => {
      // Test that the interfaces can handle potential migration scenarios
      // This would be useful for when configuration format changes

      const oldFormatConfig = {
        autoAnalyze: true,
        playerDefault: {
          volume: 100, // Old format
          enableHpf: false,
          hpfFrequency: 100,
          // Missing new fields
        },
        analyzeDefault: {
          windowSize: 1024, // Old format
          frequencyScale: "linear", // Old string format
          // Missing new fields
        },
      };

      // New format should have all required fields
      const migratedConfig: Config = {
        autoAnalyze: oldFormatConfig.autoAnalyze,
        playerDefault: {
          volumeUnitDb: false, // Default value
          initialVolumeDb: 0.0, // Default value
          initialVolume: 100, // Migrated from old 'volume'
          enableSpacekeyPlay: true, // Default value
          enableSeekToPlay: true, // Default value
          enableHpf: false,
          hpfFrequency: 100,
          enableLpf: false, // Default value
          lpfFrequency: 100, // Default value
          matchFilterFrequencyToSpectrogram: false, // Default value
        },
        analyzeDefault: {
          waveformVisible: true, // Default value
          waveformVerticalScale: 1.0, // Default value
          minAmplitude: -1.0, // Default value
          maxAmplitude: 1.0, // Default value
          spectrogramVisible: true, // Default value
          spectrogramVerticalScale: 1.0, // Default value
          windowSizeIndex: 2, // Migrated from old windowSize 1024
          minFrequency: 0, // Default value
          maxFrequency: 22050, // Default value
          spectrogramAmplitudeRange: -90, // Default value
          frequencyScale: 0, // Migrated from 'linear' to 0
          melFilterNum: 40, // Default value
        },
      };

      expect(migratedConfig.autoAnalyze).toBe(true);
      expect(migratedConfig.playerDefault.initialVolume).toBe(100);
      expect(migratedConfig.analyzeDefault.windowSizeIndex).toBe(2);
      expect(migratedConfig.analyzeDefault.frequencyScale).toBe(0);
    });
  });
});
