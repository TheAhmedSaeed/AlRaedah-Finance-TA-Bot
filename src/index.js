const orders = require("./data.json");
const msgs = require("./messages");
require("dotenv").config({ path: __dirname + "/.env" }); // setting environment variables

const { Telegraf, Markup } = require("telegraf");
const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}
const bot = new Telegraf(token);

bot.command("start", (ctx) => {
  let user = ctx.update.message.from;
  ctx.reply(msgs.createMSgWithName(msgs.welcomeMsg, user.first_name));
});

bot.on("text", (ctx) => {
  let order = orders[ctx.update.message.text];

  if (!order) ctx.reply("There is no order with this tracking number");
  else {
    ctx.telegram.sendMessage(
      ctx.chat.id,
      "Plese choose on of the following options to evaluate",
      {
        reply_markup: {
          inline_keyboard: [
            msgs.evalutaionOptions.map((option) => {
              return {
                text: option.charAt(0).toUpperCase() + option.substring(1),
                callback_data: option,
              };
            }),
          ],
        },
      }
    );
  }
});

// for evaluating
bot.action(msgs.evaluatedElementRegex, (ctx) => {
  const query = ctx.update.callback_query.data;
  console.log(query);
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "How many stars would you rate tracking the shipment ?",
    {
      reply_markup: {
        inline_keyboard: [
          msgs.starsOptions.map((starsOption) => {
            return {
              text: starsOption,
              callback_data: msgs.createEvaluationExpression(
                query,
                starsOption
              ),
            };
          }),
        ],
      },
    }
  );
});

bot.action(msgs.evalutatingRegEx, (ctx) => {
  console.log(ctx.update.callback_query.data);
});

bot.launch();
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
