const template = require('./../../templates/template_1');

const cheerio = require('cheerio');

const { 
  percToNumber,
  getTemplateStatus,
  applyImageData, 
  getFinalOutput,
  getStatusXPos
} = require('./../../services/templateService');

const { 
  applyNotSignedLabel, 
  applyAutographs, 
  applyTextLabel,
  getBottomLabelPositionY
} = require('./../../services/labelService');

const { 
  getImage,
  getShortestDimension, 
  getImageFallbackHandler, 
  getColourTheme, 
  getIMGDimensions, 
  enrichTwitterLabelDataWithImages 
} = require('./../../services/imageService');

// template controller to compose the desired output.

const build = async (imageUrl, data, base64Encode, format) => {

  const $ = cheerio.load(template);

  const maxSignaturesShown = 3;

  let { 
    image, 
    contentType 
  } = await getImage(imageUrl);

  const { 
    imgW, 
    imgH 
  } = await getIMGDimensions({ $, contentType, image });

  const { 
    fontColour, 
    labelColour 
  } = await getColourTheme(image);

  const { 
    labelDataWithImages 
  } = await enrichTwitterLabelDataWithImages({ data, numberOfImages: maxSignaturesShown });

  ({ 
    image, 
    contentType 
  } = await getImageFallbackHandler({ contentType, image }));

  // Template variables:
  const shortestDimension = getShortestDimension(imgW, imgH);
  const templateStatus = getTemplateStatus(data[0].title); 
  const rootPixelSize = (shortestDimension / 16) * 0.64;
  const innerPadding = percToNumber({ baseNumber: shortestDimension, requiredPerc: 5 });
  const labelHeight = rootPixelSize * 1.7;
  const labelStatusXpos = getStatusXPos({ title: data[0].title.toUpperCase(), imgW, rootPixelSize, innerPadding });
  const labelStatusYPos = getBottomLabelPositionY({ 
    labelHeight, 
    labelMarginTopBottom: 1.1, 
    autographLength: data.length > labelDataWithImages.length ? labelDataWithImages.length + 1 : labelDataWithImages.length, 
    innerPadding,
    index: labelDataWithImages.length - 1, 
    imgH
  }) - (rootPixelSize * .7);

  const notSignedWidth = rootPixelSize * 11;
  const notSignedHeight = rootPixelSize * 3.65;
  const notSignedFontSize = rootPixelSize * 1.6;
  const statusFontSize = rootPixelSize * 0.8;
  const timeStampYPos = -(imgW - innerPadding * 1.5);

  // apply the image dimensions to the SVG template
  applyImageData({ $, contentType, image, imgW, imgH });

  // NOT SIGNED
  applyNotSignedLabel({
    templateStatus,
    $,
    x: innerPadding, 
    y: innerPadding,
    padding: innerPadding,
    width: notSignedWidth,
    height: notSignedHeight,
    fontSize: notSignedFontSize, 
    labelColour,
    fontColour, 
    partial: `
      <g class="autograph-nft-not-signed">
        <rect fill-opacity="0.4"></rect>
        <text style="font-family: 'Barlow'; fill: white; font-style: italic;">
          <tspan>Not Signed</tspan>
          <tspan>Ongoing Offer!</tspan>
        </text>
      </g>
    `,
    insertAfterElement: '.autograph-nft-image-container'
  });
    
  // STATUS
  applyTextLabel({
    $,
    x: labelStatusXpos,
    y: labelStatusYPos,
    fontSize: statusFontSize,
    fontColour,
    partial: `<text class="autograph-nft-status" xmlns="http://www.w3.org/2000/svg" style="fill: white; font-family: 'Source Code Pro'" x="0" y="30">${data[0].title}</text>`,
    insertAfterElement: '.autograph-nft-image-container'
  });

  // TIMESTAMP
  applyTextLabel({ 
    $,
    x: innerPadding,
    y: timeStampYPos, 
    fontSize: rootPixelSize,
    fontColour,
    partial: `<text class="autograph-nft-timestamp" xmlns="http://www.w3.org/2000/svg" style="fill: white; font-family: 'Source Code Pro'" transform="rotate(90)">${data[0].mark}</text>`,
    insertAfterElement: '.autograph-nft-image-container'
  });

  // AUTOGRAPH
  applyAutographs({
    $,
    autographLength: data.length,
    imgH, 
    imgW,
    innerPadding,
    rootPixelSize, 
    labelContainerElement: '.autograph-nft-label-container',
    labelHeight,
    fontColour,
    labelColour,
    labelDataWithImages
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