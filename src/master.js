'use strict';

const fs = require('fs'),
    cheerio = require('cheerio');

const showMaster = function (request, response) {
    let filePath = __dirname + "/html/master.html";
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            trace(err);
            return
        }

        const $ = cheerio.load(html);
        fs.readdirSync("uploads/").forEach(file => {
            $('#wasm-file').append(`<option>${file}</option>`)
        });

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write($.html());
        response.end();
    });
}


exports.showMaster = showMaster;

function trace(text) {
    if (text[text.length - 1] === '\n') {
        text = text.substring(0, text.length - 1);
    }
    console.log(text);
}