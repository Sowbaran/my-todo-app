const express = require("express");
require('dotenv').config();
const app = express();
const db = require("./config/db");
const cors = require("cors");
const globalMiddleware = require("./middlewares/globalErrormiddleware")
app.use(cors())

// Connect to DB
db();

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/todos", require("./routes/todoRoutes"));

app.get("/health", (req, res) => {
    res.send("Hello world ");
});

app.use(globalMiddleware)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`App is listening at port ${PORT}`);
});