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
        await ctx.replyWithHTML("Ваше имя?");
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const userNameStep = new Composer();
userNameStep.on("text", async (ctx) => {
    try {
        const userId = ctx.from.id;

        ctx.wizard.state.data.userName = ctx.message.text;
        await db.collection("resumes").doc(userId.toString()).set({
            id: userId,
            userName: ctx.message.text,
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
        const message = `Вы ввели следующую информацию:\n\nВаше имя - ${ctx.wizard.state.data.userName}\nКем Вы являетесь? - ${ctx.wizard.state.data.jobTitle}\nУкажите свой стэк - ${ctx.wizard.state.data.stackKit}\nКоротко опишите свои навыки - ${ctx.wizard.state.data.skills}\n\nПожалуйста, подтвердите правильность информации.`;
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
    await ctx.replyWithHTML("Ваше имя?");
    return ctx.wizard.selectStep(1); // Go back to userNameStep
});

confirmationStep.action("infoCorrect", async (ctx) => {
    // User confirmed that the information is correct, save the data to Firestore
    const userId = ctx.from.id;
    await db.collection("resumes").doc(userId.toString()).set({
        id: userId,
        userName: ctx.wizard.state.data.userName,
        jobTitle: ctx.wizard.state.data.jobTitle,
        stackKit: ctx.wizard.state.data.stackKit,
        skills: ctx.wizard.state.data.skills,
    });

    await ctx.reply("Спасибо! Ваше резюме успешно сохранено в базе данных.");

    // Search for matching vacancies after the resume is uploaded and confirmed
    searchForMatches(ctx);

    return ctx.scene.leave();
});

async function searchForMatches(ctx) {
    try {
        const vacanciesRef = db.collection('vacancies');
        const snapshot = await vacanciesRef.where('jobTitle', '==', ctx.wizard.state.data.jobTitle).get();
        if (snapshot.empty) {
            await ctx.reply("No matching documents.");
            return;
        }

        let message = "Найдены следующие соответствующие вакансии:\n\n";
        snapshot.forEach(doc => {
            const docData = doc.data();
            message += `Кого Вы ищете? - ${docData.jobTitle}\nУкажите необходимый стэк - ${docData.stackKit}\nКоротко опишите работу - ${docData.jobDescription}\n\n`;
        });

        await ctx.replyWithHTML(message, Markup.inlineKeyboard([
            Markup.button.callback("Contact the user", "contactUser"),
            Markup.button.callback("Next", "next"),
        ]));
    } catch (error) {
        console.log(error);
    }
}

// Scene order: startStep -> userNameStep -> titleStep -> stackStep -> descriptionStep -> confirmationStep
const resumeScene = new Scenes.WizardScene('resumeWizard', startStep, userNameStep, titleStep, stackStep, descriptionStep, confirmationStep);

module.exports = resumeScene;
