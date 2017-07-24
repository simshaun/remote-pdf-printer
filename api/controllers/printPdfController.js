const asyncWrap = require('../asyncWrap');
const uniqueFilename = require('unique-filename');
const path = require('path');
const fs = require('fs');
const CDP = require('chrome-remote-interface');

const options = {
  htmlPDF: {
    port: process.env.CHROME_PORT || 1337,
    printOptions: {
      marginTop: 0,
      marginRight: 0,
      marginLeft: 0,
      printBackground: true,
    }
  },
  dir: process.env.DIR || __dirname + '/../../files/'
};

async function load(html) {
  const tab = await CDP.New();
  const client = await CDP({ tab });
  const { Page } = client;

  const url = /^(https?|file|data):/i.test(html) ? html : `data:text/html,${html}`;

  await Page.enable();
  await Page.navigate({ url });
  await Page.loadEventFired();

  return { client, tab };
}

async function getPdf(html) {
  const { client } = await load(html);
  const { Page } = client;

  // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-printToPDF
  const pdf = await Page.printToPDF(options.printOptions);
  client.close();

  return pdf;
}

exports.print_url = asyncWrap.wrap(async function (req, res) {
  console.log('Request for ' + req.query.url);

  try {
    const pdf = await getPdf(req.query.url);
    const randomPrefixedTmpfile = uniqueFilename(options.dir);

    await fs.writeFileSync(randomPrefixedTmpfile, Buffer.from(pdf.data, 'base64'), (err) => {
      if (err) {
        throw err;
      }
      console.log('saved!');
    });

    console.log('wrote file ' + randomPrefixedTmpfile + ' successfully');
    res.json({ pdf: path.basename(randomPrefixedTmpfile) });

  } catch (error) {
    res.status(400).json({ error: 'Unable to generate/save PDF!', message: error });
    console.log('Caught Error ' + error);
  }
});
