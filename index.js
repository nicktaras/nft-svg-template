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
// base64Encode,
// format

const format = 'svg';

imageGenerator(
    // "https://via.placeholder.com/300.png/000",
    // "https://via.placeholder.com/300.png/111",
    // "https://via.placeholder.com/300.png/222",
    // "https://via.placeholder.com/300.png/333",
    // "https://via.placeholder.com/300.png/444",
    // "https://via.placeholder.com/300.png/555",
    // "https://via.placeholder.com/300.png/666",
    "https://via.placeholder.com/300.png/777",
    // "https://via.placeholder.com/300.png/888",
    // "https://via.placeholder.com/300.png/999",
    // "https://via.placeholder.com/300.png/fff",
  [
    {
      title: "Signing:",
      photoURL: "https://pbs.twimg.com/profile_images/264316321/beeple_headshot_beat_up_400x400.jpg",
      name: "@weihong_hu",
      twitterId: "1385403298945986561",
      mark: "17654321"
    },
    {
      title: "Signed",
      photoURL: "https://pbs.twimg.com/profile_images/879737418609553409/yjnyAhAI_400x400.jpg",
      name: "@cryptopunksbot",
      twitterId: "1145403668945986561",
      mark: "123456"
    },
    {
      title: "Signed",
      photoURL: "https://pbs.twimg.com/profile_images/1084788308595617793/DOnqq1OM_400x400.jpg",
      name: "@ethereum",
      twitterId: "6919871298945986561",
      mark: "154321"
    },
    {
      title: "Signed",
      photoURL: "https://pbs.twimg.com/profile_images/1389823228533739522/-Tj2WF_6_400x400.jpg",
      name: "@Polkadot",
      twitterId: "1385403298945986561",
      mark: "1154321"
    },
  ],
  false,
  format
).then((res) => {
  if (format === 'png') {  
    fs.writeFile('remixNFT.png', res, function (err) {
      if (err) return console.log(err);
      console.log('success');
    });
  } else {
    fs.writeFile('remixNFT.svg', res, function (err) {
      if (err) return console.log(err);
      console.log('success');
    });
  }
});


