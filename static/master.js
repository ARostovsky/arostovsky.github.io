// const memory = new WebAssembly.Memory({initial: 10, maximum: 100});

$(document).ready(function () {
    $("button#create-local-offer").click(function () {
        $.post("/master/offer/", function (data) {
            $("#local-offer-value").val(data);
        });
    });

    $("button#startButton").click(function () {
        let file = $("#wasm-file").val();

        fetch(`/uploads/${file}`)
            .then(response => response.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes, {}))
            .then(results => {
                alert(results.instance.exports.fun());
            });
    });
});
