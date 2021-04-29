'use strict';

const fs = require('fs'),
    cheerio = require('cheerio'),
    DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;

const pc_config = {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]};
let connectionFromSlave = null;
let connectionToSlave = null;
let serviceChannel;
// global.connections = connections;
// global.connectionFromSlave = connectionFromSlave;

const showMaster = function (request, response) {
    let filePath = __dirname + "/html/master.html";
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            trace(err);
            return
        }

        const $ = cheerio.load(html);
        // connections.forEach((element) => {
        //     $('#nodes-table').append(`<tr><td>${element.name}</td></tr>`)
        // });

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

    connectionFromSlave = new DefaultRTCPeerConnection(pc_config);

    connectionFromSlave.onicecandidate = function (event) {
        if (event.candidate) {
            trace(`ICE candidate: \n ${event.candidate.candidate}`);
        }
    }
    connectionFromSlave.ondatachannel = function (event) {
        trace(`Data channel: \n ${event.channel.label}`);
    }

    // trace(`[remote] Offer: ` + remoteDesc.sdp);
    connectionFromSlave.setRemoteDescription(remoteDesc).then(
        function () {
            addDescriptionSuccessCallback("connectionFromSlave", "remote")
        },
        function (error) {
            addDescriptionErrorCallback(error, "connectionFromSlave", "remote")
        }
    );

    let localDesc;
    connectionFromSlave.createAnswer().then(
        function (desc) {
            localDesc = desc;
            // trace(`[local] Answer: ` + desc.sdp);
            connectionFromSlave.setLocalDescription(desc).then(
                function () {
                    addDescriptionSuccessCallback("connectionFromSlave", "local")
                },
                function (error) {
                    addDescriptionErrorCallback(error, "connectionFromSlave", "local")
                }
            );
        },
        function (error) {
            trace('[local] Failed to create session description: ' + error.toString());
        }
    ).then(function () {
        response.write(encode(localDesc));
        response.end();
    });
}

const createLocalOffer = function (request, response) {
    connectionToSlave = new DefaultRTCPeerConnection(pc_config);
    serviceChannel = connectionToSlave.createDataChannel('service');
    setChannelEvents(serviceChannel);

    connectionToSlave.createOffer().then(
        function (desc) {
            connectionToSlave.setLocalDescription(desc).then(
                function () {
                    addDescriptionSuccessCallback("connectionToSlave", "local")
                },
                function (error) {
                    addDescriptionErrorCallback(error, "connectionToSlave", "local")
                }
            ).then(function () {
                response.write(encode(desc));
                response.end();
            });
        },
        function (error) {
            trace('[local] Failed to create session description: ' + error.toString());
        }
    )
}

const connectMaster = function (request, response) {
    let requestDesc = request.body.description;
    if (!requestDesc) {
        trace("Parameters are missing");
        response.end();
        return;
    }
    let remoteDesc = decode(requestDesc);
    connectionToSlave.setRemoteDescription(remoteDesc).then(
        function () {
            addDescriptionSuccessCallback("connectionToSlave", "remote")
        },
        function (error) {
            addDescriptionErrorCallback(error, "connectionToSlave", "remote")
        }
    ).then(function () {
        response.end();
    });
}

const start = function (request, response) {

}

exports.showMaster = showMaster;
exports.connectSlave = connectSlave;
exports.createLocalOffer = createLocalOffer;
exports.connectMaster = connectMaster;
exports.start = start;

function addDescriptionSuccessCallback(connection, type) {
    trace(`[${connection}][${type}] AddIceCandidate success.`);
}

function addDescriptionErrorCallback (error, connection, type) {
    trace(`[${connection}][${type}] Failed to add Ice Candidate: ` + error.toString());
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

function setChannelEvents(channel) {
    channel.onmessage = function (event) {
        const data = JSON.parse(event.data);
        trace(`${channel.label} ${data}`);
    };
    channel.onopen = function () {
        channel.push = channel.send;
        channel.send = function (data) {
            channel.push(JSON.stringify(data));
        };
    };

    channel.onerror = function (e) {
        trace(`${channel.label} ${JSON.stringify(e, null, '\t')}`);
    };

    channel.onclose = function (e) {
        trace(`${channel.label} ${JSON.stringify(e, null, '\t')}`);
    };
}