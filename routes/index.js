const router = require("express").Router();
const path = require("path");
const { generateRandomWord, upload } = require("../utils");
const fsp = require("fs").promises;

const DATA_PATH = path.join(__dirname, "../", "data");

// route ("/api/data?lang=en")

router.get("/data", async (req, res) => {
    const { lang } = req.query;
    try {
        const data = await fsp.readFile(
            path.join(DATA_PATH, `${lang || "en"}.json`)
        );

        res.status(200).send(data);
    } catch (err) {
        res.status(400).send({ message: "Something went wrong" });
    }
});

router.put("/data", async (req, res) => {
    const { lang } = req.query;
    const body = req.body;
    try {
        if (!(Array.isArray(body) ? body.every((v) => v.id) : body.id)) {
            throw new Error("Required id missing");
        }
        const FILE_PATH = path.join(DATA_PATH, `${lang || "en"}.json`);
        const data = await fsp.readFile(FILE_PATH);
        let parseData = JSON.parse(data);

        const haveIds = parseData.map((v) => v.id);

        if (Array.isArray(body)) {
            const receiveIds = body.map((v) => v.id);

            const check = receiveIds.map((v) => haveIds.includes(v));
            if (!check.every((v) => v)) {
                throw new Error("Id not found with data");
            }

            parseData = parseData.map((v) => {
                const findData = body.find((vv) => vv.id == v.id);
                if (findData) {
                    return { ...v, ...findData };
                } else {
                    return v;
                }
            });
        } else {
            if (!haveIds.includes(body.id)) {
                throw new Error("Id not found with data");
            }

            const index = parseData.findIndex((v) => v.id == body.id);
            if (index >= 0) {
                parseData[index] = { ...parseData[index], ...body };
            }
        }

        await fsp.writeFile(FILE_PATH, JSON.stringify(parseData));
        res.status(200).send({ message: "Request successfull" });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.put("/data/all", async (req, res) => {
    const { lang } = req.query;
    const body = req.body;
    try {
        const FILE_PATH = path.join(DATA_PATH, `${lang || "en"}.json`);

        await fsp.writeFile(FILE_PATH, JSON.stringify(body));
        res.status(200).send({ message: "Request successfully" });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.put("/data/reset", async (req, res) => {
    const { lang } = req.query;
    const body = req.body;
    try {
        const FILE_PATH = path.join(DATA_PATH, `${lang || "en"}.json`);

        const DEFAULT_FILE_PATH = path.join(
            DATA_PATH,
            "default",
            `${lang || "en"}.json`
        );

        const data = await fsp.readFile(DEFAULT_FILE_PATH, "utf8");

        await fsp.writeFile(FILE_PATH, JSON.stringify(data));
        res.status(200).send(data);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.post("/data/upload", upload.single("file"), async (req, res) => {
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  console.log(req.get("host"));
  res.status(200).send({ ...req.file, fileUrl });

});

router.post("/data/new", async (req, res) => {
    const { lang } = req.query;
    const body = req.body;
    try {
        const FILE_PATH = path.join(DATA_PATH, `${lang || "en"}.json`);
        const data = await fsp.readFile(FILE_PATH);
        const parseData = JSON.parse(data);
        body.id = body.type + generateRandomWord();
        parseData.push(body);

        await fsp.writeFile(FILE_PATH, JSON.stringify(parseData));
        res.status(200).send(data);
    } catch (err) {
        res.status(400).send({ message: "Something went wrong" });
    }
});

module.exports = router;
