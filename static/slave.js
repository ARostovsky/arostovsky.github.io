'use strict';

const pc_config = {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]};
let slaveButtonConnect = $(`button#slave-connect`),
    slaveName = $(`input#slave-name`),
    masterOffer = $("textarea#local-offer-value");

let connectionToMaster = new RTCPeerConnection(pc_config);
let connectionFromMaster = new RTCPeerConnection(pc_config);
let serviceChannel;

$(document).ready(function () {
    slaveName.keyup(function () {
        if (slaveName.val() !== "" && masterOffer.val() !== "") {
            slaveButtonConnect.prop("disabled", false);
        } else if (slaveName.val() === "") {
            slaveButtonConnect.prop("disabled", true);
        }
    });

    connectionToMaster.onicecandidate = function (event) {
        if (event.candidate) {
            trace(`ICE candidate: \n ${event.candidate.candidate}`);
        }
    };

    connectionToMaster.ondatachannel = function (event) {
        trace(`Data channel: \n ${event.channel.label}`);
    };

    connectionToMaster.onconnectionstatechange = function (event) {
        trace(event);
    }

    slaveButtonConnect.click(function () {
        // close old connection
        serviceChannel = connectionToMaster.createDataChannel('service');

        connectionToMaster.createOffer().then(
            gotDescription,
            function (error) {
                trace('[local] Failed to create session description: ' + error.toString());
            }
        );

        let remoteMasterDescription = decode(masterOffer.val());
        connectionFromMaster.setRemoteDescription(remoteMasterDescription).then(function () {
            connectionFromMaster.createAnswer().then(function (desc) {
                connectionFromMaster.setLocalDescription(desc).then(function () {
                    let base64data = encode(desc);
                    $.post("/master/connect-master/", {description: base64data});
                });
            });
        });
    })

    $("#service-status").click(function () {
        console.log(connectionToMaster)
        console.log(serviceChannel);
        alert(`${connectionToMaster.readyState}\n${connectionToMaster.sctp.state}`);
    })

    connectionToMaster.ondatachannel = function (event) {
        let channel = event.channel;
        trace(`${channel.label} connect`);
        switch (channel.label) {
            case 'service' : {
                serviceChannel = channel;
                serviceChannel.onmessage = traceOnEvent;
                serviceChannel.onopen = traceOnEvent;
                serviceChannel.onclose = traceOnEvent;
                break;
            }
            default:
                trace(channel.label)
                break;
        }

    }
});

async function gotDescription(desc) {
    // trace(`[local] Offer: ` + desc.sdp);
    connectionToMaster.setLocalDescription(desc).then(
        function () {
            trace('[local] AddIceCandidate success.')
        },
        function (error) {
            trace('[local] Failed to add Ice Candidate: ' + error.toString());
        }
    );


    let base64data = encode(desc);

    $.post("/master/connect-slave/", {name: slaveName.val(), description: base64data}, function (data) {
        let remoteDesc = decode(data);
        // trace(`[remote] Offer: ` + remoteDesc.sdp);
        connectionToMaster.setRemoteDescription(remoteDesc).then(
            function () {
                trace('[remote] AddIceCandidate success.');

            },
            function (error) {
                trace('[remote] Failed to add Ice Candidate: ' + error.toString());
            }
        );
    });
}

function traceOnEvent(event) {
    trace(event.data);
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