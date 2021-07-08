const cheerio = require('cheerio');
const recursiveFetch = require('./recursiveFetch');
const sharp = require('sharp');
// lib to detect image contrast returning if image is light or dark
const isLightContrastImage = require('./isLightContrastImage');

// Reads the Barlow Font widths (needed to correctly calculate width of labels)
const googleFontData = require('./googleFontData');

// Autograph Templates
const template = require('./htmlTemplates/labelled_autograph_template');

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
  let imgH, // Height of Remix NFT
    imgW, // Width of Remix NFT
    imageBuffer, // Image buffer (png, gif, jpg)
    rootPixelSize, // Base font size calculated by the scale of the longest length of the image
    lastLabelYPos, // Used to apply the labels to the NFT + the Signed/Requested text
    outerMargin, // percent based margin (will be calculated to be 5%)
    output; // return data

  // load SVG template
  const $ = cheerio.load(template);

  // fetch the NFT Data
  const imageUrlData = await recursiveFetch(imageUrl);

  // get Content type
  const contentType = imageUrlData.headers['content-type'];

  // if SVG
  if (contentType.indexOf('svg') > -1) {
    // get SVG element from response
    const svgUrlData = imageUrlData.data;

    // get buffer for processing
    imageBuffer = await sharp(imageUrlData.data).toBuffer('png');

    // Original NFT
    const svgEl = $(svgUrlData);
    const svgViewBox = svgEl.attr('viewBox');
    const svgWidth = svgEl.attr('width');
    const svgHeight = svgEl.attr('height');
    const svgViewBoxData = svgViewBox
      ? svgEl.attr('viewBox').split(' ')
      : undefined;

    // Assign the height / width of original NFT to imgW, imgH
    if (svgViewBoxData) {
      // apply height width of SVG from ViewBox values
      imgW = svgViewBoxData[2];
      imgH = svgViewBoxData[3];
    } else if (svgWidth && svgHeight) {
      // apply height width of SVG from W/H values
      imgW = svgWidth;
      imgH = svgHeight;
    } else {
      // fallback if an image size cannot be found
      imgW = 500;
      imgH = 500;
    }

    // Embed the SVG into the Remix SVG NFT
    $('.autograph-nft-image-container').html($(svgUrlData));
  }

  // Image types; PNG, JPG, Gif: assign height and width to imgW, imgH.
  if (contentType.indexOf('svg') <= -1) {
    imageBuffer = await sharp(imageUrlData.data).toBuffer();

    // convert webp images to png as a fall back operation.
    if (
      contentType === 'image/webp'
    ) {
      imageBuffer = await sharp(imageBuffer).toFormat('png').toBuffer();
    }
    // create animated image buffer
    if (contentType === 'image/gif'){
      imageBuffer = await sharp(imageUrlData.data, { animated: true }).toBuffer();
    }

    const imageBase64 = `data:image/${contentType};base64,` + imageBuffer.toString('base64');
    // acquire image width / height
    const info = await sharp(imageUrlData.data).metadata();
    imgH = info.height;
    imgW = info.width;
    
    // embed the data inside the image element
    $('.autograph-nft-image').eq(0).attr({
      href: imageBase64,
      height: imgH,
      width: imgW,
    });
  }

  // set the image height and width and apply scale of labelling to image
  if (imgW && imgH) {
    // determine shortest in length (so we can apply the most suitable labelling size).
    const shortestInLength = imgW < imgH ? imgW : imgH;

    // scale baseline of autograph / timestamp data
    rootPixelSize = (shortestInLength / 16) * 0.64;

    // Apply Calculation (height / width)
    $('.autograph-nft-wrapper')
      .css({height: imgH, width: imgW})
      .attr({viewBox: `0 0 ${imgW} ${imgH}`});

    // 5% outer margin
    outerMargin = shortestInLength * 0.05;

    $('.autograph-nft-not-signed text tspan')
      .eq(0)
      .attr({
        x: outerMargin * 1.2,
        y: outerMargin * 2.2,
        'font-size': rootPixelSize * 1.6,
      });
    $('.autograph-nft-not-signed text tspan')
      .eq(1)
      .attr({
        x: outerMargin * 1.2,
        y: outerMargin * 3.5,
        'font-size': rootPixelSize * 1.6,
      });

    // Not Signed Background
    $('.autograph-nft-not-signed rect').attr({
      x: outerMargin,
      y: outerMargin,
      width: rootPixelSize * 11,
      height: rootPixelSize * 3.65,
    });
    // Timestamp positioning
    $('.autograph-nft-timestamp text').attr({
      x: outerMargin,
      y: -(imgW - outerMargin * 1.5),
      'font-size': rootPixelSize * 1,
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
    const space = 1.1;
    const labelPositionByIndex = index * (labelHeight * space);
    const offset = data.length > 3 ? labelHeight * 1.8 : 0;
    const addOuterMargin = data.length <= 3 ? outerMargin : 0;
    const yPos =
      imgH - labelHeight - labelPositionByIndex - offset - addOuterMargin;

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
    }" fill="#FFFFFF" /></clipPath></defs><image width="${twitterImageWidth}" height="${twitterImageWidth}" clip-path="url(#myCircle)" /></svg></svg>`;
    lastLabelYPos = yPos;
  });

  // "More..." Label
  if (data.length > 3) {
    const labelHeight = rootPixelSize * 1.7;
    const autographFontSize = rootPixelSize * 1.1;
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

  // Append all the labels to the Remixed NFT template
  $('.autograph-nft-label-container').eq(0).append(`${labelTemplates}`);

  // Add Twitter Profile Images
  await Promise.all(
    labelData.map(async (label, index) => {
      const imagePhotoURL = await recursiveFetch(label.photoURL);
      const imagePhotoURLBuffer = await sharp(imagePhotoURL.data).toBuffer();
      const photoURLContentType = await imagePhotoURL.headers['content-type'];
      const imagePhotoURLBase64 =
        `data:image/${photoURLContentType};base64,` +
        imagePhotoURLBuffer.toString('base64');
      $('.autograph-nft-label image')
        .eq(index)
        .attr('href', imagePhotoURLBase64);
    })
  );

  // Status text positioning
  // TODO: add font data to allow for dynamic positioning.
  let xPosStatus;
  if (data[0].title.toUpperCase().indexOf('SIGNED') > -1) {
    xPosStatus = imgW - rootPixelSize * 3.2 - outerMargin;
  } else if (data[0].title.toUpperCase().indexOf('SIGNING') > -1) {
    xPosStatus = imgW - rootPixelSize * 3.8 - outerMargin;
  } else {
    xPosStatus = imgW - rootPixelSize * 5.2 - outerMargin;
  }
  $('.autograph-nft-status').attr({
    x: xPosStatus,
    y: lastLabelYPos - rootPixelSize * 4,
  });
  $('.autograph-nft-status text').attr({
    'font-size': rootPixelSize * 0.8,
    y: rootPixelSize * 3.2,
  });

  // remove the 'not signed label' when signed view
  if (data[0].title.toUpperCase().startsWith('SIGNED')) {
    $('.autograph-nft-not-signed').remove();
  }

  let isLightImage = true;

  isLightImage = await isLightContrastImage(imageBuffer);

  // Define if the colour theme for text is black or white.
  const fontColourTheme = isLightImage ? 'black' : 'white';
  const labelBackgroundColourTheme = isLightImage ? 'black' : 'white';
  // apply white / black colour theme
  $('.autograph-nft-label rect, .autograph-nft-not-signed rect').css({
    fill: labelBackgroundColourTheme,
  });
  $('.autograph-nft-status text, .autograph-nft-timestamp text').attr({
    fill: fontColourTheme,
  });

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
};
