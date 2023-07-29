const { Scenes, Markup, Composer } = require('telegraf');
const db = require("../db");
const startStep = new Composer();
startStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data = {};
        ctx.wizard.state.data.userName = ctx.message.from.username
        ctx.wizard.state.data.firstName = ctx.message.from.first_name
        ctx.wizard.state.data.lastName = ctx.message.from.last_name
        await ctx.replyWithHTML("Кого Вы ищете?\n<i>Например, веб дизайнер</i>")
        return ctx.wizard.next()
    } catch (error) {
        console.log(error)
    }
})

// const titleStep = new Composer();
// titleStep.on("text", async (ctx) => {
//     try {
//         ctx.wizard.state.data.title = ctx.message.text
//         await ctx.replyWithHTML("Укажите необходимый стэк (через запятую если больше 1)?\n<i>Например, Sketch, Penpot, Adobe Figma</i>")
//         return ctx.wizard.next()
//     } catch (error) {
//         console.log(error)
//     }
// });


const titleStep = new Composer();
titleStep.on("text", async (ctx) => {
    try {
        const userId = ctx.from.id; // Assuming Telegram-generated user ID is used as the identifier
        const jobTitle = ctx.message.text; // Job title entered by the user
        
        // Save the vacancy information to the Firestore database
        await db.collection("vacancies").doc(userId.toString()).set({
            id: userId,
            jobTitle: jobTitle,
        });

        await ctx.replyWithHTML("Укажите необходимый стэк (через запятую если больше 1)?\n<i>Например, Sketch, Penpot, Adobe Figma</i>");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const vacancyScene = new Scenes.WizardScene('vacancyWizard', startStep, titleStep);

module.exports = vacancyScene;