const fetch = require('node-fetch');

// Max attempts to get a 200 response
let maxAttempts = 3;

/*
  FUNCTION:
  recursiveFetch();

  USE:
  Recursivly attempts to retrive image data from a url

  interface: {
    imageUrl: string (URL)
  }
*/

const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36";

const recursiveFetchHandler = (url, attempts) => {
  return new Promise((resolve, reject) => {
    fetch(url, { headers: { 'User-Agent': userAgent }}).then((res) => {
      // console.log('done');
      return resolve(res);
    }, (e) => {
      if (attemptsUsed <= maxAttempts) {
        // console.log('try again');
        attemptsUsed++;
        return resolve(recursiveFetchHandler(url, attempts));
      } else {
        // console.log('failed');
        return reject(e);
      }
    });
  })
}

module.exports = async (
  imageUrl
) => {
  attemptsUsed = 0;
  return new Promise(function (resolve, reject) {
    recursiveFetchHandler(imageUrl, attemptsUsed).then((data) => {
      resolve(data);
    }, (e) => {
      reject(e);
    });
  });
};