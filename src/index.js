const orders = require("./data.json");
const msgs = require("./messages");
require("dotenv").config({ path: __dirname + "/.env" }); // setting environment variables
const FileSystem = require("fs");

// was used for decorizing and safety. Todo later
const { Telegraf, Markup } = require("telegraf");
const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}
const bot = new Telegraf("1627697270:AAE7dCRggdjPdJSv8Ekz1DgpdDzH6HV5mOk");

// global variables
let activeOrder;
let isRecieveingPhotoActive = false;
let isRecieveingLocationctive = false;

bot.command("start", (ctx) => {
  ctx.deleteMessage();
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

  shownStatusOptions =
    activeOrder["photoId"] != ""
      ? [
          {
            text: "Send a photo",
            callback_data: "recievePhoto",
          },
          {
            text: "View last sent photo",
            callback_data: "viewPhoto",
          },
        ]
      : [
          {
            text: "Send a photo",
            callback_data: "recievePhoto",
          },
        ];

  shownLocationOptions = activeOrder["location"]["lat"]
    ? [
        {
          text: "Send a location",
          callback_data: "recLoc",
        },
        {
          text: "View last location",
          callback_data: "viewLoc",
        },
      ]
    : [];

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
            ? shownStatusOptions
            : query == "location"
            ? shownLocationOptions
            : [],
          [
            {
              text: "Return to previous menu",
              callback_data: "returnToMenu",
            },
          ],
        ],
      },
    }
  );
});

bot.action("viewPhoto", (ctx) => {
  ctx.deleteMessage();
  ctx.telegram.sendPhoto(ctx.chat.id, activeOrder["photoId"]);
});

bot.action("viewLoc", (ctx) => {
  ctx.deleteMessage();
  ctx.telegram.sendLocation(
    ctx.chat.id,
    activeOrder["location"]["lat"],
    activeOrder["location"]["lang"]
  );
});

bot.action("recievePhoto", (ctx) => {
  console.log(activeOrder["photoId"] != "");
  ctx.deleteMessage();
  isRecieveingPhotoActive = true;
  ctx.reply("I am waiting for your photo ???? ...");
});

bot.on("photo", (ctx) => {
  ctx.deleteMessage();

  if (!isRecieveingPhotoActive)
    ctx.reply(`
  If you want to send a photo of the product\n  
  Please do the following\n
  1. Send the tracking number\n
  2. Choose Status\n
  3. Click on Send a photo\n
  `);
  else {
    let photoId = ctx.update.message.photo[0].file_id;
    orders[activeOrder.id]["photoId"] = photoId;
    activeOrder = orders[activeOrder.id];
    FileSystem.writeFile("data.json", JSON.stringify(orders), (error) => {
      if (error) {
        ctx.telegram.reply(ctx.chat.id, "Sorry something went wrong");
        throw error;
      } else {
        ctx.reply(
          "Your photo has been recieed\n Actions will be taken if anything was wrong"
        );
      }
    });

    isRecieveingPhotoActive = false;
  }
});

bot.action("recLoc", (ctx) => {
  isRecieveingLocationctive = true;
  ctx.reply("I am waiting for your location ???? ...");
});

bot.on("location", (ctx) => {
  if (!isRecieveingLocationctive)
    ctx.reply(`
  If you want to send a location \n  
  Please do the following\n
  1. Send the tracking number\n
  2. Choose Location\n
  3. Click on Send a location\n
  `);
  else {
    const location = ctx.update.message.location;
    orders[activeOrder.id]["location"] = location;
    activeOrder = orders[activeOrder.id];

    FileSystem.writeFile("data.json", JSON.stringify(orders), (error) => {
      if (error) {
        ctx.telegram.reply(ctx.chat.id, "Sorry something went wrong");
        throw error;
      } else {
        ctx.reply(
          "Your location has been recieed\n Actions will be taken if anything was wrong"
        );
      }
    });
  }
});

bot.action(msgs.evalutatingRegEx, (ctx) => {
  ctx.deleteMessage();

  let splittedMsg = ctx.update.callback_query.data.split(" ");
  const evaluatedElement = splittedMsg[1];
  const numOfStars = splittedMsg[2];

  orders[activeOrder.id]["review"][evaluatedElement]["stars"] = numOfStars;
  activeOrder = orders[activeOrder.id];

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

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
