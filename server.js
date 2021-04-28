const express = require('express'),
    bodyParser = require("body-parser"),
    master = require("./src/master.js");
const app = new express();
const PORT = 666;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));
app.get('/', function (request, response) {
    master.showMaster(request, response)
});
app.get('/slave', function (request, response) {
    response.sendFile(__dirname + "/src/html/slave.html");
});
app.post('/master/connect', function (request, response) {
    master.connectSlave(request, response)
});
app.listen(PORT, () => {
    console.log("Running at Port " + PORT);
});
