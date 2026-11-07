export function scratchCoverage(pixels: ArrayLike<number>) {
  let transparent = 0;
  let pixelCount = 0;
  for (let alpha = 3; alpha < pixels.length; alpha += 4) {
    pixelCount += 1;
    if (pixels[alpha] === 0) transparent += 1;
  }
  return pixelCount ? transparent / pixelCount : 0;
}
