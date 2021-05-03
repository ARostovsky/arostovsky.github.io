'use strict';

let connection
let serviceChannel;

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
        serviceChannel = connection.createDataChannel('service');
        initializeEventLoggers(connection, slaveLog);

        let offer;
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
    });

    addAnswer.click(async function () {
        createOffer.prop('disabled', true);
        let answer = decode(answerField.val());
        if (answer === "" || answer == null) return;
        await connection.setRemoteDescription(answer);
    });
});

function slaveLog(text) {
    let logField = $('textarea#log');
    log(logField, text)
}