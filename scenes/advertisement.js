const { Scenes, Markup, Composer } = require('telegraf');

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

const advertisementScene = new Scenes.WizardScene('advertisementWizard', startStep);

module.exports = advertisementScene;