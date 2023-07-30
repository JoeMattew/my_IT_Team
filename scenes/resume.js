// const { Scenes, Composer } = require('telegraf');
// const db = require("../db");

// const startStep = new Composer();
// startStep.on("text", async (ctx) => {
//     try {
//         const userId = ctx.from.id;
        
//         ctx.wizard.state.data = {}; 
//         await db.collection("resumes").doc(userId.toString()).set({
//             id: userId,
//         });
//         await ctx.replyWithHTML("Кем Вы являетесь?\n<i>Например, веб дизайнер</i>");
//         return ctx.wizard.next();
//     } catch (error) {
//         console.log(error);
//     }
// });

// const titleStep = new Composer();
// titleStep.on("text", async (ctx) => {
//     try {
//         ctx.wizard.state.data.jobTitle = ctx.message.text; // Save the job title to ctx.wizard.state.data
//         await ctx.replyWithHTML("Укажите свой стэк (через запятую, если больше 1).\n<i>Например, HTML, CSS, JavaScript</i>");
//         return ctx.wizard.next();
//     } catch (error) {
//         console.log(error);
//     }
// });

// const stackStep = new Composer();
// stackStep.on("text", async (ctx) => {
//     try {
//         ctx.wizard.state.data.stackKit = ctx.message.text; // Save the stack information to ctx.wizard.state.data
//         await ctx.reply("Коротко опишите свои навыки");
//         return ctx.wizard.next();
//     } catch (error) {
//         console.log(error);
//     }
// });

// const descriptionStep = new Composer();
// descriptionStep.on("text", async (ctx) => {
//     try {
//         ctx.wizard.state.data.skills = ctx.message.text; // Save the skills information to ctx.wizard.state.data

//         // Save the complete information to Firestore
//         const userId = ctx.from.id;
//         await db.collection("resumes").doc(userId.toString()).set({
//             id: userId,
//             jobTitle: ctx.wizard.state.data.jobTitle,
//             stackKit: ctx.wizard.state.data.stackKit,
//             skills: ctx.wizard.state.data.skills,
//         });

//         await ctx.reply("Спасибо! Ваше резюме успешно сохранено в базе данных.");
//         return ctx.scene.leave();
//     } catch (error) {
//         console.log(error);
//     }
// });

// const resumeScene = new Scenes.WizardScene('resumeWizard', startStep, titleStep, stackStep, descriptionStep);

// module.exports = resumeScene;


const { Scenes, Composer, Markup } = require('telegraf');
const db = require("../db");

const startStep = new Composer();
startStep.on("text", async (ctx) => {
    try {
        const userId = ctx.from.id;
        
        ctx.wizard.state.data = {}; 
        await db.collection("resumes").doc(userId.toString()).set({
            id: userId,
        });
        await ctx.replyWithHTML("Кем Вы являетесь?\n<i>Например, веб дизайнер</i>");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const titleStep = new Composer();
titleStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.jobTitle = ctx.message.text; // Save the job title to ctx.wizard.state.data
        await ctx.replyWithHTML("Укажите свой стэк (через запятую, если больше 1).\n<i>Например, HTML, CSS, JavaScript</i>");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const stackStep = new Composer();
stackStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.stackKit = ctx.message.text; // Save the stack information to ctx.wizard.state.data
        await ctx.reply("Коротко опишите свои навыки");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const descriptionStep = new Composer();
descriptionStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.skills = ctx.message.text; // Save the skills information to ctx.wizard.state.data

        // Show the user the information they provided
        const message = `Вы ввели следующую информацию:\n\nКем Вы являетесь? - ${ctx.wizard.state.data.jobTitle}\nУкажите свой стэк - ${ctx.wizard.state.data.stackKit}\nКоротко опишите свои навыки - ${ctx.wizard.state.data.skills}\n\nПожалуйста, подтвердите правильность информации.`;
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
    await ctx.replyWithHTML("Кем Вы являетесь?\n<i>Например, веб дизайнер</i>");
    return ctx.wizard.selectStep(1); // Go back to the titleStep
});

confirmationStep.action("infoCorrect", async (ctx) => {
    // User confirmed that the information is correct, save the data to Firestore
    const userId = ctx.from.id;
    await db.collection("resumes").doc(userId.toString()).set({
        id: userId,
        jobTitle: ctx.wizard.state.data.jobTitle,
        stackKit: ctx.wizard.state.data.stackKit,
        skills: ctx.wizard.state.data.skills,
    });

    await ctx.reply("Спасибо! Ваше резюме успешно сохранено в базе данных.");
    return ctx.scene.leave();
});

// Scene order: startStep -> titleStep -> stackStep -> descriptionStep -> confirmationStep
const resumeScene = new Scenes.WizardScene('resumeWizard', startStep, titleStep, stackStep, descriptionStep, confirmationStep);

module.exports = resumeScene;
