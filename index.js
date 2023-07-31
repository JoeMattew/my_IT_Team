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
        await ctx.reply("Добро пожаловать в бот, выберите действие", Markup.keyboard([
            ['Разместить вакансию'],
            ['Разместить резюме', 'Заказать рекламу'],
        ]).oneTime().resize())
    } catch (error) {
        console.log(error)
    }

})


bot.launch();