'use strict';

const fs = require('fs'),
    cheerio = require('cheerio'),
    DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;

const pc_config = {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]};
let connections = [];
let newConnectionToSlave = null;

module.exports = {
    showMaster: function (request, response) {
        let filePath = __dirname + "/html/master.html";
        fs.readFile(filePath, {encoding: 'utf-8'}, function (err, html) {
            if (err) {
                console.log(err);
                return
            }

            const $ = cheerio.load(html);

            ["first", "second", "third"].forEach(function (param) {
                $('#nodes-table').append(`<tr><td>${param}</td></tr>`)
            })

            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write($.html());
            response.end();
        });
    },
    connectSlave: function (request, response) {
        let requestDesc = request.body.description;
        if (!requestDesc) return;
        let remoteDesc = decode(requestDesc);


        if (!newConnectionToSlave) {
            trace("New connection value isn't empty, please check")
        }
        newConnectionToSlave = new DefaultRTCPeerConnection(pc_config);
        newConnectionToSlave.onicecandidate = function (event) {
            if (event.candidate) {
                trace(`ICE candidate: \n ${event.candidate.candidate}`);
            }
        }

        trace(`[remote] Offer: ` + remoteDesc.sdp);
        setRemoteDesc(remoteDesc);

        let localDesc;
        newConnectionToSlave.createAnswer().then(
            function (desc) {
                localDesc = desc;
                trace(`[local] Answer: ` + desc.sdp);
                setLocalDesc(desc);
                addNewConnection()
            },
            function (error) {
                trace('[local] Failed to create session description: ' + error.toString());
            }
        ).then(function () {
            response.write(encode(localDesc));
            response.end();
        });
    }
};

function setLocalDesc(desc) {
    newConnectionToSlave.setLocalDescription(desc).then(
        function () {
            trace('[local] AddIceCandidate success.');
        },
        function (error) {
            trace('[local] Failed to add Ice Candidate: ' + error.toString());
        }
    );
}

function setRemoteDesc(desc) {
    newConnectionToSlave.setRemoteDescription(desc).then(
        function () {
            trace('[remote] AddIceCandidate success.');
        },
        function (error) {
            trace('[remote] Failed to add Ice Candidate: ' + error.toString());
        }
    );
}

function addNewConnection() {
    connections += newConnectionToSlave;
    newConnectionToSlave = null;

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