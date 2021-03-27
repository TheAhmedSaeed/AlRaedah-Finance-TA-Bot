require("dotenv").config({ path: __dirname + "/.env" });

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN); // get the token from envirenment variable
bot.start((ctx) => ctx.reply("Welcome"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.launch();
