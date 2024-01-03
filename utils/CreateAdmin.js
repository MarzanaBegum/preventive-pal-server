const path = require("path");
const bcrypt = require("bcrypt");
const fsp = require("fs").promises;
const ADMIN = process.env.ADMIN;
const FILE_PATH = path.join(__dirname, "../", "data", "users.json");

module.exports = async () => {
    try {
        if (!ADMIN) {
            throw new Error(
                "Admin details not found in env, Please add and restart the server"
            );
        }

        const admins = await fsp.readFile(FILE_PATH);
        const parseData = JSON.parse(admins);
        const adminData = ADMIN.split("&");

        if (adminData.length !== 3) {
            throw new Error("Admin data not valid");
        }

        const findAdmin = parseData.find((v) => v.email === adminData[1]);

        if (findAdmin) {
            throw new Error("Admin user already exist!, Chill");
        }

        const hashPassword = await bcrypt.hash(adminData[2], 10);

        const newData = [
            ...parseData,
            {
                id: Date.now(),
                firstName: adminData[0].split(" ")[0],
                lastName: adminData[0].split(" ")[1],
                email: adminData[1],
                password: hashPassword,
                role: "admin",
                username: adminData[0].split(" ")[0].toLowerCase(),
            },
        ];

        await fsp.writeFile(FILE_PATH, JSON.stringify(newData));

        console.log("Admin user created successfully");
    } catch (err) {
        console.log(err.message);
    }
};
