const sharp = require('sharp');
const getDimensionsSVG = require('./getDimensionsSVG');
const getDimensionsIMG = require('./getDimensionsIMG');
const googleFontData = require('./googleFontData');
const recursiveFetch = require('./recursiveFetch');
const isLightContrastImage = require('./isLightContrastImage/index');

const getTemplateStatus = (title) => {
  if (title.toUpperCase().startsWith('SIGNED')) return "SIGNED";
  else if (title.toUpperCase().startsWith('SIGNING')) return "SIGNING";
  else return undefined;
}

const getShortestDimension = (a, b) => { return a < b ? a : b }

const getIMGDimensions = async ({ $, contentType, image }) => {
  if (contentType === 'image/svg') {
    const svgEl = $(image);
    const getSVGDimensions = getDimensionsSVG(svgEl);
    return { imgW: getSVGDimensions.imgW, imgH: getSVGDimensions.imgH }
  } else {
    const getIMGDimensions = await getDimensionsIMG(image);
    return { imgW: getIMGDimensions.imgW, imgH: getIMGDimensions.imgH }
  }
}

const getImageFallbackHandler = async ({ contentType, image }) => { 
  if (contentType === 'image/webp') {
    image = await sharp(image).toFormat('jpg').toBuffer();
    contentType = 'image/jpg';
  }
  return {
    image,
    contentType
  };
}

const getColourTheme = async (image) => {
  const lightContrastImage = await isLightContrastImage(image);
  const darkColourTheme = { 
    fontColour: "white", 
    labelColour: "black" 
  }
  const lightColourTheme = { 
    fontColour: "black", 
    labelColour: "white" 
  };
  return lightContrastImage ? lightColourTheme : darkColourTheme;
}

const applyNotSignedLabel = ({ 
  $,
  templateStatus,
  elements
 }) => {
  if (templateStatus === "SIGNING") {
    elements.map((data) => {
      const { elementName, eq, attr } = data;
      applyToTemplate({
        $,
        elementName, 
        eq, 
        attr
      });
    });
  }
}
const removeNotSignedLabel = ({ $, templateStatus }) => {
  if (templateStatus === 'SIGNED') $('.autograph-nft-not-signed').remove();
}

const applyFontAndLabelColours = ({ 
  $, 
  fontColour,
  labelColour,
  labels,
  text
}) => {
  $(labels).css({ fill: labelColour });
  $(text).css({ fill: fontColour });
}

const applyToTemplate = ({ $, elementName, eq, attr, text }) => {
  const el = $(elementName).eq(eq);
  if(attr) { el.attr(attr); }   
  if(text) { el.text(text); }
}

const applyTemplateDimensions = ({ $, imgW, imgH }) => $('.autograph-nft-wrapper').css({ height: imgH, width: imgW }).attr({ viewBox: `0 0 ${imgW} ${imgH}` });

const applyBackgroundImage = ({ $, contentType, image, imgW, imgH }) => {
  if (contentType === 'image/svg') {
    const svgEl = $(image);
    $('.autograph-nft-image-container').html(svgEl);
  } else {
    const imageBase64 = `data:${contentType};base64,` + image.toString('base64');
    $('.autograph-nft-image-container image').eq(0).attr({ href: imageBase64, height: imgH, width: imgW });
  }
}

const getBase64TwitterImage = async (photoURL) => {
  const { image, contentType } = await recursiveFetch(photoURL);
  const imagePhotoURLBuffer = await sharp(image).toBuffer();
  return `data:${contentType};base64, ${imagePhotoURLBuffer.toString('base64')}`;
}

const makeLabel = ({
  x, 
  y, 
  width, 
  height, 
  fontSize, 
  text, 
  innerPadding, 
  twitterImageSize,  
  twitterImg, 
}) => {
  return `<svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}"><rect x="0" y="0" width="${width}" height="${height}" style="black" fill-opacity="0.3" rx="2"></rect><text x="0" y="0" style="font-family: 'Barlow'; fill:white;" font-size="${fontSize}">${text}</text><svg x="${innerPadding}" y="${innerPadding}" width="${twitterImageSize}" height="${twitterImageSize}"><defs><clipPath id="myCircle"><circle cx="${twitterImageSize / 2}" cy="${twitterImageSize / 2}" r="${twitterImageSize / 2}" fill="#FFFFFF" /></clipPath></defs><image href="${twitterImg}" width="${twitterImageSize}" height="${twitterImageSize}" clip-path="url(#myCircle)" /></svg></svg>`;
}

const makeLabelText = ({ 
  x, 
  y,
  width, 
  character
}) => { return `<tspan x="${x}" y="${y}" width=${width}>${character}</tspan>`; };


const getSignaturePartial = ({ name, id, x, y, rootPixelSize }) => {
  let textWidth = 0;
  let text = '';
  // example input to map function [@,B,e,e,p,l,e,.,3,4,6,4,6,6,5,6,4]
  [...name.match(/./g), ...['.'], ...id.match(/./g)].map(
    character => {
      let characterWidth = googleFontData[character];
      if (!characterWidth) characterWidth = googleFontData[1]; // fall back if no character is found.
      text += makeLabelText({ x: x + textWidth, y, width: characterWidth, character });
      textWidth += characterWidth * (rootPixelSize * 0.065);
    }
  );
  return {
    text,
    textWidth
  }
}

const makeMoreLabel = ({
  x,
  y,
  width,
  height,
  fontSize,
  textX,
  textY,
  remainingLabels
}) => {
  return `<svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}"><g><rect x="0" y="0" width="${width}" height="${height}" style="fill:rgb(255,255,255)" fill-opacity="0.24" rx="2"></rect><text style="font-family: 'Barlow'; fill:white;" font-size="${fontSize}"><tspan x="${textX}" y="${textY}">AND ${remainingLabels} MORE...</tspan></text></g></svg>`;
}

const getBottomLabelPositionY = ({
  labelHeight,
  labelMarginTopBottom,
  data,
  innerPadding,
  index,
  imgH
}) => {
  const labelPositionByIndex = index * (labelHeight * labelMarginTopBottom);
  const offset = data.length > 3 ? labelHeight * 1.8 : 0;
  const addinnerPadding = data.length <= 3 ? innerPadding : 0;
  const yPos = imgH - labelHeight - labelPositionByIndex - offset - addinnerPadding;
  return yPos;
}

const applyAutographs = async ({ 
  $, 
  data, 
  rootPixelSize, 
  labelContainerElement, 
  imgH, 
  imgW,
  innerPadding,
  labelMarginTopBottom,
  labelHeight,
}) => {

  // Collect the last three labels (upto 3 will be shown in the view)
  let labelData = data.slice(0, 3);

  // Reverse order to build the labels up the NFT (last to first)
  labelData = labelData.reverse();

  // Apply Labels
  let labelTemplates = '';
  let lastLabelYPos = 0;

  await Promise.all(labelData.map(async (label, index) => {
    const yPos = getBottomLabelPositionY({ 
      labelHeight,
      labelMarginTopBottom,
      data,
      innerPadding,
      index,
      imgH
    });

    console.log(yPos);
    
    lastLabelYPos = yPos;

    let { text, textWidth } = getSignaturePartial({ 
      x: rootPixelSize * 1.7,
      y: rootPixelSize * 1.2,
      rootPixelSize: rootPixelSize,
      name: label.name, 
      id: label.twitterId,
    });

    const twitterIdProfileWidth = rootPixelSize * 1.9;
    const twitterImageWidth = rootPixelSize * 1.4;
    const imgPadding = rootPixelSize * 0.15;
    const autographFontSize = rootPixelSize * 1.1;
    const imagePhotoURLBase64 = await getBase64TwitterImage(label.photoURL);
    textWidth += twitterIdProfileWidth;
    
    labelTemplates += makeLabel({ 
      x: imgW - textWidth - innerPadding,
      y: yPos,
      width: textWidth,
      height: labelHeight,
      fontSize: autographFontSize,
      text: text,
      innerPadding: imgPadding,
      twitterImageSize: twitterImageWidth,
      twitterImg: imagePhotoURLBase64
     });
    
    // When there are a max of 3 labels and more to show.
    if (data.length > 3 && index === 2) {
      const maxLabelTemplate = makeMoreLabel({
        x: imgW - autographFontSize * 6.5 - innerPadding,
        y: imgH - labelHeight * 1.7,
        width: autographFontSize * 6.5,
        height: labelHeight,
        fontSize: autographFontSize,
        textX: rootPixelSize * 0.2,
        textY: rootPixelSize * 1.2,
        remainingLabels: data.length - 3
      });
      labelTemplates += maxLabelTemplate;
    }
  }))

  $(labelContainerElement).eq(0).append(`${labelTemplates}`);

}

const getBase64Output = ({ format, output }) => {
  let outContentType;
  switch (format.toLowerCase()) {
    case 'svg':
      outContentType = 'image/svg+xml';
      break;
    case 'png':
      outContentType = 'image/png';
      break;
    case 'jpeg':
      outContentType = 'image/jpeg';
      break;
    default:
      throw new Error(
        `Unsupported image format '${format.toLocaleLowerCase()}'`
      );
  }
  return `data:${outContentType};base64,${output.toString('base64')}`;
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
  if (base64Encode) output = getBase64Output;
  return output;
}

const getImageData = async ({ $, imageUrl }) => {
  let { image, contentType } = await recursiveFetch(imageUrl);
  const { imgW, imgH } = await getIMGDimensions({ $, contentType, image });
  const shortestDimension = getShortestDimension(imgW, imgH);
  const { fontColour, labelColour } = await getColourTheme(image);
  // if webp return png
  ({ image, contentType } = await getImageFallbackHandler({ contentType, image }));
  return {
    image,
    contentType,
    imgW, 
    imgH,
    shortestDimension,
    fontColour, 
    labelColour
  }
}

// apply template dimensions and the background image
const applyImageData = ({ $, contentType, image, imgW, imgH }) => {
  applyTemplateDimensions({ $, imgW, imgH });
  applyBackgroundImage({ $, contentType, image, imgW, imgH });
}

module.exports = {
  getImageData,
  applyImageData,
  getBottomLabelPositionY,
  applyFontAndLabelColours,
  getIMGDimensions,
  getShortestDimension,
  applyTemplateDimensions,
  applyBackgroundImage,
  getImageFallbackHandler,
  applyToTemplate,
  getTemplateStatus,
  applyNotSignedLabel,
  removeNotSignedLabel,
  applyAutographs,
  getColourTheme,
  getFinalOutput
};