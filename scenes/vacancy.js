const { Scenes, Composer, Markup, Extra } = require('telegraf');
const db = require("../db");



const startStep = new Composer();
startStep.on("text", async (ctx) => {
    try {
        const userId = ctx.from.id;

        ctx.wizard.state.data = {};
        await db.collection("vacancies").doc(userId.toString()).set({
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
        const userId = ctx.from.id; // Define userId here

        ctx.wizard.state.data.userName = ctx.message.text;
        await db.collection("vacancies").doc(userId.toString()).set({
            id: userId,
            userName: ctx.message.text, // Save the user's name in Firestore
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
        await ctx.replyWithHTML("Укажите необходимый стэк (через запятую если больше 1).\n<i>Например, Sketch, Penpot, Adobe Figma</i>");
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
    try {
        ctx.wizard.state.data.jobDescription = ctx.message.text; // Save the job description to ctx.wizard.state.data

        // Show the user the information they provided
        const message = `Вы ввели следующую информацию:\n\n\nВаше имя - ${ctx.wizard.state.data.userName}\nКого Вы ищете? - ${ctx.wizard.state.data.jobTitle}\nУкажите необходимый стэк - ${ctx.wizard.state.data.stackKit}\nКоротко опишите работу - ${ctx.wizard.state.data.jobDescription}\n\nПожалуйста, подтвердите правильность информации.`;
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
        userName: ctx.wizard.state.data.userName,
        jobTitle: ctx.wizard.state.data.jobTitle,
        stackKit: ctx.wizard.state.data.stackKit,
        jobDescription: ctx.wizard.state.data.jobDescription,
    });

    await ctx.reply("Спасибо! Вакансия успешно сохранена в базе данных.");

    // Search for matching resumes after the vacancy is uploaded and confirmed
    searchForMatches(ctx);

    return ctx.scene.leave();
});

// async function searchForMatches(ctx) {
//     try {
//         const resumesRef = db.collection('resumes');
//         const snapshot = await resumesRef.where('jobTitle', '==', ctx.wizard.state.data.jobTitle).get();
//         if (snapshot.empty) {
//             await ctx.reply("No matching documents.");
//             return;
//         }

//         let message = "Найдены следующие соответствующие резюме:\n\n";
//         snapshot.forEach(doc => {
//             const docData = doc.data();
//             message += `Имя: ${docData.userName}\nАйТи специализация: ${docData.jobTitle}\nСтэк: ${docData.stackKit}\n\n`;
//         });

//         await ctx.replyWithHTML(message, Markup.inlineKeyboard([
//             Markup.button.callback("Contact the user", "contactUser"),
//             Markup.button.callback("Next", "next"),
//         ]));
//     } catch (error) {
//         console.log(error);
//     }
// }

async function searchForMatches(ctx) {
    try {
        const resumesRef = db.collection('resumes');
        const snapshot = await resumesRef.where('jobTitle', '==', ctx.wizard.state.data.jobTitle).get();
        if (snapshot.empty) {
            await ctx.reply("No matching documents.");
            return;
        }

        const matchingUsers = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            matchingUsers.push({
                userName: docData.userName,
                jobTitle: docData.jobTitle,
                stackKit: docData.stackKit,
            });
        });

        if (matchingUsers.length === 0) {
            await ctx.reply("No matching documents.");
            return;
        }

        // Store the matching users in the session
        ctx.session.matchingUsers = matchingUsers;
        // Send the first user's information
        sendMatchingUser(ctx, 0);

    } catch (error) {
        console.log(error);
    }
}

async function sendMatchingUser(ctx, index) {
    const matchingUsers = ctx.session.matchingUsers;
    if (index >= matchingUsers.length) {
        await ctx.reply("No more matching users.");
        return;
    }

    const user = matchingUsers[index];
    const message = `Имя: ${user.userName}\nАйТи специализация: ${user.jobTitle}\nСтэк: ${user.stackKit}\n\n`;

    await ctx.replyWithHTML(message, Markup.inlineKeyboard([
        Markup.button.callback("Contact the user", `contactUser:${index}`),
        Markup.button.callback("Next", `next:${index}`),
    ]));
}

// Scene order: startStep -> titleStep -> stackStep -> descriptionStep -> confirmationStep
const vacancyScene = new Scenes.WizardScene('vacancyWizard', startStep, userNameStep, titleStep, stackStep, descriptionStep, confirmationStep);

// Move the "contactUser" and "next" button actions outside the scene definition
vacancyScene.on("callback_query", async (ctx) => {
    const action = ctx.update.callback_query.data;
    const actionType = action.split(":")[0];
    const index = parseInt(action.split(":")[1]);

    switch (actionType) {
        case "contactUser":
            await handleContactUser(ctx, index);
            break;
        case "next":
            await handleNextUser(ctx, index);
            break;
        default:
            break;
    }
});

async function handleContactUser(ctx, index) {
    await ctx.answerCbQuery("Contact the user");

    const matchingUsers = ctx.session.matchingUsers;
    if (index >= matchingUsers.length) {
        await ctx.reply("Invalid index.");
        return;
    }

    const user = matchingUsers[index];
    const userId = user.userId; // Replace "userId" with the actual field name in your Firestore database

    const message = "Hello! You have been matched with a job vacancy. Please contact us for further details.";
    await ctx.telegram.sendMessage(userId, message, Extra.HTML());

    // Perform any additional logic you need after contacting the user
    // For example, you might want to mark the vacancy as "contacted" in the database

    return ctx.scene.leave();
}

async function handleNextUser(ctx, index) {
    await ctx.answerCbQuery("Next");
    ctx.session.currentIndex = index + 1;
    sendMatchingUser(ctx, index + 1);
}

module.exports = vacancyScene;

