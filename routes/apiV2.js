const router = require("express").Router();
const path = require("path");
const fsp = require("fs").promises;
const {
    generateRandomWord,
    StatusError,
    GetParseData,
} = require("../utils/index");
const { upload } = require("../utils/index");
const DATA_PATH = path.join(__dirname, "../", "data");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
    generateRefreshToken,
    generateAccessToken,
} = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const fs = require("fs");

// route ("/api/data?lang=en")

router.get("/data", async (req, res) => {
    const lang = req.query.lang || "en";
    try {
        const data = await fsp.readFile(path.join(DATA_PATH, "data.json"));

        let parseData = JSON.parse(data);

        const newData = await Promise.all(parseData.filter((v) => !v?.hidden));

        res.status(200).send(newData);
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Something went wrong" });
    }
});

router.put("/data/all", async (req, res) => {
    const { lang } = req.query;
    const body = req.body;
    try {
        const FILE_PATH = path.join(DATA_PATH, `data.json`);

        await fsp.writeFile(FILE_PATH, JSON.stringify(body));
        res.status(200).send({ message: "Request successfully" });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.get("/data/admin", async (req, res) => {
    const { lang } = req.query;
    try {
        const data = await fsp.readFile(path.join(DATA_PATH, "data.json"));

        let parseData = JSON.parse(data);

        res.status(200).send(parseData);
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Something went wrong" });
    }
});

router.put("/data", async (req, res) => {
    const lang = req.query.lang || "en";
    const body = req.body;
    try {
        if (!["en", "spa"].includes(lang)) {
            throw new Error("Language is not valid");
        }
        if (!body.id) {
            throw new Error("Required id missing");
        }
        const FILE_PATH = path.join(DATA_PATH, `data.json`);
        const readData = await fsp.readFile(FILE_PATH);
        let parseData = JSON.parse(readData);

        const index = parseData.findIndex((v) => v.id === body.id);
        if (index < 0) {
            throw new Error("Id not valid");
        }

        parseData[index] = body;

        await fsp.writeFile(FILE_PATH, JSON.stringify(parseData));
        res.status(200).send({ message: "Request successful" });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.post("/data/new", async (req, res) => {
    const body = req.body;
    try {
        const FILE_PATH = path.join(DATA_PATH, `data.json`);
        const data = await fsp.readFile(FILE_PATH);
        const parseData = JSON.parse(data);
        body.id = body.type + generateRandomWord();
        parseData.push(body);

        await fsp.writeFile(FILE_PATH, JSON.stringify(parseData));
        res.status(200).send(data);
    } catch (err) {
        console.log(err);
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

// get all users route
router.get("/users", async (req, res) => {
    try {
        const data = await fsp.readFile(path.join(DATA_PATH, "users.json"));

        let parsedUsers = JSON.parse(data);

        // console.log(parsedUsers);
        res.status(200).send(parsedUsers);
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Something went wrong" });
    }
});

// get user by query
router.get("/user/email/:email", async (req, res) => {
    const { email } = req.params;
    try {
        if (!email) throw StatusError("Required id not found", 400);

        const [data] = await GetParseData("users");

        const findData = data.find((v) => v.email === email);

        if (!findData) throw StatusError("Data not found", 404);

        res.status(200).send(findData);
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

//
router.get("/user/:id", async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) throw StatusError("Required id not found", 400);

        const [data] = await GetParseData("users");

        const { password, ...findData } = data.find((v) => v.id === Number(id));

        if (!findData) throw StatusError("Data not found", 404);

        res.status(200).send(findData);
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// update user info
router.put("/user", async (req, res) => {
    const { email, firstName, lastName, username, role } = req.body;

    try {
        const data = await fsp.readFile(path.join(DATA_PATH, "users.json"));

        const parsedUsers = JSON.parse(data);

        const index = parsedUsers.findIndex((user) => user.email === email);
        if (index < 0) {
            // throw new Error("Can't find user!");
            return res.status(404).send({ message: "Can't find user!" });
        }

        const updatingUser = parsedUsers[index];

        const userInfo = {
            ...updatingUser,
            firstName: firstName,
            lastName: lastName,
            username: username,
            role: role,
        };

        parsedUsers[index] = userInfo;

        await fsp.writeFile(
            path.join(DATA_PATH, "users.json"),
            JSON.stringify(parsedUsers)
        );
        res.status(200).send({ message: "Admin info successfully updated!" });
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Something went wrong" });
    }
});

// delete user by email
router.delete("/user/:email", async (req, res) => {
    const email = req.params.email;

    try {
        const data = await fsp.readFile(path.join(DATA_PATH, "users.json"));

        const parsedUsers = JSON.parse(data);

        const newUsers = await Promise.all(
            parsedUsers.filter((user) => user.email !== email)
        );

        await fsp.writeFile(
            path.join(DATA_PATH, "users.json"),
            JSON.stringify(newUsers)
        );
        res.status(200).send({ message: "User deleted successfully!" });
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Something went wrong" });
    }
});

// user registration
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw StatusError("Please fill in all fields", 400);
        }
        if (password.length > 8)
            throw StatusError("Password must be 8 characters", 400);

        const FILE_PATH = path.join(DATA_PATH, `users.json`);

        const data = await fsp.readFile(FILE_PATH);
        let parsedUsers = JSON.parse(data);

        let foundUser = parsedUsers.find((user) => user.email === email);

        if (foundUser) throw StatusError("Admin already exists!", 400);

        let hashPassword = await bcrypt.hash(password, 10);

        let newUsers = [
            ...parsedUsers,
            {
                id: Date.now(),
                email: email,
                password: hashPassword,
                firstName: "",
                lastName: "",
                username: "",
                role: "",
                resetToken: null,
            },
        ];

        await fsp.writeFile(FILE_PATH, JSON.stringify(newUsers));

        res.status(200).send({ message: "Admin created successfully" });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// user login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw StatusError("Please fill in all fields", 400);
        }
        if (password.length < 8)
            throw StatusError("Password must be 8 characters", 400);

        const FILE_PATH = path.join(DATA_PATH, `users.json`);

        const data = await fsp.readFile(FILE_PATH);
        let parsedUsers = JSON.parse(data);

        // finding user
        let foundUser = parsedUsers.find((user) => user.email === email);

        if (!foundUser) throw StatusError("Invalid credentials!");

        const passwordMatch = await bcrypt.compare(
            password,
            foundUser.password
        );

        if (!passwordMatch) throw StatusError("Invalid credentials!");

        const accessToken = await generateAccessToken({
            id: foundUser.id,
        });

        const { password: pass, ...user } = foundUser;

        res.status(200).send({
            success: true,
            message: "Logged In Successfully",
            token: accessToken,
        });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// Forget password
router.post("/forget-password", async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) throw StatusError("Required email not found", 400);

        const [data] = await GetParseData("users.json");

        let foundUser = data.find((user) => user.email === email);

        if (!foundUser) throw StatusError("User doesn't exits!");

        const [tokenData, TOKEN_FILE] = await GetParseData("tokens.json");

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        const resetToken = crypto.randomBytes(32).toString("hex");

        await fsp.writeFile(
            TOKEN_FILE,
            JSON.stringify([
                ...tokenData,
                {
                    token: resetToken,
                    user: foundUser.id,
                    expire: expiryDate.getTime(),
                },
            ])
        );

        const resetUrl = `${process.env.CLIENT_URL}/admin/reset-password?token=${resetToken}`;

        sendEmail({
            email,
            subject: "Password reset",
            message: `Reset password link: ${resetUrl}`,
        });

        res.status(200).send({
            message: "Password reset request successful",
            token: resetToken,
        });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// reset password
router.post("/resend-email", async (req, res) => {
    const { email, token } = req.body;

    try {
        if (!email || !token) {
            throw StatusError("Required field not found", 400);
        }

        const [tokenData, TOKEN_FILE] = await GetParseData("tokens");

        const findToken = tokenData.find((v) => v.token === token);

        if (!findToken) throw StatusError("Token not valid!", 400);

        if (findToken.expire < Date.now()) {
            throw StatusError("Token has been expired!", 400);
        }

        const [data, FILE_PATH] = await GetParseData("users");

        let foundUser = data.find((v) => v.email === email);

        if (!foundUser) throw StatusError("", 400);

        const resetUrl = `${process.env.CLIENT_URL}/admin/reset-password?token=${findToken.token}`;

        await sendEmail({
            email,
            subject: "Password reset",
            message: `Reset password link: ${resetUrl}`,
        });

        res.status(200).send({ message: "Resend email successfully!" });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// reset password
router.put("/reset-password", async (req, res) => {
    const { password, confirm_password } = req.body;
    const { token } = req.query;

    try {
        if (!password || !confirm_password || !token) {
            throw StatusError("Required field not found", 400);
        }

        if (password.length < 8 || confirm_password.length < 8) {
            throw StatusError("Password at-least 8 characters", 400);
        }

        if (password !== confirm_password) {
            throw StatusError("Password did not match!", 400);
        }

        const [tokenData, TOKEN_FILE] = await GetParseData("tokens");

        const findToken = tokenData.find((v) => v.token === token);

        if (!findToken) throw StatusError("Token not valid!", 400);

        if (findToken.expire < Date.now()) {
            throw StatusError("Token has been expired!", 400);
        }

        const [data, FILE_PATH] = await GetParseData("users");

        let foundUser = data.find((user) => user.id === findToken.user);

        if (!foundUser) throw StatusError("", 400);

        let hashPassword = await bcrypt.hash(password, 10);

        for (let i = 0; i < data.length; i++) {
            if (data[i].id === foundUser.id) {
                data[i].password = hashPassword;
                break;
            }
        }

        await fsp.writeFile(FILE_PATH, JSON.stringify(data));
        await fsp.writeFile(
            TOKEN_FILE,
            JSON.stringify(tokenData.filter((v) => v.token !== findToken.token))
        );

        res.status(200).send({ message: "Password reset successfully!" });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// change password
router.post("/change-password", async (req, res) => {
    const { id, oldPassword, newPassword, confirmNewPassword } = req.body;

    try {
        if (!newPassword || !confirmNewPassword || !oldPassword || !id) {
            throw StatusError("Please fill all required fields", 400);
        }

        if (newPassword !== confirmNewPassword) {
            throw StatusError("Password did not match!", 400);
        }
        if (newPassword.length < 8) {
            throw StatusError("password at-least 8 characters", 400);
        }

        const [data, FILE_PATH] = await GetParseData("users");

        let foundUser = data.find((user) => user.id === Number(id));

        if (!foundUser) throw StatusError("", 400);

        const matchOldPassword = await bcrypt.compare(
            oldPassword,
            foundUser.password
        );

        if (!matchOldPassword)
            throw StatusError("Old password didn't match!", 400);

        let hashPassword = await bcrypt.hash(newPassword, 10);

        for (let i = 0; i < data.length; i++) {
            if (data[i].id === Number(id)) {
                data[i].password = hashPassword;
                break;
            }
        }

        await fsp.writeFile(FILE_PATH, JSON.stringify(data));
        console.log(data);

        res.status(200).send({ message: "Password changed successfully!" });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// send verification code
router.post("/send-verification-code", async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            throw StatusError("Required field not found", 400);
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        const [codeData, CODE_FILE] = await GetParseData(
            "verification-code.json"
        );

        await fsp.writeFile(
            CODE_FILE,
            JSON.stringify([
                ...codeData,
                {
                    code: verificationCode,
                    expirationTime: Date.now() + 300000,
                },
            ])
        );

        await sendEmail({
            email,
            subject: "Verification email",
            message: `Your verification code : ${verificationCode}`,
        });

        res.status(200).send({ message: "Verificaton code sent !" });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// Verify emamil
router.post("/email-verify", async (req, res) => {
    const { verificationCode } = req.body;
    try {
        if (!verificationCode) {
            throw StatusError("Required field not found", 400);
        }

        const [codeData, CODE_FILE] = await GetParseData(
            "verification-code.json"
        );
        const filterCodeData = codeData?.filter(
            (item) => item.code === verificationCode
        );
        const validCode = filterCodeData[filterCodeData.length - 1];

        if (
            validCode &&
            validCode.code === verificationCode &&
            validCode.expirationTime >= Date.now()
        ) {
            return res
                .status(200)
                .send({ message: "Verification successful!" });
        } else {
            return res
                .status(400)
                .send({ message: "Invalid verification code !" });
        }
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

// change email

router.put("/user/change-email", async (req, res) => {
    const { email, firstName, lastName, username, role, id } = req.body;

    try {
        const data = await fsp.readFile(path.join(DATA_PATH, "users.json"));

        const parsedUsers = JSON.parse(data);

        const index = parsedUsers.findIndex((user) => user.id === id);
        if (index < 0) {
            // throw new Error("Can't find user!");
            return res.status(404).send({ message: "Can't find user!" });
        }

        const updatingUser = parsedUsers[index];

        const userInfo = {
            ...updatingUser,
            id: id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            username: username,
            role: role,
        };

        parsedUsers[index] = userInfo;

        await fsp.writeFile(
            path.join(DATA_PATH, "users.json"),
            JSON.stringify(parsedUsers)
        );
        const accessToken = await generateAccessToken({
            id: id,
            email: email,
        });

        res.status(200).send({
            message: "Admin info successfully updated!",
            token: accessToken,
        });
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Something went wrong" });
    }
});

router.post("/request-admin", async (req, res) => {
    try {
        const body = req.body;

        const [userData] = await GetParseData("users");

        const newUser = {
            id: Date.now(),
            ...body,
        };

        const checkUser = userData.find((v) => v.email === body.email);

        if (checkUser) throw StatusError("Admin already exist!");

        const [newUsers, NEW_USERS_FILE] = await GetParseData("new-users");

        const foundUser = newUsers.find((v) => v.email === newUser.email);

        if (!foundUser) {
            await fsp.writeFile(
                NEW_USERS_FILE,
                JSON.stringify([...newUsers, newUser])
            );
        }

        const [tokenData, TOKEN_FILE] = await GetParseData("tokens.json");

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        const resetToken = crypto.randomBytes(32).toString("hex");

        await fsp.writeFile(
            TOKEN_FILE,
            JSON.stringify([
                ...tokenData,
                {
                    token: resetToken,
                    user: foundUser ? foundUser.id : newUser.id,
                    expire: expiryDate.getTime(),
                },
            ])
        );

        const requestUrl = `${process.env.CLIENT_URL}/admin/new-admin?token=${resetToken}`;

        await sendEmail({
            email: newUser.email,
            subject: "Admin Invitation",
            message: `Your invitation link : ${requestUrl}`,
        });

        res.status(200).send({ message: "Request successful" });
    } catch (err) {
        res.status(err.code || 500).send({ message: err.message });
    }
});

router.post("/request-admin/create", async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) throw StatusError("Token required");

        const { password } = req.body;

        if (!password) {
            throw StatusError("Please fill in all fields", 400);
        }
        if (password.length < 8)
            throw StatusError("Password must be 8 characters", 400);

        const [tokenData] = await GetParseData("tokens");

        const findToken = tokenData.find((v) => v.token === token);

        if (!findToken) throw StatusError("Token not valid");

        const [newUsersData] = await GetParseData("new-users");

        const findNewUser = newUsersData.find((v) => v.id == findToken.user);

        const [data, FILE_PATH] = await GetParseData("users");

        let foundUser = data.find((user) => user.email === findNewUser.email);

        if (foundUser) throw StatusError("Admin already exists!", 400);

        let hashPassword = await bcrypt.hash(password, 10);

        let newUsers = [
            ...data,
            {
                ...findNewUser,
                password: hashPassword,
            },
        ];

        await fsp.writeFile(FILE_PATH, JSON.stringify(newUsers));

        res.status(200).send({ message: "Admin created successfully" });
    } catch (err) {
        res.status(err.code || 500).send({
            message: err.message || "Something went wrong",
        });
    }
});

module.exports = router;
