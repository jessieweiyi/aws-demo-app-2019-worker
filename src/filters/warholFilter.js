import Jimp from 'jimp';
import Filter from './filter';

const COLOUR_1 = [{ r: 255, g: 0, b: 128 },
  { r: 255, g: 0, b: 0 },
  { r: 255, g: 165, b: 0 },
  { r: 72, g: 61, b: 139 }];
const COLOUR_2 = [{ r: 255, g: 255, b: 0 },
  { r: 0, g: 128, b: 0 },
  { r: 0, g: 0, b: 128 },
  { r: 255, g: 0, b: 0 }];
const COLOUR_3 = [{ r: 255, g: 0, b: 128 },
  { r: 0, g: 128, b: 0 },
  { r: 245, g: 245, b: 245 },
  { r: 85, g: 107, b: 47 }];
const COLOUR_4 = [{ r: 0, g: 128, b: 0 },
  { r: 255, g: 165, b: 0 },
  { r: 220, g: 220, b: 220 },
  { r: 249, g: 251, b: 25 }];

export default class WarholFilter extends Filter {
  constructor(config) {
    super(config);
    this.colorPlatettes = [];
    this.colorPlatettes.push(WarholFilter.getOrderedColorPlatette(COLOUR_1));
    this.colorPlatettes.push(WarholFilter.getOrderedColorPlatette(COLOUR_2));
    this.colorPlatettes.push(WarholFilter.getOrderedColorPlatette(COLOUR_3));
    this.colorPlatettes.push(WarholFilter.getOrderedColorPlatette(COLOUR_4));
  }

  process(image) {
    return new Promise((resolve, reject) => {
      const { width, height } = image.bitmap;
      // eslint-disable-next-line no-new
      new Jimp(width * 2, height * 2, (createError, destImage) => {
        if (createError) {
          reject(createError);
        }
        try {
          this.renderImage(image, destImage, width, height);
        } catch (renderError) {
          reject(renderError);
        }
        resolve(destImage);
      });
    });
  }

  renderImage(image, destImage, width, height) {
    const sourceImageDetails = WarholFilter.getSourceImageColorDetails(image);
    this.colorPlatettes.forEach((colorPlatette, index) => {
      const clusters = WarholFilter.calculateClusters(sourceImageDetails.minBrightness,
        sourceImageDetails.maxBrightness,
        colorPlatette.length);

      sourceImageDetails.pixels.forEach((pixel) => {
        const outputColor = WarholFilter.getOutputColor(pixel, clusters, colorPlatette);
        const xLoc = pixel.x + (width * Math.floor(index / 2));
        const yLoc = pixel.y + (height * (index % 2));
        const hex = Jimp.rgbaToInt(outputColor.r, outputColor.g, outputColor.b, 255);
        destImage.setPixelColor(hex, xLoc, yLoc);
      });
    });
  }

  static getOutputColor(color, clusters, colorPlatette) {
    for (let i = 0; i < clusters.length; i += 1) {
      if (color.brightness < clusters[i]) {
        return colorPlatette[i];
      }
    }

    return colorPlatette[clusters.length - 1];
  }

  static calculateClusters(minBrightness, maxBrightness, numClusters) {
    const output = [];
    const average = (maxBrightness - minBrightness) / numClusters;
    for (let i = 0; i < numClusters - 1; i += 1) {
      output.push(minBrightness + (average * i));
    }
    output.push(maxBrightness);
    return output;
  }

  static getSourceImageColorDetails(image) {
    const output = {};
    output.pixels = [];

    const { width, height } = image.bitmap;

    let min = WarholFilter.computeBrightness({ r: 255, g: 255, b: 255 });
    let max = 0;

    for (let xIndex = 0; xIndex < width; xIndex += 1) {
      for (let yIndex = 0; yIndex < height; yIndex += 1) {
        const pixel = image.getPixelColor(xIndex, yIndex);
        const color = Jimp.intToRGBA(pixel);
        const brightness = WarholFilter.computeBrightness(color);
        output.pixels.push({
          x: xIndex, y: yIndex, color, brightness
        });
        if (brightness > max) {
          max = brightness;
        }
        if (brightness < min) {
          min = brightness;
        }
      }
    }

    output.maxBrightness = max;
    output.minBrightness = min;
    return output;
  }

  static getOrderedColorPlatette(colors) {
    const colorsWithBrightness = [];
    colors.forEach((color) => {
      const brightness = WarholFilter.computeBrightness(color);
      colorsWithBrightness.push(Object.assign({}, color, brightness));
    });
    return colorsWithBrightness.sort((a, b) => a.brightness - b.brightness);
  }

  static computeBrightness(color) {
    return (0.2126 * color.r) + (0.7152 * color.g) + (0.0722 * color.b);
  }
}
