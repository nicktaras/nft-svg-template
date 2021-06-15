const getColors = require('get-image-colors');
const Jimp = require('jimp');

/*
  FUNCTION: 
  isLightContrastImage();

  USE:
  returns a boolean if the given image is light or dark. A use case
  being to determine is white or black text should be overlayed onto the image. 

  interface: {
    imageBuffer (image buffer) 
  }

  NOTES:

  The current threshold between light and dark, is favouring white text.
  Adjustments should be made to even the output colour.

*/

const detect = async (imageBuffer, allowedTextColors) => {

  let image;
  let result = [];
  let diffsum;

  try {
      image = await Jimp.read(imageBuffer);
      // reduce size
      const maxHeightWidth = 10;
      const h = image.bitmap.height > maxHeightWidth ? maxHeightWidth: image.bitmap.height;
      const w = image.bitmap.width > maxHeightWidth ? maxHeightWidth: image.bitmap.width;
      // 
      image.resize(h, w).quality(50);
      // get colours from the right hand side of the image
      image.crop(w / 2, 0, 1, h / 2);
      // crop image to detect only selected area
      // image.crop( x, y, dx, dy );
      let newBuff = await image.getBufferAsync(Jimp.MIME_PNG);
      // detect most used color palette
      let colors = await getColors(newBuff, {
          // count of colors
          count: 1,
          // type of input fileBuffer
          type: Jimp.MIME_PNG
      });
      allowedTextColors.forEach(palette=>{
          // we can compare differenceSumPerColorChanel between allowed color palette items and
          colors.forEach(color => {
              diffsum = 0;
              // console.log(color.hex(), palette);
              var re = /^#([\da-z]{2})([\da-z]{2})([\da-z]{2})$/i;
              var foundColor = color.hex().toLowerCase().match(re);
              var foundPalette = palette.toLowerCase().match(re);
              diffsum = Math.abs(parseInt(foundColor[1], 16) - parseInt(foundPalette[1], 16)) +
                  Math.abs(parseInt(foundColor[2], 16) - parseInt(foundPalette[2], 16)) +
                  Math.abs(parseInt(foundColor[3], 16) - parseInt(foundPalette[3], 16));
              result.push({diff: diffsum,palette});
          })
      });
      result.sort((item1, item2) => item2.diff - item1.diff);
  } catch (e) {
      console.log('Something went wrong:', e);
  }

  // fall back allowing the application to generate image
  if(!result || !result[0] || !result[0].palette) return "#ffffff";

  return result[0].palette;
}

module.exports = async (imageBuffer) => {

  // required in format '#xxxxxx', #xxx not allowed
  const allowedTextColors = ['#ffffff', '#000000'];

  // example output: '#ffffff', '#000000'
  const output = await detect(imageBuffer, allowedTextColors);
  
  return !(output === "#ffffff") ? true : false;

};
