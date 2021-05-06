'use strict';

let name;
let connection;
let serviceChannel;
let file;
let inputData;
let result = NaN;

$(document).ready(function () {
    window.debug = false;

    let definitionSection = $("div#definition-section"),
        slaveNameLabel = $("label#name"),
        copyOffer = $("button#copy-offer"),
        connectionSection = $("div#connecting-section"),
        slaveName = $(`input#slave-name`),
        createOffer = $(`button#create-offer`),
        offerSection = $("div#offer-section"),
        offerField = $("textarea#offer"),
        answerSection = $("div#answer-section"),
        addAnswer = $("button#add-answer"),
        answerField = $("textarea#answer");

    // noinspection DuplicatedCode
    slaveName.keyup(function () {
        if (slaveName.val() !== "") {
            createOffer.prop("disabled", false);
        } else if (slaveName.val() === "") {
            createOffer.prop("disabled", true);
        }
    });

    copyOffer.click(function () {
        copyToClipboard(offerField.val());
        slaveLog("Offer is copied to clipboard!");
        copyOffer.prop("disabled", true);
    });

    createOffer.click(async function () {
        connectionSection.hide();
        slaveLog("Initializing peer connection, please wait...");
        connection = new RTCPeerConnection(pc_config);
        connectionInitialization();

        serviceChannel = connection.createDataChannel('service');
        dataChannelInitialization();

        // window.channel = serviceChannel;
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

            name = slaveName.val();
            slaveNameLabel.text(name);

            let offerJSON = offer.toJSON();
            offerJSON.name = name;
            offerField.val(encode(offerJSON));
            copyOffer.prop("disabled", false);
            offerSection.show();

            answerSection.show();
            document.title = name;
            alert("Copy offer and paste to master");
        }
        connection.onicecandidateerror = function (event) {
            if (debug) {
                slaveLog(`Adding ICE candidate '${event.url}' failed with ${event.errorCode}: ${event.errorText}`);
            }
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
        serviceChannel.onmessage = async event => await processMessage(event)

        let handleSendChannelStatusChange = () => {
            if (serviceChannel) {
                slaveLog(`[${serviceChannel.label}] status: ${serviceChannel.readyState}`);
            }
        }
        serviceChannel.onopen = handleSendChannelStatusChange;
        serviceChannel.onclose = handleSendChannelStatusChange;
    }

    async function processMessage(event) {
        let message = decode(event.data);

        if (message.type === "execute") {
            slaveLog(`[${serviceChannel.label}] message with execution data has been received`);
            file = Uint8Array.from(atob(message.file), c => c.charCodeAt(0));
            let f = getBufferFromFile(atob(message.file));
            slaveLog(`[${serviceChannel.label}] function: ${message.function}`);
            slaveLog(`[${serviceChannel.label}] input data: ${message.inputData}`);
            inputData = getNumbers(message.inputData);
            if (inputData.length !== 0) {
                await execute(message.function);
                slaveLog(`Got result '${result}' and sending it back to master`);
            } else {
                // to be 100% sure
                result = NaN;
            }
            serviceChannel.send(encode({
                type: "result",
                name: name,
                value: result
            }));
            result = NaN;
        } else {
            slaveLog(`[${serviceChannel.label}] unexpected message: ${message}`);
        }
    }

    async function execute(func) {
        // One page is 64KiB, 1-7 pages are allocated
        // const memory = new WebAssembly.Memory({initial: 1, maximum: 7});

        // Each element in Int32Array takes 4B, so 16'000 elements could be set to 1 page
        // Let's take 7 pages max (with extra margin), around 450 KiB and be able to process 100k i32 numbers max
        if (inputData.length > 100000) {
            slaveLog("Too much data, no more than 100k could be proceed")
            return;
        }
        try {
            await WebAssembly.instantiate(file, /*{env: {"memory": memory}}*/).then(file => {
                const array = new Int32Array(file.instance.exports.memory.buffer);
                // const array = new Int32Array(memory.buffer);
                array.set(inputData);
                result = file.instance.exports[func](array, inputData.length);
            });
        } catch (e) {
            slaveLog("Execution failed, stack trace:");
            slaveLog(e.toString())
        }

    }
});

function slaveLog(text) {
    let logField = $('textarea#log');
    log(logField, text)
}