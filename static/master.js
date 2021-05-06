let connections = [];
let result = [];
let webAssembly;
let selectedFunc;

$(document).ready(function () {
    window.debug = false;

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
        fileFunctions = $("button#wasm-file-functions"),
        selectedFunction = $("select#wasm-function"),
        inputData = $("textarea#wasm-data"),
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

    fileFunctions.click(async function () {
        let functionsList;

        let fileName = document.getElementById('wasm-file-input').files[0];
        getBinary(fileName, async file => {
            try {
                await WebAssembly.instantiate(file).then(file => {
                    webAssembly = file;
                    functionsList = getMethods(file.instance.exports);
                    functionsList.forEach(func => {
                        selectedFunction.append(`<option>${func}</option>`)
                    });
                    $("#wasm-file").hide();
                    inputData.prop("disabled", false);
                    startButton.prop("disabled", false);
                });
            } catch (e) {
                masterLog("Execution failed, stack trace:");
                masterLog(e.toString())
            }
        });
    })

    startButton.click(async function () {
        // let fileName = $("#wasm-file").val();
        let fileName = $('#wasm-file-input').prop('files')[0];
        selectedFunc = selectedFunction.val();
        let input = inputData.val().split(" ").map(numStr => {
            let value = parseInt(numStr);
            if (isNaN(value)) {
                masterLog(`Check input data, '${numStr}' is not a number`);
            } else {
                return value;
            }
        });
        result = [];

        const connectionLength = connections.length
        input.forEach(function (value, index) {
            let connectionIndex = index % connectionLength;
            connections[connectionIndex].inputData.push(value);
        })

        let reader = new FileReader();
        reader.onload = function () {
            let encodedFile = btoa(this.result);
            connections.forEach(function (connection) {
                let message = {
                    type: "execute",
                    file: encodedFile,
                    function: selectedFunc,
                    inputData: connection.inputData
                };
                connection.serviceChannel.send(encode(message));
            });
        };

        reader.readAsBinaryString(fileName);
        masterLog(`Starting executing '${selectedFunc}' function of '${fileName.name}' file with '${input}' data`);
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
                name: name,
                connection: connection,
                serviceChannel: serviceChannel,
                inputData: []
            });
        }
        connection.onnegotiationneeded = async function () {
            answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
        };
        connection.onicecandidate = async function (event) {
            if (event.candidate != null) {
                if (debug) {
                    masterLog(`Found ICE candidate: ${event.candidate.candidate}`, name);
                }
                return;
            }
            masterLog(`Found all ICE candidates`, name);
            if (state !== "failed") {
                answerField.val(encode(answer));
                answerSection.show();
                alert(`Copy answer and paste to slave ${name}`);
            } else {
                alert("Connection is failed");
            }
        };
        connection.onicecandidateerror = function (event) {
            if (debug) {
                masterLog(`Adding ICE candidate failed with ${event.errorCode}: ${event.errorText}`, name);
            }
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
        channel.onmessage = event => processMessage(channel, event, name);

        function handleReceiveChannelStatusChange() {
            if (channel && debug) {
                masterLog(`[${channel.label}] status: ${channel.readyState}`, name);
            }
        }

        channel.onopen = () => handleReceiveChannelStatusChange();
        channel.onclose = () => handleReceiveChannelStatusChange();
    }

    function processMessage(channel, event, name) {
        let message = decode(event.data);
        if (debug) {
            masterLog(`[${channel.label}] message: ${JSON.stringify(message)}`, name);
        }
        if (message.type === "result") {
            result.push(message.value);
        }
        if (result.length === connections.length) {
            if (result.length !== 0) {
                masterLog(`All slaves returned their results: ${result}`);
                result = getNumbers(result);
                const array = new Int32Array(webAssembly.instance.exports.memory.buffer);
                array.set(result);
                let finalResult = webAssembly.instance.exports[selectedFunc](array, result.length);
                masterLog(`Final result: ${finalResult}`)
            } else {
                masterLog(`Final result is empty`)
            }

            result = [];
            connections.forEach(function (connection) {
                connection.inputData = [];
            })
        }
    }
});

function masterLog(text, name) {
    let logField = $("textarea#log");
    log(logField, text, name)
}
