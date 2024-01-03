const multer = require("multer");
const path = require("path");
const fsp = require("fs").promises;

exports.generateRandomWord = function () {
    const minLength = 5;
    const maxLength = 7;
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const wordLength =
        Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let randomWord = "";

    for (let i = 0; i < wordLength; i++) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        randomWord += alphabet.charAt(randomIndex);
    }

    return randomWord;
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(path.resolve("public"), "uploads"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${path.extname(
                file.originalname
            )}`
        );
    },
});

exports.StatusError = (msg, code) => {
    const err = new Error(msg);
    err.code = code;
    return err;
};

exports.GetParseData = async (filename) => {
    const FILE_PATH = path.join(
        __dirname,
        "../",
        "data",
        filename.includes(".json") ? filename : `${filename}.json`
    );
    const data = await fsp.readFile(path.join(FILE_PATH));
    let parsedData = JSON.parse(data);
    return [parsedData, FILE_PATH];
};

exports.upload = multer({ storage });
