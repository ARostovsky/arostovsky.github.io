const multer = require("multer"),
    path = require("path");

const wasmFilter = function(req, file, cb) {
    if (!file.originalname.match(/\.wasm$/)) {
        req.fileValidationError = 'Only .wasm files are allowed!';
        return cb(new Error('Only .wasm files are allowed!'), false);
    }
    cb(null, true);
};
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});


exports.storage = storage;
exports.wasmFilter = wasmFilter;