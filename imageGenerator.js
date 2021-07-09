const cheerio = require('cheerio');
const recursiveFetch = require('./recursiveFetch');
// lib to detect image contrast returning if image is light or dark
const isLightContrastImage = require('./isLightContrastImage');

// Autograph Templates
const template = require('./htmlTemplates/labelled_autograph_template');

const { 
  appendImageDimensions,
  appendBackgroundImage, 
  getLowestNumber,
  applyToTemplate,
  assignInputImage,
  getTemplateStatus,
  getIMGDimensions,
  applyManyToTemplate,
  removeNotSignedLabelCheck,
  appendAutographs,
  getOutput
} = require('./imageGeneratorFunctions');

/*
  FUNCTION:
  imageGenerator();

  USE:
  Generates an image from the given inputs (see interface below)

  interface: {
    imageUrl
    data: [
    {
      title: string; (Title of NFT)
      photoURL: string; (Photo of Twitter User)
      name: string; (Name of Twitter User)
      twitterId: string; (Handle)
      mark: string; (Like: 1507.27FEB2021)
    }
    ],
    base64Encode,
    format ('svg' or 'png')
  }
*/

module.exports = async (imageUrl, data, base64Encode, format = 'svg') => {
  
  // load SVG template
  const $ = cheerio.load(template);
  let { image, contentType } = await recursiveFetch(imageUrl);
  image = await assignInputImage({ contentType, image });
  const { imgW, imgH } = await getIMGDimensions({ $, contentType, image });
  const shortestInLength = getLowestNumber(imgW, imgH);
  const rootPixelSize = (shortestInLength / 16) * 0.64;
  const outerMargin = shortestInLength * 0.05;
  const templateStatus = getTemplateStatus(data[0].title);
  appendImageDimensions({ $, imgW, imgH });
  appendBackgroundImage({ $, contentType, image, imgW, imgH });
  applyToTemplate({
    $,
    elementName: '.autograph-nft-timestamp text', 
    eq: 0, 
    attr: { x: outerMargin, y: -(imgW - outerMargin * 1.5), 'font-size': rootPixelSize * 1 },
    text: data[0].mark
  });
  if (templateStatus === "SIGNING") {
    applyManyToTemplate({
      $,
      outerMargin, 
      rootPixelSize,
      elements: [
        { 
          elementName: '.autograph-nft-not-signed text tspan', 
          eq: 0, 
          attr: { x: outerMargin * 1.2, y: outerMargin * 2.2, 'font-size': rootPixelSize * 1.6 }
        },
        { 
          elementName: '.autograph-nft-not-signed text tspan', 
          eq: 1, 
          attr: { x: outerMargin * 1.2, y: outerMargin * 3.5, 'font-size': rootPixelSize * 1.6 }
        },
        {
          elementName: '.autograph-nft-not-signed rect', 
          eq: 0, 
          attr: { x: outerMargin, y: outerMargin, width: rootPixelSize * 11, height: rootPixelSize * 3.65 }
        }
      ]
    });
  }
  removeNotSignedLabelCheck($, templateStatus);
  await appendAutographs({ 
    $, 
    data, 
    imgH, 
    imgW,
    outerMargin,
    rootPixelSize, 
    labelContainerElement: '.autograph-nft-label-container' 
  });
  const isLightImage = await isLightContrastImage(image);
  const fontColourTheme = isLightImage ? 'black' : 'white';
  const labelBackgroundColourTheme = isLightImage ? 'black' : 'white';
  $('.autograph-nft-label rect, .autograph-nft-not-signed rect').css({
    fill: labelBackgroundColourTheme,
  });
  $('.autograph-nft-status text, .autograph-nft-timestamp text').attr({
    fill: fontColourTheme,
  });
  applyToTemplate({ 
    $,
    elementName: '.autograph-nft-status text', 
    eq: 0, 
    attr: { fill: fontColourTheme, 'font-size': rootPixelSize * 0.8, y: rootPixelSize * 3.2, },
    text: data[0].title
  });
  return await getOutput({
    $,
    format,
    base64Encode
  });
};
