const sharp = require("sharp");

module.exports = async image => {
  const info = await sharp(image).metadata();
  return {
    imgH: info.height,
    imgW: info.width
  }
};
