const pc_config = {
    iceServers:
        [
            {urls: "stun:stun.l.google.com:19302"},
            {urls: "stun:stun.stunprotocol.org"}
        ]
};

function initializeEventLoggers(connection, log, name = "") {
    connection.ondatachannel = function (event) {
        log(`Data channel initialized: ${event.channel.label}`, name);
    };

    connection.onconnectionstatechange = function (event) {
        log(`Connection state change: ${event.target.connectionState}`, name);
    };
}