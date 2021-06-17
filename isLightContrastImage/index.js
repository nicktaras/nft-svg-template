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

  https://codepen.io/andreaswik/pen/YjJqpK

*/
const reducer = (accumulator, currentValue) => accumulator + currentValue;
const detect = async (imageBuffer, allowedTextColors) => {

  let image;
  let output = "#fffffff";
  let diffsum;
  let colors;

  try {
      image = await Jimp.read(imageBuffer);
      let result = [];
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
      colors = await getColors(newBuff, {
          // count of colors
          count: 1,
          // type of input fileBuffer
          type: Jimp.MIME_PNG
      });
      allowedTextColors.forEach( palette => {
        colors.forEach(color => {
          diffsum = 0;
          console.log(color);
          result.push(color.luminance());
        })
      });

    
      // 100 // 10
      output = result.reduce(reducer) > colors.length / 2 ? "#000000" : "#FFFFFF";

  } catch (e) {
      console.log('Something went wrong:', e);
  }



  return output;
}

module.exports = async (imageBuffer) => {

  // required in format '#xxxxxx', #xxx not allowed
  const allowedTextColors = ['#ffffff', '#000000'];

  // example output: '#ffffff', '#000000'
  const output = await detect(imageBuffer, allowedTextColors);
  
  return !(output === "#ffffff") ? true : false;

};
