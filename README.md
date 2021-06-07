# nft-svg-template

See for converting the image to SVG, Jpg, PNG etc.
https://www.npmjs.com/package/html-to-image

## TODO's

- Fix Gif to PNG (if format === "PNG" convert GIF to PNG before other processes)
- Smarter image colour detection logic / or send as parameter would be a cleaner and more performant solution
- Correct image re-sizing calculation labelling - it's not 100% accurate
- Error Handling
- Security checks e.g. checking types / Security image libs
- Check image colour SVG
- Switch out Cheerio to https://github.com/inikulin/parse5 (Cheerio is being installed by other deps / this task may not be required unless replacing other deps etc)
- Unit Tests
- Bench mark performance / Optimise code + increase performance

## Development 

1. install deps
2. run `node index.js`

This loads the mock function imageGenerator() with params.

### Reading Dev notes / Links / Resources

- https://amio.github.io/embedded-google-fonts/ (Base64 Google Fonts)
- https://github.com/svg/svgo (SVG optimiser)