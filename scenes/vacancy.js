const { Scenes, Composer, Telegraf, Markup, session } = require('telegraf');
const db = require("../db");

const startStep = new Composer();
startStep.on("text", async (ctx) => {
    try {
        const userId = ctx.from.id;

        ctx.wizard.state.data = {};
        await db.collection("vacancies").doc(userId.toString()).set({
            id: userId,
        });
        await ctx.replyWithHTML("Кого Вы ищете?\n<i>Например, веб дизайнер</i>");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const titleStep = new Composer();
titleStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.jobTitle = ctx.message.text; // Save the job title to ctx.wizard.state.data
        await ctx.replyWithHTML("Укажите необходимый стэк (через запятую если больше 1)?\n<i>Например, Sketch, Penpot, Adobe Figma</i>");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const stackStep = new Composer();
stackStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.stackKit = ctx.message.text; // Save the stack information to ctx.wizard.state.data
        await ctx.reply("Коротко опишите работу");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const descriptionStep = new Composer();
descriptionStep.on("text", async (ctx) => {

    ctx.wizard.state.data.jobDescription = ctx.message.text; // Save the job description to ctx.wizard.state.data


    try {
        const userId = ctx.from.id;
        const jobTitle = ctx.wizard.state.data.jobTitle;
        const stackKit = ctx.wizard.state.data.stackKit;
        const jobDescription = ctx.wizard.state.data.jobDescription;

        // Show the user the information they provided
        const message = `Вы ввели следующую информацию:\n\nКого Вы ищете? - ${jobTitle}\nУкажите необходимый стэк - ${stackKit}\nКоротко опишите работу - ${jobDescription}\n\nПожалуйста, подтвердите правильность информации.`;
        await ctx.replyWithHTML(message, Markup.inlineKeyboard([
            Markup.button.callback("Изменить информацию", "changeInfo"),
            Markup.button.callback("Информация верна", "infoCorrect"),
        ]));

        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});



const confirmationStep = new Composer();
confirmationStep.action("changeInfo", async (ctx) => {
    // User chose to change the information, restart the wizard from the beginning
    await ctx.replyWithHTML("Кого Вы ищете?\n<i>Например, веб дизайнер</i>");
    return ctx.wizard.selectStep(1); // Go back to the titleStep
});

confirmationStep.action("infoCorrect", async (ctx) => {
    // User confirmed that the information is correct, save the data to Firestore
    const userId = ctx.from.id;
    await db.collection("vacancies").doc(userId.toString()).set({
        id: userId,
        jobTitle: ctx.wizard.state.data.jobTitle,
        stackKit: ctx.wizard.state.data.stackKit,
        jobDescription: ctx.wizard.state.data.jobDescription,
    });

    await ctx.reply("Спасибо! Вакансия успешно сохранена в базе данных.");
    return ctx.scene.leave();
});

// Scene order: startStep -> titleStep -> stackStep -> descriptionStep -> confirmStep -> confirmationStep
const vacancyScene = new Scenes.WizardScene('vacancyWizard', startStep, titleStep, stackStep, descriptionStep, confirmationStep);

module.exports = vacancyScene;
