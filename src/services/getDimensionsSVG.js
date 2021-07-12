module.exports = svgEl => {
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
  return { 
    imgH,
    imgW 
  };
};
