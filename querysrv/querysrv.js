'use strict';
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

var app = express();
var refRes;

const bigQuery = require('gcloud').bigquery({
  projectId: 'sodium-primer-120219',
  keyFilename: '../cert/Big-Data-34fbefa58bd8.json'
});

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    bigQuery.query({
      query: sql,
      autoPaginate: false,
      useQueryCache: false,
      timeoutMs: 30000,
    }, (err, row, nextQuery, apiResponse) => {
      console.log(err, row);
      if(!err) {
        resolve(apiResponse);
      } else {
        reject(err);
      }
    });
  });
}

app.post('/', function (req, res) {
  var results = runQuery(req.body.query).catch((err) => {
    res.status(500).send(err);
  }).then((val) => {
    console.log("postResults with val : " + val + " : res = " + res);
    res.status(200).send(val);
  });
});

app.listen(3000, function () {
  console.log('BigQueryServer app listening on port 3000!');
});
