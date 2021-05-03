'use strict';

let connection;
let serviceChannel;
let file;
let inputData;

$(document).ready(function () {
    let definitionSection = $("div#definition-section"),
        slaveNameLabel = $("label#name"),
        connectionSection = $("div#connecting-section"),
        slaveName = $(`input#slave-name`),
        createOffer = $(`button#create-offer`),
        offerSection = $("div#offer-section"),
        offerField = $("textarea#offer"),
        answerSection = $("div#answer-section"),
        addAnswer = $("button#add-answer"),
        answerField = $("textarea#answer");

    slaveName.keyup(function () {
        if (slaveName.val() !== "") {
            createOffer.prop("disabled", false);
        } else if (slaveName.val() === "") {
            createOffer.prop("disabled", true);
        }
    });

    createOffer.click(async function () {
        connectionSection.hide();
        slaveLog("Initializing peer connection, please wait...");
        connection = new RTCPeerConnection(pc_config);
        connectionInitialization();

        serviceChannel = connection.createDataChannel('service');
        dataChannelInitialization();

        window.channel = serviceChannel;
    });

    addAnswer.click(async function () {
        createOffer.prop('disabled', true);
        let answer = decode(answerField.val());
        if (answer === "" || answer == null) return;
        await connection.setRemoteDescription(answer);
    });

    function connectionInitialization() {
        let offer;
        connection.ondatachannel = event => {
            slaveLog(`Data channel "${event.channel.label}" is initialized`);
        };
        connection.onnegotiationneeded = async () => {
            offer = await connection.createOffer();
            await connection.setLocalDescription(offer);
        };
        connection.onicecandidate = async function (event) {
            if (event.candidate != null) {
                slaveLog(`Found ICE candidate: ${event.candidate.candidate}`);
                return;
            }
            slaveLog('Found all ICE candidates');
            offer = await connection.createOffer();

            let name = slaveName.val();
            slaveNameLabel.text(name);

            let offerJSON = offer.toJSON();
            offerJSON.name = name;
            offerField.val(encode(offerJSON));
            offerSection.show();

            answerSection.show();
            alert("Copy offer and paste to master");
        }
        connection.onicecandidateerror = function (event) {
            slaveLog(`Adding ICE candidate failed with ${event.errorCode}: ${event.errorText}`);
        }
        connection.onconnectionstatechange = function (event) {
            let state = event.target.connectionState;
            slaveLog(`Connection state change: ${state}`);
            if (state === "connected") {
                slaveName.val("");
                connectionSection.hide();
                offerField.val("");
                offerSection.hide();
                answerField.val("");
                answerSection.hide();
                definitionSection.show();
            } else if (definitionSection.is(":visible")) {
                definitionSection.hide();
                alert("Seems like connection is lost, restart page");
            }
        };
    }

    function dataChannelInitialization() {
        serviceChannel.onmessage = event => {
            slaveLog(`[${channel.label}] message: ${event.data}`);
        }

        let handleSendChannelStatusChange = () => {
            if (serviceChannel) {
                slaveLog(`[${channel.label}] status: ${channel.readyState}`);
            }
        }
        serviceChannel.onopen = handleSendChannelStatusChange;
        serviceChannel.onclose = handleSendChannelStatusChange;
    }
});

function slaveLog(text) {
    let logField = $('textarea#log');
    log(logField, text)
}