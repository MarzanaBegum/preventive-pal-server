require("dotenv").config();
const cors = require("cors");
const express = require("express");
const CreateAdmin = require("./utils/CreateAdmin");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api", require("./routes"));
app.use("/api/v2", require("./routes/apiV2"));
app.use("/api/menu", require("./routes/menu"));

app.listen(process.env.PORT || 4000, console.log("Server is running"));

CreateAdmin();
