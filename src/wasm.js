const memory = new WebAssembly.Memory({initial: 10, maximum: 100});
let instance = null;

module.exports = {
    loadFile: function (file) {
        instance = file.arrayBuffer().then(wasm =>
            WebAssembly.instantiate(wasm, {env: {"memory": memory}})
        );
        console.log(instance);
    }
}