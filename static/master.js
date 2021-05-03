// const memory = new WebAssembly.Memory({initial: 10, maximum: 100});
let connections = [];

$(document).ready(function () {
    let slavesListSection = $("div#list-slaves-section"),
        slavesList = $("ul#slaves-list"),
        addSlave = $("button#add-slave"),
        offerSection = $("div#offer-section"),
        offerField = $("textarea#offer"),
        answerSection = $("div#answer-section"),
        answerField = $("textarea#answer"),
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

    createAnswer.click(async function () {
        let offer = decode(offerField.val());
        if (offer === "" || offer == null) return;

        offerField.val("");
        offerSection.hide();
        let name = offer.name;

        let connection = new RTCPeerConnection(pc_config);
        await connection.setRemoteDescription(offer);
        let serviceChannel = connection.createDataChannel('service');
        initializeEventLoggers(connection, masterLog, name);

        let answer;
        let state;
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
            answerField.val(encode(answer));
            answerSection.show();
            alert(`Copy answer and paste to slave ${name}`);
        };
        connection.onconnectionstatechange = function (event) {
            state = event.target.connectionState;
            masterLog(`Connection state change: ${state}`, name);
            if (state === "connected") {
                answerField.val("");
                answerSection.hide();
                slavesList.append(`<li>${name}</li>`);
                connections.push({
                    "name": name,
                    "connection": connection,
                    "serviceChannel": serviceChannel
                });
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
    });

    closeAdding.click(function () {
        slavesListSection.show();
        offerSection.hide();
        addSlave.show();
    });

    startButton.click(function () {
        let file = $("#wasm-file").val();

        fetch(`/uploads/${file}`)
            .then(response => response.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes, {}))
            .then(results => {
                alert(results.instance.exports.fun());
            });
    });
});

function masterLog(text, name) {
    let logField = $("textarea#log");
    log(logField, text, name)
}
