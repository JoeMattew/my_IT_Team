const { Scenes, Markup, Composer } = require('telegraf');

const startStep = new Composer();
startStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data = {};
        ctx.wizard.state.data.userName = ctx.message.from.username
        ctx.wizard.state.data.firstName = ctx.message.from.first_name
        ctx.wizard.state.data.lastName = ctx.message.from.last_name
        await ctx.replyWithHTML("Kogo vi ishete?\n<i>Naprimer, react specialist</i>")
        return ctx.wizard.next()
    } catch (error) {
        console.log(error)
    }
})

const titleStep = new Composer();
titleStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.title = ctx.message.text
        await ctx.replyWithHTML("Ukazhite konkretnuyu deyatelnost?\n<i>Naprimer, razrabotka react moduley</i>")
        return ctx.wizard.next()
    } catch (error) {
        console.log(error)
    }
})

const vacancyScene = new Scenes.WizardScene('vacancyWizard', startStep, titleStep);

module.exports = vacancyScene;