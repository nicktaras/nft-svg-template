const googleFontData = require('./../data/googleFontData');

// Build a label with autograph and twitter image
const makeLabel = ({ x,  y,  width,  height,  fontSize,  text,  innerPadding,  twitterImageSize,   twitterImg,  fontColour,  labelColour }) => {
  return `<svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}"><rect x="0" y="0" width="${width}" height="${height}" fill="${labelColour}" fill-opacity="0.3" rx="2"></rect><text x="0" y="0" fill=${fontColour} style="font-family: 'Barlow';" font-size="${fontSize}">${text}</text><svg x="${innerPadding}" y="${innerPadding}" width="${twitterImageSize}" height="${twitterImageSize}"><defs><clipPath id="myCircle"><circle cx="${twitterImageSize / 2}" cy="${twitterImageSize / 2}" r="${twitterImageSize / 2}" fill="#FFFFFF" /></clipPath></defs><image href="${twitterImg}" width="${twitterImageSize}" height="${twitterImageSize}" clip-path="url(#myCircle)" /></svg></svg>`;
}

// add a text label to the template, used to add the Status and Timestamp.
const applyTextLabel = ({ $, x, y, fontSize, fontColour, partial, insertAfterElement }) => {
  var p = $(partial).attr({ x, y, 'font-size': fontSize, 'fill': fontColour });
  $(p).insertAfter(insertAfterElement).eq(0);
}

// adds an additional label when there are more autographs but no more can be shown
const makeMoreLabel = ({ x, y, width, height, fontSize, textX, textY, remainingLabels, labelColour, fontColour}) => {
  return `<svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}"><g><rect x="0" y="0" width="${width}" height="${height}" fill="${labelColour}" fill-opacity="0.24" rx="2"></rect><text style="font-family: 'Barlow';" font-size="${fontSize}"><tspan fill="${fontColour}" x="${textX}" y="${textY}">AND ${remainingLabels} MORE...</tspan></text></g></svg>`;
}

// Returns a parital svg element with one character inside
// This is used to give accuracy to determine the width of sets of characters (where the generator determines)
// where is letter is placed.
const makeLabelText = ({ x, y,width, character }) => { return `<tspan x="${x}" y="${y}" width=${width}>${character}</tspan>`; };


const getSignaturePartial = ({ name, id, x, y, rootPixelSize, fontColour }) => {
  let textWidth = 0;
  let text = '';
  // example input to map function [@,B,e,e,p,l,e,.,3,4,6,4,6,6,5,6,4]
  [...name.match(/./g), ...['.'], ...id.match(/./g)].map(
    character => {
      let characterWidth = googleFontData[character];
      if (!characterWidth) characterWidth = googleFontData[1]; // fall back if no character is found.
      text += makeLabelText({ x: x + textWidth, y, width: characterWidth, character, fontColour });
      textWidth += characterWidth * (rootPixelSize * 0.065);
    }
  );
  return { text, textWidth };
}

const applyAutographs = ({ 
  $, 
  autographLength, 
  rootPixelSize, 
  labelContainerElement, 
  imgH, 
  imgW,
  innerPadding,
  labelHeight,
  fontColour, 
  labelColour,
  labelDataWithImages
}) => {

  // reverse order to build the labels up the NFT (last to first)
  labelData = labelDataWithImages.reverse();

  // space between each label (e.g. labelHeight * 1.1)
  const labelMarginTopBottom = 1.1;

  // string container for labels to be appended to template
  let labelTemplates = '';

  labelData.map(async (label, index) => {

    const yPos = getBottomLabelPositionY({ 
      labelHeight,
      labelMarginTopBottom,
      autographLength,
      innerPadding,
      index,
      imgH
    });
    
    let { text, textWidth } = getSignaturePartial({ 
      x: rootPixelSize * 1.7,
      y: rootPixelSize * 1.2,
      rootPixelSize: rootPixelSize,
      name: label.name, 
      id: label.twitterId,
      fontColour
    });

    const twitterIdProfileWidth = rootPixelSize * 1.9;
    const twitterImageWidth = rootPixelSize * 1.4;
    const imgPadding = rootPixelSize * 0.15;
    const autographFontSize = rootPixelSize * 1.1;
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
      twitterImg: label.twitterProfileImage,
      fontColour, 
      labelColour,
     });
    // When there are a max of 3 labels and more to show.
    if (autographLength > labelDataWithImages.length && index === labelDataWithImages.length - 1) {
      const maxLabelTemplate = makeMoreLabel({
        x: imgW - autographFontSize * 6.5 - innerPadding,
        y: imgH - labelHeight * 1.7,
        width: autographFontSize * 6.5,
        height: labelHeight,
        fontSize: autographFontSize,
        textX: rootPixelSize * 0.2,
        textY: rootPixelSize * 1.2,
        remainingLabels: autographLength - labelDataWithImages.length,
        fontColour,
        labelColour,
      });
      labelTemplates += maxLabelTemplate;
    }
  });

  $(labelContainerElement).eq(0).append(`${labelTemplates}`);
}

const applyNotSignedLabel = ({ templateStatus, $, x, y, width, height, fontSize, labelColour, fontColour, padding, partial, insertAfterElement }) => {
  if (templateStatus === "SIGNING") {
    $(partial).insertAfter(insertAfterElement).eq(0);
    $('.autograph-nft-not-signed text tspan').eq(0).attr({ x: x * 1.2, y: y * 2.2, 'font-size': fontSize, 'fill': fontColour });
    $('.autograph-nft-not-signed text tspan').eq(1).attr({ x: x * 1.2, y: y * 3.5, 'font-size': fontSize, 'fill': fontColour });
    $('.autograph-nft-not-signed rect').attr({ x: padding, y: padding, width, height, 'fill': labelColour });
  }
};

const getBottomLabelPositionY = ({
  labelHeight,
  labelMarginTopBottom,
  autographLength,
  innerPadding,
  index,
  imgH
}) => {
  const labelPositionByIndex = index * (labelHeight * labelMarginTopBottom);
  const offset = autographLength > 3 ? labelHeight * 1.8 : 0;
  const addinnerPadding = autographLength <= 3 ? innerPadding : 0;
  const yPos = imgH - labelHeight - labelPositionByIndex - offset - addinnerPadding;
  return yPos;
}

module.exports = {
  getBottomLabelPositionY,
  applyTextLabel,
  applyNotSignedLabel,
  applyAutographs
};
