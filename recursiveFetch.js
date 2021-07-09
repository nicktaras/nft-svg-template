const axios = require('axios');

// Max attempts to get a 200 response
const maxAttempts = 3;
let attemptsUsed;

/*
  FUNCTION:
  recursiveFetch();

  USE:
  Recursivly attempts to retrive image data from a url

  interface: {
    imageUrl: string (URL)
  }
*/

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36';

const recursiveFetchHandler = (url, attempts) => {
  return new Promise((resolve, reject) => {
    axios.get(url, { 
      responseType: "arraybuffer",
      headers: { 
        'User-Agent': userAgent
     }
    }).then(
      res => {
        // console.log('done');
        return resolve(res);
      },
      e => {
        if (attemptsUsed <= maxAttempts) {
          // console.log('try again');
          attemptsUsed++;
          return resolve(recursiveFetchHandler(url, attempts));
        } else {
          // console.log('failed');
          return reject(e);
        }
      }
    );
  });
};

module.exports = async imageUrl => {
  attemptsUsed = 0;
  return new Promise((resolve, reject) => {
    recursiveFetchHandler(imageUrl, attemptsUsed).then(
      results => {
        resolve({
          image: results.data,
          contentType: results.headers['content-type'] 
        });
      },
      e => {
        reject(e);
      }
    );
  });
};
