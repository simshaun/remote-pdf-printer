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
  console.log('Load(html) called');

  const tab = await CDP.New();
  const client = await CDP({ tab });
  const { Network, Page } = client;
  await Promise.all([Network.enable(), Page.enable()]);

  return new Promise((resolve, reject) => {
    let failed = false;

    Network.loadingFailed(() => {
      failed = true;
      console.log('Load(html) Network.loadingFailed');
      reject(new Error('Load(html) unable to load remote URL: ' + html));
    });

    const url = /^(https?|file|data):/i.test(html) ? html : `data:text/html,${html}`;
    Page.navigate({ url });
    Page.loadEventFired(() => {
      if (!failed) {
        console.log('Load(html) resolved');
        resolve(client);
      }
    });
  });
}

async function getPdf(html) {
  const client = await load(html);
  const { Page } = client;

  // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-printToPDF
  const pdf = await Page.printToPDF(options.printOptions);
  client.close();

  return pdf;
}

exports.print_url = function (req, res) {
  console.log('Request for ' + req.query.url);

  getPdf(req.query.url).then(async (pdf) => {
    const randomPrefixedTmpfile = uniqueFilename(options.dir);

    await fs.writeFileSync(randomPrefixedTmpfile, Buffer.from(pdf.data, 'base64'), (error) => {
      if (error) {
        throw error;
      }
      console.log('saved!');
    });

    console.log('wrote file ' + randomPrefixedTmpfile + ' successfully');
    res.json({ pdf: path.basename(randomPrefixedTmpfile) });
  }).catch((error) => {
    res.status(400).json({ error: 'Unable to generate/save PDF!', message: error.message });
    console.log('Caught ' + error);
  });
};
