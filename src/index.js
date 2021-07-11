// can be injected by parameter - for when we provide different templates.
const templateName = "labelled_autograph_template";

module.exports = async (imageUrl, data, base64Encode, format = 'svg') => {
  const templateController = require(`./templates/${templateName}/templateController`);
  return await templateController.build(imageUrl, data, base64Encode, format = 'svg');
};