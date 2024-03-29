const cheerio = require('cheerio');
const svg64 = require('svg64');
const recursiveFetch = require('./recursiveFetch');
const sizeOf = require('image-size');
const sharp = require('sharp');
// lib to detect image contrast returning if image is light or dark
const isLightContrastImage = require('./isLightContrastImage');

// Reads the Barlow Font widths (needed to correctly calculate width of labels)
const googleFontData = require('./googleFontData');

// Autograph Templates
const template = require("./htmlTemplates/labelled_autograph_template");

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

module.exports = async (
  imageUrl,
  data,
  base64Encode,
  format
) => {

  let imgH,          // Height of Remix NFT
      imgW,          // Width of Remix NFT
      imageBuffer,   // Image buffer (png, gif, jpg)
      rootPixelSize, // Base font size calculated by the scale of the longest length of the image
      lastLabelYPos, // Used to apply the labels to the NFT + the Signed/Requested text
      outerMargin,   // percent based margin (will be calculated to be 5%)
      output         // return data
  
  // TODO add support for using CDDATA
  // Note: When xmlMode:true CDDATA is parsed correctly and SVG works.
  // however when xmlMode:true and the origin SVG doesn't contain CDDATA
  // it breaks. A solution must determine if the xmlMode should be true/false, based on 
  // if the input is an SVG and if it contains CDDATA.
  // for now, the image generator setting allows for SVG's without embedded CDDATA.
  var $ = cheerio.load(template); //, { xmlMode: true });
  
  // fetch the NFT Data 
  const imageUrlData = await recursiveFetch(imageUrl);
  
  // get Content type
  const contentType = await imageUrlData.headers.get('content-type');
  
  // if SVG
  if (contentType.indexOf("svg") > -1) {

    // get SVG element from response
    const svgUrlData = await imageUrlData.text();

    // get buffer for processing
    const svgBuffer = Buffer.from(svgUrlData);
    imageBuffer = await sharp(svgBuffer).toBuffer('png');
    
    // Original NFT
    const svgEl = $(svgUrlData);
    const svgViewBox = svgEl.attr('viewBox');
    const svgWidth = svgEl.attr('width');
    const svgHeight = svgEl.attr('height');
    let svgViewBoxData = svgViewBox ? svgEl.attr('viewBox').split(' ') : undefined;

    // Assign the height / width of original NFT to imgW, imgH
    if (svgViewBoxData){
      // apply height width of SVG from ViewBox values
      imgW = svgViewBoxData[2];
      imgH = svgViewBoxData[3];
    } else if(svgWidth && svgHeight) {
      // apply height width of SVG from W/H values
      imgW = svgWidth;
      imgH = svgHeight;
    } else {
      // fallback if an image size cannot be found
      imgW = 500;
      imgH = 500;
    }

    // Embed the SVG into the Remix SVG NFT
    $('.autograph-nft-image-container').append(svgUrlData);
  }

  // Image types; PNG, JPG, Gif: assign height and width to imgW, imgH.
  if (contentType.indexOf("svg") <= -1) {
    imageBuffer = await imageUrlData.buffer();

    // Fix for Linux to convert gif of Webp to PNG
    var fallBackTypes = ['image/gif', 'image/webp'];
    var isFallBackImage = fallBackTypes.includes(contentType);
    // convert fall back image to PNG
    if (isFallBackImage && format.toUpperCase() === "PNG") {
      const gifToPngBuffer = await sharp(imageBuffer).toBuffer('png');
      imageBuffer = gifToPngBuffer;
    }
    // base64 + define width/height from image data
    const imageBase64 = `data:image/${contentType};base64,`+imageBuffer.toString('base64');
    const dimensions = sizeOf(imageBuffer);
    imgH = dimensions.height;
    imgW = dimensions.width;
    // embed the data inside the image element
    $('.autograph-nft-image').eq(0).attr({ 
      'href': imageBase64, 
      'height': imgH,
      'width': imgW
    });
  }

  // set the image height and width and apply scale of labelling to image
  if (imgW && imgH) {

    // determine shortest in length (so we can apply the most suitable labelling size).
    shortestInLength = imgW < imgH ? imgW : imgH;

    // scale baseline of autograph / timestamp data 
    rootPixelSize = shortestInLength / 16 * 0.64;

    // Apply Calculation (height / width)
    $('.autograph-nft-wrapper')
    .css({ height: imgH, width: imgW })
    .attr({ 'viewBox': `0 0 ${imgW} ${imgH}` });

    // 5% outer margin
    outerMargin = shortestInLength * 0.05;

    $('.autograph-nft-not-signed text tspan').eq(0).attr({ 
      "x": outerMargin * 1.2, 
      "y": (outerMargin) * 2.2, 
      "font-size": rootPixelSize * 1.6 
    });
    $('.autograph-nft-not-signed text tspan').eq(1).attr({ 
      "x": outerMargin * 1.2, 
      "y": (outerMargin) * 3.5, 
      "font-size": rootPixelSize * 1.6 
    });

    // Not Signed Background
    $('.autograph-nft-not-signed rect').attr({ 
      "x": outerMargin,
      "y": outerMargin,
      "width": rootPixelSize * 11, 
      "height": rootPixelSize * 3.65
    });
    // Timestamp positioning
    $('.autograph-nft-timestamp text').attr({ 
      "x": outerMargin,
      "y": - (imgW - (outerMargin * 1.5)), 
      "font-size": rootPixelSize * 1 
    }); 
  }

  // Apply Stamp
  $('.autograph-nft-timestamp text').text(`${data[0].mark}`);
  // Apply Status
  $('.autograph-nft-status text').eq(0).text(`${data[0].title}`);

  // Collect the last three labels (upto 3 will be shown in the view)
  let labelData = data.slice(0, 3);

  // Reverse order to build the labels up the NFT (last to first)
  labelData = labelData.reverse();

  // Apply Labels
  let labelTemplates = '';

  labelData.map((label, index) => {

    // Position the labels based on the scale of the image
    const labelHeight = rootPixelSize * 1.7;
    let textWidth = 0;
    let space = 1.1;
    let labelPositionByIndex = index * (labelHeight * space);
    let offset = data.length > 3 ? labelHeight * 1.8 : 0;
    let addOuterMargin = data.length <= 3 ? outerMargin : 0;
    const yPos = imgH - labelHeight - labelPositionByIndex - offset - addOuterMargin;
    
    // Placeholder to build SVG label text 
    let autographSVGText = ''; 
    // Start position beside the Twitter profile image
    let startPosX = rootPixelSize * 1.7; 

    // Text width (incremented as the letters are defined in SVG)
    textWidth = 0;
        
    // e.g. [@,B,e,e,p,l,e,.,3,4,6,4,6,6,5,6,4]
    [...label.name.match(/./g),...['.'], ...label.twitterId.match(/./g)].map(char => {

      let val = googleFontData[char];

      if(!val) val = googleFontData[1];

      autographSVGText += `<tspan font-size-adjust="${rootPixelSize * 0.03}" x="${startPosX + textWidth}" y="${rootPixelSize * 1.2}" width=${val}>${char}</tspan>`;

      // adjust for spacing between letters
      textWidth += (val * (rootPixelSize * 0.065));

    });

    const twitterIdProfileWidth = rootPixelSize * 1.9; // width of twitter image with margin left/right
    const twitterImageWidth = rootPixelSize * 1.4; // twitter image inside label
    const imgPadding = rootPixelSize * 0.15; // padding top / left for image
    const autographFontSize = rootPixelSize * 1.1;

    textWidth += twitterIdProfileWidth;

    // build label templates
    labelTemplates += `<svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${(imgW - textWidth) - (outerMargin)}" y="${yPos}"><rect x="0" y="0" width="${textWidth}" height="${rootPixelSize * 1.7}" style="black" fill-opacity="0.3" rx="2"></rect><text x="0" y="0" style="font-family: 'Barlow'; fill:white;" font-size="${autographFontSize}">${autographSVGText}</text><svg x="${imgPadding}" y="${imgPadding}" width="${twitterImageWidth}" height="${twitterImageWidth}"><defs><clipPath id="myCircle"><circle cx="${twitterImageWidth/2}" cy="${twitterImageWidth/2}" r="${twitterImageWidth/2}" fill="#FFFFFF" /></clipPath></defs><image width="${twitterImageWidth}" height="${twitterImageWidth}" clip-path="url(#myCircle)" /></svg></svg>`;
    lastLabelYPos = yPos;
  });
  
  // "More..." Label
  if (data.length > 3) {
    const labelHeight = rootPixelSize * 1.7;
    const autographFontSize = rootPixelSize * 1.1;
    const yPos = imgH - labelHeight * 1.7; 
    const maxLabelTemplate = `
      <svg class="autograph-nft-label" xmlns="http://www.w3.org/2000/svg" x="${(imgW - (autographFontSize * 6.5)) - (outerMargin)}" y="${yPos}">
        <g>
          <rect x="0" y="0" width="${autographFontSize * 6.5}" height="${labelHeight}" style="fill:rgb(255,255,255)" fill-opacity="0.24" rx="2"></rect>
          <text style="font-family: 'Barlow'; fill:white;" font-size="${autographFontSize}">
            <tspan x="${rootPixelSize * 0.2}" y="${rootPixelSize * 1.2}">AND ${data.length -3} MORE...</tspan>
          </text>
        </g>
      </svg>
    `;
    labelTemplates += maxLabelTemplate;
  };
  
  // Append all the labels to the Remixed NFT template
  $('.autograph-nft-label-container').eq(0).append(`${labelTemplates}`);

  // Add Twitter Profile Images
  await Promise.all(labelData.map(async (label, index)  => {
    const imagePhotoURL = await recursiveFetch(label.photoURL);
    const imagePhotoURLBuffer = await imagePhotoURL.buffer();
    const photoURLContentType = await imagePhotoURL.headers.get('content-type');
    imagePhotoURLBase64 = `data:image/${photoURLContentType};base64,`+imagePhotoURLBuffer.toString('base64');
    $('.autograph-nft-label image').eq(index).attr('href', imagePhotoURLBase64);
  }));

  // Status text positioning
  let xPosStatus;
  if (data[0].title.toUpperCase().indexOf("SIGNED") > -1) {  
    xPosStatus = (imgW - rootPixelSize * 3.2) - (outerMargin); 
  } else { 
    xPosStatus = (imgW - rootPixelSize * 5.2) - (outerMargin); 
  }
  $('.autograph-nft-status').attr({ "x": xPosStatus, "y": lastLabelYPos - rootPixelSize * 4 });
  $('.autograph-nft-status text').attr({ "font-size": rootPixelSize * 0.8, "y": rootPixelSize * 3.2 });
  
  // remove the 'not signed label' when signed view
  if (data[0].title.toUpperCase().startsWith("SIGNED")) {
    $('.autograph-nft-not-signed').remove();
  };

  // can be increased at the cost of performance
  const imageArea = 5;
  let isLightImage = true;
  isLightImage = await isLightContrastImage(imageBuffer);

  // Define if the colour theme for text is black or white.
  const fontColourTheme = isLightImage ? "black" : "white";
  const labelBackgroundColourTheme = isLightImage ? "black" : "white";
  // apply white / black colour theme
  $('.autograph-nft-label rect, .autograph-nft-not-signed rect')
  .css({ 
    'fill': labelBackgroundColourTheme 
  });
  $('.autograph-nft-status text, .autograph-nft-timestamp text')
  .attr({
    'fill': fontColourTheme 
  });
  
  // prepare output
  const removeList = [
    "<html><head></head><body>",
    "</body></html>"
  ];

  // remove any script/s from output
  $('script').remove();

  // output is SVG wrapped in html
  output = $.html();

  // remove the outer html wrapper
  removeList.map((item) => {
    output = output.replace(item, "");
  });

  // Base64 output if parameter flag set to true
  if (base64Encode) output = svg64(output);

  // define image data return type
  if (format.toUpperCase() === 'PNG') {
    const svgToBuffer = Buffer.from(output);
    const pngOutput = await sharp(svgToBuffer).toBuffer('png');
    output = pngOutput;
  }
  
  return output;

}
