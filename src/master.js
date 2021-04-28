'use strict';

const fs = require('fs'),
    cheerio = require('cheerio'),
    DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;

const pc_config = {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]};
let connections = [];
let slave = null;
let newConnection = null;
// global.connections = connections;
// global.newConnection = newConnection;

const showMaster = function (request, response) {
    let filePath = __dirname + "/html/master.html";
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            trace(err);
            return
        }

        const $ = cheerio.load(html);
        connections.forEach((element) => {
            $('#nodes-table').append(`<tr><td>${element.name}</td></tr>`)
        });

        fs.readdirSync("uploads/").forEach(file => {
            $('#wasm-file').append(`<option>${file}</option>`)
        });

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write($.html());
        response.end();
    });
}

const connectSlave = function (request, response) {
    let slaveName = request.body.name;
    let requestDesc = request.body.description;
    if (!slaveName || !requestDesc) {
        trace("Parameters are missing");
        response.end();
        return;
    }
    let remoteDesc = decode(requestDesc);

    if (slave != null || newConnection != null) {
        trace("Slave value isn't empty, please check");
        response.end();
        return;
    }
    newConnection = new DefaultRTCPeerConnection(pc_config);
    slave = {name: slaveName, connection: newConnection}

    newConnection.onicecandidate = function (event) {
        if (event.candidate) {
            trace(`ICE candidate: \n ${event.candidate.candidate}`);
        }
    }

    trace(`[remote] Offer: ` + remoteDesc.sdp);
    setRemoteDesc(remoteDesc);

    let localDesc;
    newConnection.createAnswer().then(
        function (desc) {
            localDesc = desc;
            trace(`[local] Answer: ` + desc.sdp);
            setLocalDesc(desc);
            addNewSlave();
        },
        function (error) {
            trace('[local] Failed to create session description: ' + error.toString());
        }
    ).then(function () {
        response.write(encode(localDesc));
        response.end();
    });
}

const start = function (request, response) {

}

exports.showMaster = showMaster;
exports.connectSlave = connectSlave;
exports.start = start;

function setLocalDesc(desc) {
    newConnection.setLocalDescription(desc).then(
        function () {
            trace('[local] AddIceCandidate success.');
        },
        function (error) {
            trace('[local] Failed to add Ice Candidate: ' + error.toString());
        }
    );
}

function setRemoteDesc(desc) {
    newConnection.setRemoteDescription(desc).then(
        function () {
            trace('[remote] AddIceCandidate success.');
        },
        function (error) {
            trace('[remote] Failed to add Ice Candidate: ' + error.toString());
        }
    );
}

function addNewSlave() {
    connections.push(slave);
    newConnection = null;
    slave = null;
}

function trace(text) {
    if (text[text.length - 1] === '\n') {
        text = text.substring(0, text.length - 1);
    }
    console.log(text);
}

function decode(obj) {
    let str = Buffer.from(obj, 'base64').toString("ascii");
    return JSON.parse(str);
}

function encode(obj) {
    let json = JSON.stringify(obj);
    return Buffer.from(json).toString('base64');
}