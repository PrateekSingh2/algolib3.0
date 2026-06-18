const https = require('https');

https.get('https://pythontutor.com/iframe-embed.html', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/<option value="([^"]+)">/g);
    console.log(matches);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
