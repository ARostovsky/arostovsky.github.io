const express = require('express'),
    bodyParser = require("body-parser"),
    multer = require('multer'),
    master = require("./src/master.js"),
    helpers = require("./src/helpers");
const PORT = 666;

const app = new express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.get('/', function (request, response) {
    master.showMaster(request, response)
});
app.get('/slave', function (request, response) {
    response.sendFile(__dirname + "/src/html/slave.html");
});

// https://stackabuse.com/handling-file-uploads-in-node-js-with-expres-and-multer/
app.post('/upload-wasm-file', (req, res) => {
    // 'wasm_file' is the name of our file input field in the HTML form
    let upload = multer({storage: helpers.storage, fileFilter: helpers.wasmFilter}).single('wasm_file');

    upload(req, res, function (err) {
        // req.file contains information of uploaded file
        // req.body contains information of text fields, if there were any

        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        } else if (!req.file) {
            return res.send('Please select an image to upload');
        } else if (err instanceof multer.MulterError) {
            return res.send(err);
        } else if (err) {
            return res.send(err);
        }

        res.send(`You have uploaded .wasm file: ${req.file.path}<hr />`);
    });
});


app.listen(PORT, () => {
    console.log("Running at Port " + PORT);
});
