const { GetParseData } = require("../utils");
const fsp = require("fs").promises;
const router = require("express").Router();
const path = require("path");

router.get("/", async (req, res) => {
    try {
        const [data] = await GetParseData("menu");

        res.status(200).send(data);
    } catch (err) {
        res.status(400).send({
            message: err.message || "Something went wrong",
        });
    }
});

router.put("/", async (req, res) => {
    try {
        const body = req.body;

        await fsp.writeFile(
            path.join(__dirname, "../", "data", "menu.json"),
            JSON.stringify(body)
        );

        res.status(200).send(body);
    } catch (err) {
        res.status(400).send({
            message: err.message || "Something went wrong",
        });
    }
});

module.exports = router;
