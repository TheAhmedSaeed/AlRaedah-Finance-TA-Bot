const orders = require("./data.json");
const msgs = require("./messages");
require("dotenv").config({ path: __dirname + "/.env" }); // setting environment variables
const FileSystem = require("fs");

const { Telegraf, Markup } = require("telegraf");
const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}
const bot = new Telegraf(token);

let activeOrder;
bot.command("start", (ctx) => {
  let user = ctx.update.message.from;
  ctx.reply(msgs.createMSgWithName(msgs.welcomeMsg, user.first_name));
});

bot.on("text", (ctx) => {
  let order = orders[ctx.update.message.text];

  if (!order) ctx.reply("There is no order with this tracking number");
  else {
    activeOrder = order;
    ctx.telegram.sendMessage(
      ctx.chat.id,
      "Plese choose on of the following options to evaluate",
      {
        reply_markup: {
          inline_keyboard: [
            // This shows the options [Tracking, Location ... ] so that the user can evaluate one accordingly
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

bot.action(msgs.evaluatedElementRegex, (ctx) => {
  const query = ctx.update.callback_query.data;
  ctx.deleteMessage();

  ctx.telegram.sendMessage(
    ctx.chat.id,
    "How many stars would you rate the " + query + "?",
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
          [{ text: "Return to previous menu", callback_data: "returnToMenu" }],
        ],
      },
    }
  );
});

bot.action(msgs.evalutatingRegEx, (ctx) => {
  ctx.deleteMessage();

  let splittedMsg = ctx.update.callback_query.data.split(" ");
  const evaluatedElement = splittedMsg[1];
  const numOfStars = splittedMsg[2];

  orders[activeOrder.id]["review"][evaluatedElement]["stars"] = numOfStars;
  console.log(orders[activeOrder.id]);
  FileSystem.writeFile("data.json", JSON.stringify(orders), (error) => {
    if (error) {
      console.log(error);
      throw error;
    } else {
      ctx.reply(
        "Changes have been saved " +
          evaluatedElement +
          " rating is " +
          numOfStars
      );
    }
  });
});

bot.action("returnToMenu", (ctx) => {
  ctx.deleteMessage();
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "Plese choose on of the following options to evaluate",
    {
      reply_markup: {
        inline_keyboard: [
          // This shows the options [Tracking, Location ... ] so that the user can evaluate one accordingly
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
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
