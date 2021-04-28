'use strict';

let connectionToMaster;

const pc_config = {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]};
let slaveButtonConnect = $(`button#slave-connect`),
    slaveName = $(`input#slave-name`);

$(document).ready(function () {
    slaveName.keyup(function () {
        if (slaveName.val() !== "") {
            slaveButtonConnect.prop("disabled", false);
        } else if (slaveName.val() === "") {
            slaveButtonConnect.prop("disabled", true);
        }
    });

    slaveButtonConnect.click(function () {
        // close old connection
        connectionToMaster = new RTCPeerConnection(pc_config);
        connectionToMaster.onicecandidate = function (event) {
            if (event.candidate) {
                trace(`ICE candidate: \n ${event.candidate.candidate}`);
            }
        };

        connectionToMaster.createOffer().then(
            gotDescription,
            function (error) {
                trace('[local] Failed to create session description: ' + error.toString());
            }
        );
    })
});

async function gotDescription(desc) {
    trace(`[local] Offer: ` + desc.sdp);
    connectionToMaster.setLocalDescription(desc).then(
        function () {
            trace('[local] AddIceCandidate success.')
        },
        function (error) {
            trace('[local] Failed to add Ice Candidate: ' + error.toString());
        }
    );


    let base64data = encode(desc);

    $.post("/master/connect/", {name: slaveName.val(), description: base64data}, function (data) {
        let remoteDesc = decode(data);
        trace(`[remote] Offer: ` + remoteDesc.sdp);
        connectionToMaster.setRemoteDescription(remoteDesc).then(
            function () {
                trace('[remote] AddIceCandidate success.')
            },
            function (error) {
                trace('[remote] Failed to add Ice Candidate: ' + error.toString());
            }
        );
    });
}

// noinspection DuplicatedCode
function trace(text) {
    if (text[text.length - 1] === '\n') {
        text = text.substring(0, text.length - 1);
    }
    if (window.performance) {
        const now = (window.performance.now() / 1000).toFixed(3);
        console.log(now + ': ' + text);
    } else {
        console.log(text);
    }
}

const decode = obj => JSON.parse(atob(obj));
const encode = obj => btoa(JSON.stringify(obj));