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
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Solid_white.svg/2048px-Solid_white.svg.png",
  // "https://image.shutterstock.com/image-photo/black-background-texture-pattern-all-260nw-425112010.jpg",
  // "https://www.wanderluststorytellers.com/wp-content/uploads/2017/09/Jones-Beach-Kiama-NSW_thumb.jpg",
  // "http://cdn.cnn.com/cnnnext/dam/assets/181010131059-australia-best-beaches-cossies-beach-cocos3.jpg",
  // "https://media.timeout.com/images/102997885/image.jpg",
  // "https://content.api.news/v3/images/bin/f171277b6d2c0f00ed6243191d813384?width=650",
  // "https://i.huffpost.com/gen/1619342/thumbs/o-BEACH-GALAXY-570.jpg?1",
  // "https://www.scienceabc.com/wp-content/uploads/ext-www.scienceabc.com/wp-content/uploads/2019/10/ocean-where-there-is-a-Glow-planktons-in-the-water-making-blue-light-Isabella-Millers.jpg-.jpg",
  // "https://www.oyster.com/wp-content/uploads/sites/35/2021/01/AdobeStock_367243900-scaled.jpeg",
  // "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi7nz6JGWUjdCYDHJHj2vuWtMucmnDaF9Gqg&usqp=CAU",
  [
    {
      title: "Signed:",
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


