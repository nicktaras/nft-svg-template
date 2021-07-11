const cheerio = require('cheerio');
const template = require('./labelled_autograph_template');

const { 
  getAllTemplateData,
  applyTemplateDimensions,
  applyBackgroundImage, 
  applyTimeStamp, 
  applyStatus, 
  applyNotSignedLabel,
  removeNotSignedLabel,
  applyAutographs,
  applyFontAndLabelColours,
  getFinalOutput,
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

  const $ = cheerio.load(template);

  let { 
    image,
    templateStatus,
    contentType,
    imgW, 
    imgH,
    fontColour, 
    labelColour,
    rootPixelSize,
    innerPadding
  } = await getAllTemplateData({ $, imageUrl, data });

  applyTemplateDimensions({ $, imgW, imgH });
  applyBackgroundImage({ $, contentType, image, imgW, imgH });

  applyNotSignedLabel({
    $,
    templateStatus,
    innerPadding, 
    rootPixelSize,
    elements: [
      {
        elementName: '.autograph-nft-not-signed text tspan', 
        eq: 0, 
        attr: { x: innerPadding * 1.2, y: innerPadding * 2.2, 'font-size': rootPixelSize * 1.6 }
      },
      { 
        elementName: '.autograph-nft-not-signed text tspan', 
        eq: 1, 
        attr: { x: innerPadding * 1.2, y: innerPadding * 3.5, 'font-size': rootPixelSize * 1.6 }
      },
      {
        elementName: '.autograph-nft-not-signed rect', 
        eq: 0, 
        attr: { x: innerPadding, y: innerPadding, width: rootPixelSize * 11, height: rootPixelSize * 3.65 }
      }
    ]
  });

  removeNotSignedLabel($, templateStatus);
  
  await applyAutographs({ 
    $,
    data, 
    imgH, 
    imgW,
    innerPadding,
    rootPixelSize, 
    labelContainerElement: '.autograph-nft-label-container',
    labelMarginTopBottom: 1.1,
    labelHeight: rootPixelSize * 1.7
  });

  applyTimeStamp({
    $,
    elementName: '.autograph-nft-timestamp text', 
    eq: 0,
    attr: { x: innerPadding, y: -(imgW - innerPadding * 1.5), 'font-size': rootPixelSize * 1 },
    text: data[0].mark
  });

  applyStatus({ 
    $,
    elementName: '.autograph-nft-status text', 
    eq: 0, 
    attr: { 'font-size': rootPixelSize * 0.8, y: rootPixelSize * 3.2, },
    text: data[0].title
  });

  applyFontAndLabelColours({
    $,
    fontColour, 
    labelColour,
    labels: '.autograph-nft-label rect, .autograph-nft-not-signed rect',
    text: '.autograph-nft-status text, .autograph-nft-timestamp text'
  });

  return await getFinalOutput({
    $,
    format,
    base64Encode
  });
};
