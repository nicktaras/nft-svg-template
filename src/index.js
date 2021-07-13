// can be injected by parameter - for when we provide different templates.
const templateName = "template_1";

module.exports = async (imageUrl, data, base64Encode, format) => {
  const templateController = require(`./controllers/${templateName}`);
  return await templateController.build(imageUrl, data, base64Encode, format);
};
