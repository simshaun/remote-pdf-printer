const express = require('express');
const fs = require('fs');
const http = require('http');
const logger = require('morgan');
const routes = require('./api/routes/printPdfRoutes');

const app = express();

const options = {
  port: process.env.PORT || 3000,
  address: process.env.LISTEN || '127.0.0.1',
};

bodyParser = require('body-parser');

app.use(logger('combined', { stream: fs.createWriteStream(__dirname + '/remote-pdf-printer.log') }));
app.use(bodyParser.urlencoded({ extended: true }));
routes(app);

const server = http.createServer(app);
server.listen(options.port, options.address);

console.log('HTML to PDF RESTful API server started');
