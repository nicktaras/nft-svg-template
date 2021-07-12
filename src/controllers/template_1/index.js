
const template = require('./../../templates/template_1');
const cheerio = require('cheerio');
const {
  getImageData,
  applyImageData,
  applyToTemplate,
  applyNotSignedLabel,
  removeNotSignedLabel,
  applyAutographs,
  applyFontAndLabelColours,
  getFinalOutput,
  getTemplateStatus,
  getBottomLabelPositionY
} = require('./../../services/imageGeneratorFunctions');

const build = async (imageUrl, data, base64Encode, format = 'svg') => {

  const $ = cheerio.load(template);

  // read image data to get (height, width, most suitable font colour...)
  let { image, contentType, imgW,  imgH, shortestDimension, fontColour,  labelColour } = await getImageData({ $, imageUrl });

  // e.g. 'SIGNED'
  const templateStatus = getTemplateStatus(data[0].title);
  
  // define font sizing
  const rootPixelSize = (shortestDimension / 16) * 0.64;
  
  // inner padding of design
  const innerPadding = shortestDimension * 0.05;  
  
  // apply the image dimensions to the SVG template
  applyImageData({ $, contentType, image, imgW, imgH })

  // apply the not signed label
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

  // when the nft is signed generate without this label
  removeNotSignedLabel({ $, templateStatus });
  
  // apply the autographs
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

  // style timestamp and apply text
  applyToTemplate({
    $,
    elementName: '.autograph-nft-timestamp text', 
    attr: { x: innerPadding, y: -(imgW - innerPadding * 1.5), 'font-size': rootPixelSize * 1 },
    eq: 0,
    text: data[0].mark
  });

  // style status and apply text
  applyToTemplate({
    $,
    elementName: '.autograph-nft-status text', 
    attr: { 'font-size': rootPixelSize * 0.8, y: rootPixelSize * 3.2, },
    eq: 0,
    text: data[0].title
  });

  const applyStatusText = ({
    
  }) => {

  }
  
  const yPos = getBottomLabelPositionY({ 
    labelHeight: rootPixelSize * 1.7,
    labelMarginTopBottom: 1.1,
    data,
    innerPadding,
    index: data.slice(0, 3).length -1,
    imgH
  });

  // Status text positioning (should be updated to be dynamic).
  let xPosStatus;
  if (data[0].title.toUpperCase().indexOf('SIGNED') > -1) {
    xPosStatus = imgW - rootPixelSize * 3.2 - innerPadding;
  } else if (data[0].title.toUpperCase().indexOf('SIGNING') > -1) {
    xPosStatus = imgW - rootPixelSize * 3.8 - innerPadding;
  } else {
    xPosStatus = imgW - rootPixelSize * 5.2 - innerPadding;
  }
  $('.autograph-nft-status').attr({ x: xPosStatus, y: yPos - rootPixelSize * 4 });
  $('.autograph-nft-status text').attr({ 'font-size': rootPixelSize * 0.8, y: rootPixelSize * 3.2 });

  // apply colour scheme to template
  applyFontAndLabelColours({
    $,
    fontColour, 
    labelColour,
    labels: '.autograph-nft-label rect, .autograph-nft-not-signed rect',
    text: '.autograph-nft-not-signed text, .autograph-nft-label text, .autograph-nft-status text, .autograph-nft-timestamp text'
  });

  return await getFinalOutput({
    $,
    format,
    base64Encode
  });
};

module.exports = {
  build
};