const getColors = require('get-image-colors');
const Jimp = require('jimp');

/*
  FUNCTION: 
  isLightContrastImage();

  USE:
  returns a boolean if the given image is light or dark. A use case
  being to determine is white or black text should be overlayed onto the image. 

  interface: {
    imageUrl
  }

  NOTES:

  The detect method is a private function to this script
  which calculates the output.  

  At this time the area is fixed, but can be adjusted easily to
  meet new requirements. This function best performs checking a small area of pixels.

*/

const detect = async ({
  imageBuffer, 
  x, 
  y, 
  dx, 
  dy, 
  allowedTextColors
}) => {

  let image;
  let result = [];
  let diffsum;

  try {
      image = await Jimp.read(imageBuffer);
      // crop image to detect only selected area
      image.crop( x, y, dx, dy );
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
      result.sort((item1,item2)=>item2.diff - item1.diff );

  } catch (e) {
      console.log('Something went wrong:', e);
  }
  return result[0].palette;
}

module.exports = async ({
  imageBuffer,
  x,
  y,
  dx,
  dy
}) => {

  // required in format '#xxxxxx', #xxx not allowed
  const allowedTextColors = ['#ffffff', '#000000'];

  // example output: '#ffffff', '#000000'
  const output = await detect({ 
      imageBuffer, 
      x,
      y,
      dx,
      dy,
      allowedTextColors
  });
  
  return !(output === "#ffffff") ? true : false;

};
