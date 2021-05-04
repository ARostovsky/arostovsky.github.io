let connections = [];

$(document).ready(function () {
    let slavesListSection = $("div#list-slaves-section"),
        slavesList = $("ul#slaves-list"),
        addSlave = $("button#add-slave"),
        offerSection = $("div#offer-section"),
        offerField = $("textarea#offer"),
        answerSection = $("div#answer-section"),
        answerField = $("textarea#answer"),
        copyAnswer = $("button#copy-answer"),
        createAnswer = $("button#create-answer"),
        closeAdding = $("button#close-adding"),
        startButton = $("button#start-button");

    addSlave.click(function () {
        slavesListSection.hide();
        offerSection.show();
        addSlave.hide();
    });

    offerField.keyup(function () {
        if (offerField.val() !== "") {
            createAnswer.prop("disabled", false);
        } else if (offerField.val() === "") {
            createAnswer.prop("disabled", true);
        }
    });

    copyAnswer.click(function () {
        copyToClipboard(answerField.val());
        masterLog("Answer is copied to clipboard!");
        copyAnswer.prop("disabled", true);
    });

    createAnswer.click(async function () {
        let offer = decode(offerField.val());
        if (offer === "" || offer == null) return;

        offerField.val("");
        copyAnswer.prop("disabled", false);
        offerSection.hide();
        await initializeConnection(offer);
    });

    closeAdding.click(function () {
        slavesListSection.show();
        offerSection.hide();
        addSlave.show();
    });

    startButton.click(async function () {
        let fileName = $("#wasm-file").val();
        let input = $("#wasm-data").val().split(" ").map(numStr => {
            let value = parseInt(numStr);
            if (isNaN(value)) {
                masterLog(`Check input data, ${numStr} is not a number`);
            } else {
                return value;
            }
        });

        let reader = new FileReader();
        reader.onload = function () {
            let message = {
                type: "execute",
                file: btoa(this.result),
                input: input
            };
            connections.forEach(function (connection) {
                connection.serviceChannel.send(encode(message));
            });
        };

        await fetch(`/uploads/${fileName}`)
            .then(response => response.blob())
            .then(blob => reader.readAsBinaryString(blob));
        // .then(results => {
        //     alert(results.instance.exports.fun());
        // });
    });

    async function initializeConnection(offer) {
        let connection = new RTCPeerConnection(pc_config);
        await connection.setRemoteDescription(offer);
        let serviceChannel;

        let name = offer.name;
        let answer;
        let state;

        connection.ondatachannel = function (event) {
            serviceChannel = event.channel;
            masterLog(`Data channel "${event.channel.label}" is initialized`, name);
            initializeDataChannel(serviceChannel, name);
            connections.push({
                "name": name,
                "connection": connection,
                "serviceChannel": serviceChannel
            });
        }
        connection.onnegotiationneeded = async function () {
            answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
        };
        connection.onicecandidate = async function (event) {
            if (event.candidate != null) {
                masterLog(`Found ICE candidate: ${event.candidate.candidate}`, name);
                return;
            }
            masterLog(`Found all ICE candidates`, name);
            masterLog(`State ${state}`, name);
            if (state !== "failed") {
                answerField.val(encode(answer));
                answerSection.show();
                alert(`Copy answer and paste to slave ${name}`);
            } else {
                alert("Connection is failed");
            }
        };
        connection.onicecandidateerror = function (event) {
            masterLog(`Adding ICE candidate failed with ${event.errorCode}: ${event.errorText}`, name);
        }
        connection.onconnectionstatechange = function (event) {
            state = event.target.connectionState;
            masterLog(`Connection state change: ${state}`, name);
            if (state === "connected") {
                answerField.val("");
                answerSection.hide();
                slavesList.append(`<li>${name}</li>`);
                slavesListSection.show();
                addSlave.show();
            } else if (state === "failed") {
                answerField.val("");
                answerSection.hide();
                slavesListSection.show();
                addSlave.show();
            }
        };

        answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        return connection;
    }

    function initializeDataChannel(channel, name) {
        channel.onmessage = event => {
            masterLog(`[${channel.label}] message: ${event.data}`, name);
        }

        function handleReceiveChannelStatusChange() {
            if (channel) {
                masterLog(`[${channel.label}] status: ${channel.readyState}`, name);
            }
        }

        channel.onopen = () => handleReceiveChannelStatusChange();
        channel.onclose = () => handleReceiveChannelStatusChange();
    }
});

function masterLog(text, name) {
    let logField = $("textarea#log");
    log(logField, text, name)
}
