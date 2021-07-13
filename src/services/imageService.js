const sharp = require('sharp');
const isLightContrastImage = require('./../utils/isLightContrastImage');
const recursiveFetch = require('./../utils/recursiveFetch');

// uses recursive fetch to get image data
const getImage = async (imageUrl) => { return await recursiveFetch(imageUrl) };

// Get the shortest dimension of the image
// This is used to help determine the most applicable scaling of image labels and text
const getShortestDimension = (a, b) => { return a < b ? a : b }

// Process any WebP images as jpg
const getImageFallbackHandler = async ({ contentType, image }) => { 
  if (contentType === 'image/webp') { 
    image = await sharp(image).toFormat('jpeg').toBuffer(); 
    contentType = 'image/jpeg';
  }
  return { image, contentType };
}

// Using the colour detection lib we return the colour theme
// that best suits the given image, using the highest contrast.
const getColourTheme = async (image) => {
  const lightContrastImage = await isLightContrastImage(image);
  const darkColourTheme = { fontColour: "white", labelColour: "black" }
  const lightColourTheme = { fontColour: "black", labelColour: "white" };
  return lightContrastImage ? lightColourTheme : darkColourTheme;
}

// Returns the dimensions of the given image
const getIMGDimensions = async ({ $, contentType, image }) => {
  let imgH, imgW;
  if (contentType === 'image/svg') ({ imgW, imgH } = getDimensionsSVG($(image)));
  else ({ imgW, imgH } = await getDimensionsIMG(image));
  return { imgW, imgH };
}

// Find the height and width of a given image
const getDimensionsIMG = async image => {
  const { height, width} = await sharp(image).metadata();
  return { imgH: height, imgW: width };
};

// Find the height and width of a given SVG image
const getDimensionsSVG = svgEl => {
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
  return { imgH, imgW };
};

// Input the twitter data for an enriched version with images added.
const enrichTwitterLabelDataWithImages = async ({ data, numberOfImages=3 }) => {
  let labelDataWithImages = data.slice(0, numberOfImages);
  await Promise.all(labelDataWithImages.map(async (label) => {
    const { image, contentType } = await recursiveFetch(label.photoURL);
    const buffer = await sharp(image).toBuffer();
    // include twitter image data
    label.twitterProfileImage = getBase64Image({ contentType, imageBuffer: buffer });
    return label;
  }));
  return { labelDataWithImages };
}

// Return a base64 output of image
const getBase64Image = ({ contentType, imageBuffer }) => {
  return `data:${contentType};base64,${imageBuffer.toString('base64')}`;
}

// for final output 
const getBase64Output = ({ format, imageBuffer }) => {
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
  return `data:${outContentType};base64,${imageBuffer.toString('base64')}`;
}

module.exports = {
  getBase64Output,
  getImage,
  getBase64Image,
  getShortestDimension,
  getImageFallbackHandler,
  getColourTheme,
  getIMGDimensions,
  getDimensionsIMG,
  getDimensionsSVG,
  enrichTwitterLabelDataWithImages
}