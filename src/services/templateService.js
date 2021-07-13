const sharp = require('sharp');
const { getBase64Image } = require('./imageService');

const applyTemplateDimensions = ({ $, imgW, imgH }) => $('.autograph-nft-wrapper').css({ height: imgH, width: imgW }).attr({ viewBox: `0 0 ${imgW} ${imgH}` });

const applyBackgroundImage = ({ $, contentType, image, imgW, imgH }) => {
  if (contentType === 'image/svg') {
    const svgEl = $(image);
    $('.autograph-nft-image-container').html(svgEl);
  } else {
    $('.autograph-nft-image-container image').eq(0).attr({ href: getBase64Image({ contentType, imageBuffer: image }), height: imgH, width: imgW });
  }
}

// remove the outer html wrapper and return the svg data
const prepareOutputXmlTemplate = ($) => {
  const removeList = ['<html><head></head><body>', '</body></html>'];
  $('script').remove();
  output = $.html();
  removeList.map(item => { output = output.replace(item, '') });
  return output;
}

const preparePngOutput = async (output) => {
  output = Buffer.from(output);
  const pngOutput = await sharp(output)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      quality: 90,
    })
    .toBuffer();
  return pngOutput;
}

const getFinalOutput = async ({
  $,
  format,
  base64Encode
}) => {
  output = prepareOutputXmlTemplate($);
  if (format.toUpperCase() === 'PNG') output = await preparePngOutput(output);
  if (base64Encode) output = getBase64Output({ format, imageBuffer: output });
  return output;
}

// apply template dimensions and the background image
const applyImageData = ({ $, contentType, image, imgW, imgH }) => {
  applyTemplateDimensions({ $, imgW, imgH });
  applyBackgroundImage({ $, contentType, image, imgW, imgH });
}

const percToNumber = ({ baseNumber, requiredPerc }) => baseNumber * (requiredPerc / 100);

const getTemplateStatus = (title) => {
  if (title.toUpperCase().startsWith('SIGNED')) return "SIGNED";
  else if (title.toUpperCase().startsWith('SIGNING')) return "SIGNING";
  else return undefined;
}

// TODO: Include the font for this label so it can be made dynamic.
// when complete this can be removed and the text will be able to align itself.
const getStatusXPos = ({ title, imgW, rootPixelSize, innerPadding }) => {
  labelStatusXpos = 0;
  if (title.toUpperCase().indexOf('SIGNED') > -1) labelStatusXpos = imgW - rootPixelSize * 3.2 - innerPadding;
  else if (title.toUpperCase().indexOf('SIGNING') > -1) labelStatusXpos = imgW - rootPixelSize * 3.8 - innerPadding;
  else labelStatusXpos = imgW - rootPixelSize * 5.2 - innerPadding;
  return labelStatusXpos;
}

module.exports = {
  getStatusXPos,
  applyImageData,
  applyTemplateDimensions,
  applyBackgroundImage,
  getFinalOutput,
  percToNumber,
  getTemplateStatus
};

