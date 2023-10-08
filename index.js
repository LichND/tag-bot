"use strict";

const env = require("./env-reader");

const bot = new (require("./tagger-bot"))();

bot.start(env.TOKEN, env.DATABASE)
    .then(e => console.log("Bot start!"))
    .catch(err => console.log(err))
