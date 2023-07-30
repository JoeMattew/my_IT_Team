const { Scenes, Markup, Composer } = require('telegraf');

const startStep = new Composer();
startStep.on("text", async (ctx) => {
    try {
            // Create a message with the user information
        const message = `По вопросам размещения рекламы в боте`;

        // Create an inline keyboard with the button to open the chat
        const inlineKeyboard = Markup.inlineKeyboard([
            Markup.button.url('Написать сообщение', 'https://t.me/makarkarim')
        ]);

        // Send the message with the inline keyboard
        await ctx.replyWithHTML(message, inlineKeyboard);

        // Proceed to the next step
        return ctx.wizard.next();
    } catch (error) {
        console.log(error);
    }
});

const advertisementScene = new Scenes.WizardScene('advertisementWizard', startStep);

module.exports = advertisementScene;
