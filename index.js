const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = mongoose.Schema({
    username: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = mongoose.Schema({
    userId: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/api/users", async (_, res) => {
    const users = await User.find();

    res.json(users.map(({ username, _id }) => ({ username, _id })));
});

app.post("/api/users", async (req, res) => {
    const user = await User.create({ username: req.body.username });

    res.json({ username: user.username, _id: user._id });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
    const user = await User.findById(req.params._id);

    if (!user) return res.sendStatus(400);

    const exercise = new Exercise({
        userId: user._id,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? new Date(req.body.date) : new Date(),
    });

    await exercise.save();

    res.json({
        username: user.username,
        _id: user._id,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
    const user = await User.findById(req.params._id);

    if (!user) return res.sendStatus(400);

    const from = req.query.from ?? new Date(0);
    const to = req.query.to ?? new Date(999999999999999);
    const limit = parseInt(req.query.limit) ?? 0;

    const exercises = await Exercise.find({
        userId: user._id,
        date: { $gt: from, $lt: to },
    }).limit(limit);

    res.json({
        username: user.username,
        _id: user._id,
        count: exercises.length,
        log: exercises.map(({ description, duration, date }) => ({
            description,
            duration,
            date: date.toDateString(),
        })),
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
