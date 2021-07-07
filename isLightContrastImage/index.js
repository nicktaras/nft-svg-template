const sharp = require('sharp');

/*
  FUNCTION: 
  isLightContrastImage();

  USE:
  returns a boolean if the given image is light or dark. A use case
  being to determine is white or black text should be overlayed onto the image. 

  interface: imageBuffer 

  NOTES:

  getRGBLuminance calculates the luminance of a pixel. The logic applied is based
  upon https://www.w3.org/TR/WCAG20-TECHS/G18.html

  At this time the area is fixed, but can be adjusted easily to
  meet new requirements. This function best performs checking a small area of pixels.

  TODO:

  For better detection, break the image into squares (e.g. 20 parts) and test one pixel 
  per part, to gain an idea of the colour of the pixels across the image for a more
  accurate reading at the similar compute cost

*/

const getRGBLuminance = (r, g, b) => {
  var a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow( (v + 0.055) / 1.055, 2.4 );
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const mean = (numbers) => (numbers.reduce((a, b) => a + b) / numbers.length);

module.exports = async (imageBuffer) => {
  // store list of pixels (0,1's based on ouput).
  const colorList = [];
  // width/height of image (increase for more accuracy & cost in performance)
  const widthHeight = 4;
  // get image data
  const { data } = await sharp(imageBuffer)
  .resize({ width: widthHeight })
  .raw()
  .toBuffer({ resolveWithObject: true });
  // get pixel array from buffer
  const pixelArray = new Uint8ClampedArray(data.buffer);
  // loop through rgb values to determin the luminance of the image
  for(var i = 0; i < pixelArray.length / 3; i++){
    var startPixel = i * 3;
    var r = pixelArray[startPixel];
    var g = pixelArray[startPixel + 1];
    var b = pixelArray[startPixel + 2];
    const pixel = getRGBLuminance(r, g, b);
    const pixelB = 0;
    const ratio = pixel > pixelB
    ? ((pixelB + 0.05) / (pixel + 0.05))
    : ((pixel + 0.05) / (pixelB + 0.05));
    colorList.push(ratio);
  }
  // get average luminance value of light vs dark pixels.
  const avg = mean(colorList);
  
  console.log("avg is:", avg, (avg <= 0.22) ? "this is a light image" : "this is a dark image");

  return (avg <= 0.22) ? true : false;
};
