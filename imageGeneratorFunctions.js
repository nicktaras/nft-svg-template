const sharp = require('sharp');
const getDimensionsSVG = require('./getDimensionsSVG');
const getDimensionsIMG = require('./getDimensionsIMG');
const googleFontData = require('./googleFontData');
const recursiveFetch = require('./recursiveFetch');

const getIMGDimensions = async ({ $, contentType, image }) => {
  if (contentType === 'image/svg') 
  {
    const svgEl = $(image);
    const getSVGDimensions = getDimensionsSVG(svgEl);
    return { imgW: getSVGDimensions.imgW, imgH: getSVGDimensions.imgH }
  } 
    else 
  {
    const getIMGDimensions = await getDimensionsIMG(image);
    return { imgW: getIMGDimensions.imgW, imgH: getIMGDimensions.imgH }
  }
}

const getLowestNumber = (a, b) => { return a < b ? a : b }

const appendImageDimensions = ({ $, imgW, imgH }) => {
  return $('.autograph-nft-wrapper').css({ height: imgH, width: imgW }).attr({ viewBox: `0 0 ${imgW} ${imgH}` });
}

const appendBackgroundImage = ({ $, contentType, image, imgW, imgH }) => {
  if (contentType === 'image/svg') 
  {
    const svgEl = $(image);
    $('.autograph-nft-image-container').html(svgEl);
  } 
    else 
  {
    const imageBase64 = `data:${contentType};base64,` + image.toString('base64');
    $('.autograph-nft-image').eq(0).attr({ href: imageBase64, height: imgH, width: imgW });
  }
}

const assignInputImage = async ({ contentType, image }) => { 
  if (contentType === 'image/webp') image = await sharp(image).toFormat('jpg').toBuffer();
  return image;
}

const applyToTemplate = ({ $, elementName, eq, attr, text }) => {
  const el = $(elementName).eq(eq);
  if(attr) { el.attr(attr); }   
  if(text) { console.log(text); el.text(text); }
}

const applyManyToTemplate = ({ $, elements }) => {
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

const getTemplateStatus = (title) => {
  if (title.toUpperCase().startsWith('SIGNED')) return "SIGNED";
  else if (title.toUpperCase().startsWith('SIGNING')) return "SIGNING";
  else return undefined;
}

const removeNotSignedLabelCheck = (templateStatus) => {
  if (templateStatus === 'SIGNED') $('.autograph-nft-not-signed').remove();
}

const appendAutographs = async ({ 
  $, 
  data, 
  rootPixelSize, 
  labelContainerElement, 
  imgH, 
  imgW,
  outerMargin
}) => {
  // Collect the last three labels (upto 3 will be shown in the view)
  let labelData = data.slice(0, 3);

  // Reverse order to build the labels up the NFT (last to first)
  labelData = labelData.reverse();

  // Apply Labels
  let labelTemplates = '';
  let lastLabelYPos = 0;

  await Promise.all(labelData.map(async (label, index) => {
    // Position the labels based on the scale of the image
    const labelHeight = rootPixelSize * 1.7;
    let textWidth = 0;
    const space = 1.1;
    const labelPositionByIndex = index * (labelHeight * space);
    const offset = data.length > 3 ? labelHeight * 1.8 : 0;
    const addOuterMargin = data.length <= 3 ? outerMargin : 0;
    const yPos = imgH - labelHeight - labelPositionByIndex - offset - addOuterMargin;
    lastLabelYPos = yPos;
    // Placeholder to build SVG label text
    let autographSVGText = '';
    // Start position beside the Twitter profile image
    const startPosX = rootPixelSize * 1.7;
    // Text width (incremented as the letters are defined in SVG)
    textWidth = 0;
    // e.g. [@,B,e,e,p,l,e,.,3,4,6,4,6,6,5,6,4]
    [...label.name.match(/./g), ...['.'], ...label.twitterId.match(/./g)].map(
      char => {
        let val = googleFontData[char];
        if (!val) val = googleFontData[1];
        autographSVGText += `<tspan x="${startPosX + textWidth}" y="${
          rootPixelSize * 1.2
        }" width=${val}>${char}</tspan>`;
        // adjust for spacing between letters
        textWidth += val * (rootPixelSize * 0.065);
      }
    );
    const twitterIdProfileWidth = rootPixelSize * 1.9; // width of twitter image with margin left/right
    const twitterImageWidth = rootPixelSize * 1.4; // twitter image inside label
    const imgPadding = rootPixelSize * 0.15; // padding top / left for image
    const autographFontSize = rootPixelSize * 1.1;
    const twitterData = await recursiveFetch(label.photoURL);
    const imagePhotoURLBuffer = await sharp(twitterData.image).toBuffer();
    const photoURLContentType = await twitterData.contentType;
    const imagePhotoURLBase64 = `data:${photoURLContentType};base64, ${imagePhotoURLBuffer.toString('base64')}`;
    textWidth += twitterIdProfileWidth;
    // build label templates
    labelTemplates += `<svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${
      imgW - textWidth - outerMargin
    }" y="${yPos}"><rect x="0" y="0" width="${textWidth}" height="${
      rootPixelSize * 1.7
    }" style="black" fill-opacity="0.3" rx="2"></rect><text x="0" y="0" style="font-family: 'Barlow'; fill:white;" font-size="${autographFontSize}">${autographSVGText}</text><svg x="${imgPadding}" y="${imgPadding}" width="${twitterImageWidth}" height="${twitterImageWidth}"><defs><clipPath id="myCircle"><circle cx="${
      twitterImageWidth / 2
    }" cy="${twitterImageWidth / 2}" r="${
      twitterImageWidth / 2
    }" fill="#FFFFFF" /></clipPath></defs><image href="${imagePhotoURLBase64}" width="${twitterImageWidth}" height="${twitterImageWidth}" clip-path="url(#myCircle)" /></svg></svg>`;
    if (data.length > 3 && index === 2) {
      const yPos = imgH - labelHeight * 1.7;
      const maxLabelTemplate = `
        <svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${
          imgW - autographFontSize * 6.5 - outerMargin
        }" y="${yPos}">
          <g>
            <rect x="0" y="0" width="${
              autographFontSize * 6.5
            }" height="${labelHeight}" style="fill:rgb(255,255,255)" fill-opacity="0.24" rx="2"></rect>
            <text style="font-family: 'Barlow'; fill:white;" font-size="${autographFontSize}">
              <tspan x="${rootPixelSize * 0.2}" y="${rootPixelSize * 1.2}">AND ${
        data.length - 3
      } MORE...</tspan>
            </text>
          </g>
        </svg>
      `;
      labelTemplates += maxLabelTemplate;
    }
  }))
  // Status text positioning
  let xPosStatus;
  if (data[0].title.toUpperCase().indexOf('SIGNED') > -1) {
    xPosStatus = imgW - rootPixelSize * 3.2 - outerMargin;
  } else if (data[0].title.toUpperCase().indexOf('SIGNING') > -1) {
    xPosStatus = imgW - rootPixelSize * 3.8 - outerMargin;
  } else {
    xPosStatus = imgW - rootPixelSize * 5.2 - outerMargin;
  }
  console.log(lastLabelYPos);
  $('.autograph-nft-status').attr({
    x: xPosStatus,
    y: lastLabelYPos - rootPixelSize * 4
  });
  $('.autograph-nft-status text').attr({
    'font-size': rootPixelSize * 0.8,
    y: rootPixelSize * 3.2,
  });
  // Append all the labels to the Remixed NFT template
  $(labelContainerElement).eq(0).append(`${labelTemplates}`);
}

const getOutput = async ({
  $,
  format,
  base64Encode
}) => {

  // prepare output
  const removeList = ['<html><head></head><body>', '</body></html>'];

  // remove any script/s from output
  $('script').remove();

  // output is SVG wrapped in html
  output = $.html();

  // remove the outer html wrapper
  removeList.map(item => {
    output = output.replace(item, '');
  });

  output = Buffer.from(output);

  // define image data return type
  if (format.toUpperCase() === 'PNG') {
    const pngOutput = await sharp(output)
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        quality: 90,
      })
      .toBuffer();
    output = pngOutput;
  }

  // Base64 output if parameter flag set to true
  if (base64Encode) {
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

    output = `data:${outContentType};base64,${output.toString('base64')}`;
  }

  return output;
}

module.exports = {
  getIMGDimensions,
  getLowestNumber,
  appendImageDimensions,
  appendBackgroundImage,
  assignInputImage,
  applyToTemplate,
  applyManyToTemplate,
  getTemplateStatus,
  removeNotSignedLabelCheck,
  appendAutographs,
  getOutput
};