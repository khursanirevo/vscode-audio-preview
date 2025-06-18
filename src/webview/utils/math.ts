// Mathematical utility functions extracted from AnalyzeService

/**
 * Round input value to the nearest nice number, which has the most significant digit of 1, 2, 5
 * @param input - The input number to round
 * @returns [rounded value, number of decimal digits for display]
 */
export function roundToNearestNiceNumber(input: number): [number, number] {
  const niceNumbers = [1.0, 2.0, 5.0, 10.0];

  if (input <= 0) {
    return [0, 0];
  } // this function only works for positive number

  // input = mantissa * 10^exponent
  const exponent = Math.floor(Math.log10(input));
  const mantissa = input / Math.pow(10, exponent);

  // find which number in niceNumbers is nearest
  const dist: number[] = niceNumbers.map((value) =>
    Math.abs(Math.log10(mantissa) - Math.log10(value)),
  );
  const niceNumber = niceNumbers[dist.indexOf(Math.min(...dist))];

  const rounded = niceNumber * Math.pow(10, exponent);
  let digit = niceNumber === 10.0 ? -exponent - 1 : -exponent;
  digit = digit <= 0 ? 0 : digit; // avoid -0

  return [rounded, digit];
}

/**
 * Convert frequency from Hz to Mel scale
 * @param hz - Frequency in Hz
 * @returns Frequency in Mel scale
 */
export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

/**
 * Convert frequency from Mel scale to Hz
 * @param mel - Frequency in Mel scale
 * @returns Frequency in Hz
 */
export function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1);
}
