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

// global variables
let activeOrder;
let isRecieveingPhotoActive = false;

bot.command("start", (ctx) => {
  let user = ctx.update.message.from;
  ctx.reply(msgs.createMSgWithName(msgs.welcomeMsg, user.first_name));
});
bot.command("help", (ctx) => {
  let user = ctx.update.message.from;
  ctx.reply(msgs.createMSgWithName(msgs.welcomeMsg, user.first_name));
});

bot.on("text", (ctx) => {
  let order = orders[ctx.update.message.text];

  if (!order)
    ctx.reply(
      "There is no order with this tracking number. Please enter a valid tracking number"
    );
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
          query == "status"
            ? [
                {
                  text: "Send a photo of the product status",
                  callback_data: "recievePhoto",
                },
              ]
            : query == "location"
            ? [
                {
                  text: "Send a location",
                  callback_data: "returnToMenu",
                },
              ]
            : [],
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

  FileSystem.writeFile("data.json", JSON.stringify(orders), (error) => {
    if (error) {
      ctx.telegram.reply(ctx.chat.id, "Sorry something went wrong");
      console.log(error);
      throw error;
    } else {
      ctx.telegram.sendMessage(
        ctx.chat.id,
        "Thanks for your response new " +
          evaluatedElement +
          " rating is " +
          numOfStars +
          "\n" +
          "Plese choose abother one if you like",
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
});

bot.action("returnToMenu", (ctx) => {
  ctx.deleteMessage();
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "Plese choose one of the following options to evaluate",
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

bot.action("recievePhoto", (ctx) => {
  ctx.deleteMessage();
  isRecieveingPhotoActive = true;
  ctx.reply("I am waiting for your photo 🤖 ...");
});

bot.on("photo", (ctx) => {
  ctx.deleteMessage();

  if (!isRecieveingPhotoActive)
    ctx.reply(`If you want to send a photo of the product\n  
  Please do the following\n
  1. Send the tracking number\n
  2. Choose Status\n
  3. Click on Send a photo\n
  `);
  else {
    let photoId = ctx.update.message.photo[0].file_id;
    orders[activeOrder.id]["photoId"] = photoId;
    FileSystem.writeFile("data.json", JSON.stringify(orders), (error) => {
      if (error) {
        ctx.telegram.reply(ctx.chat.id, "Sorry something went wrong");
        throw error;
      } else {
        ctx.telegram.sendPhoto(ctx.chat.id, photoId);
        ctx.reply(
          "Your photo has been recieed\n Actions will be taken if anything was wrong"
        );
      }
    });

    isRecieveingPhotoActive = false;
  }
});

bot.on("location", (ctx) => {
  console.log(ctx);
});
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
