const express = require("express");
const app = express(); 

const admin = require("firebase-admin");
const db = require("./db");

const { Telegraf, Scenes, Markup, session } = require('telegraf');
const { message } = require('telegraf/filters');
const dotenv = require('dotenv');


// Configuring Express
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

//Creating APIs

//GET request to display our todo list
app.get("/", (req, res) => {
  //Code to fecth data from the database will go here
});



//POST request to create a new task in todo list
app.post("/create", async (req, res) => {
    try {
        console.log(req.body);
        const id = req.body.email; // Assuming the email field contains a unique identifier for each user
        const userJson = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
        };
        await db.collection("users").doc(id).set(userJson);
        res.send("User added successfully!");
    } catch (error) {
        res.send(error);
    }
    
});




//POST request to delete a task in todo list
app.post("/delete", (req, res) => {
  //Code to delete a data from the database will go here
});

// Detect port number from the Node Server or use 5000
const PORT = process.env.PORT || 8080;

// Listen for URIs on a port
app.listen(PORT, () => console.log(`Server started at ${PORT}`));



const vacancyScene = require('./scenes/vacancy')
const resumeScene = require('./scenes/resume')
const advertisementScene = require('./scenes/advertisement')

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([vacancyScene, resumeScene, advertisementScene])
bot.use(session())
bot.use(stage.middleware())

bot.hears('Разместить вакансию', ctx => ctx.scene.enter('vacancyWizard'))
bot.hears('Разместить резюме', ctx => ctx.scene.enter('resumeWizard'))
bot.hears('Заказать рекламу', ctx => ctx.scene.enter('advertisementWizard'))

bot.start(async (ctx) => {
    try {
        await ctx.reply("Хочу разместить", Markup.keyboard([
            ['Разместить вакансию'],
            ['Разместить резюме', 'Заказать рекламу'],
        ]).oneTime().resize())
    } catch (error) {
        console.log(error)
    }

})


bot.launch();