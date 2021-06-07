fs = require('fs');
const imageGenerator = require("./imageGenerator");

// imageUrl
// data: [
//    title: string; (Title of NFT)
//    templateType: "SIGNED" or "REQUESTING"
//    photoURL: string; (Photo of Twitter User)
//    name: string; (Name of Twitter User)
//    twitterId: string; (Handle)
//    mark: string; (ID number)
// }
// ],
// base64Encode

const format = 'svg';
 
imageGenerator(
  "https://media-cdn.tripadvisor.com/media/photo-s/1a/dd/6a/f0/paradise-taveuni.jpg",
  // "https://images.unsplash.com/photo-1590272456521-1bbe160a18ce?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  // "https://www.laminex.com.au/medias/p-LX-ColourCollection-Chalk-White-RGB-1200x1200-LR.jpg-1200Wx979H?context=bWFzdGVyfGltYWdlc3wyNzM1OXxpbWFnZS9qcGVnfGgwNS9oYWMvODg2Njg0NTgxODkxMC9wX0xYX0NvbG91ckNvbGxlY3Rpb25fQ2hhbGtfV2hpdGVfUkdCXzEyMDB4MTIwMF9MUi5qcGdfMTIwMFd4OTc5SHxiM2Y1ZGUyYzYxMTc5YjUwMzZkNjA4NjEzZWM3ZDg4YWVjOWM4ZjdhMDNhNTBlYzEyZTc3NmRlOGRlOTFiMzEx",
  // "https://lh3.googleusercontent.com/r-hAVIErP0UEiYUhoHU9KS53Wl25rzqpBCt2V4IzQRVxtncH2KqpU0m6_26l2eqoQSD3BWP8InLJNTomvMy2G2ZD=s0",
  // "https://storage.opensea.io/files/0fbeacdb0bf089800109f3b1d0401c6b.svg",
  // "https://s3-us-west-2.amazonaws.com/s.cdpn.io/13471/sparkles.gif",
  // "https://images.unsplash.com/photo-1556103255-4443dbae8e5a?ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8cGhvdG9ncmFwaGVyfGVufDB8fDB8fA%3D%3D&ixlib=rb-1.2.1&w=1000&q=80",
  // "https://upload.wikimedia.org/wikipedia/commons/4/4f/SVG_Logo.svg",
  // "https://i.pinimg.com/originals/a9/e5/06/a9e506364ae6b6892e6a126a2f021206.gif",
  // "https://polkadot.network/content/images/2020/06/Polkadot_OG.png",
  // "https://storage.opensea.io/files/49a2c73a565c7847c4d2af9a2419990d.svg",
  // "https://storage.opensea.io/files/0fbeacdb0bf089800109f3b1d0401c6b.svg",
  [
    {
      title: "Signed:",
      photoURL: "https://pbs.twimg.com/profile_images/264316321/beeple_headshot_beat_up_400x400.jpg",
      name: "@Beeple",
      twitterId: "1234567890",
      mark: "17654321"
    },
    {
      title: "Signed:",
      photoURL: "https://pbs.twimg.com/profile_images/879737418609553409/yjnyAhAI_400x400.jpg",
      name: "@alphaWallet",
      twitterId: "0987643",
      mark: "123456"
    },
    {
      title: "Signed:",
      photoURL: "https://pbs.twimg.com/profile_images/1084788308595617793/DOnqq1OM_400x400.jpg",
      name: "@eth",
      twitterId: "765239059646909",
      mark: "154321"
    },
    {
      title: "Signed:",
      photoURL: "https://pbs.twimg.com/profile_images/1389823228533739522/-Tj2WF_6_400x400.jpg",
      name: "@Polkadot",
      twitterId: "43019393099",
      mark: "1154321"
    },
  ],
  false,
  format
).then((res) => {
  if (format === 'png') {  
    fs.writeFile('remixNFT.png', res, function (err) {
      // if (err) return console.log(err);
      // console.log('success');
    });
  } else {
    fs.writeFile('remixNFT.svg', res, function (err) {
    // if (err) return console.log(err);
      // console.log('success');
    });
  }
});


