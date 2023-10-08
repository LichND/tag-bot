"use strict";

const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const env = require("./env-reader");
const database = require("./local-database")(env.DATABASE);

/** @enum */
const TAG_LIST = {
    everyone: "everyone",
    server: "server",
    client: "client",
}

/**
 * add "@" to start of text if needed
 * @param {string} [text]
 */
function addAtSymboll(text) {
    if (text == null || text.length == 0)
        return "";
    return text.startsWith("@") ? text : "@" + text;
}

class TaggerBot {
    /**
     * @param {string} token
     */
    async start(token) {
        if (token == null || token.length == 0)
            return Promise.reject("Token invalid");

        this.instance = new Telegraf(token);
        // this.instance.start(ctx => console.log("bot start!"));

        this.instance.on(message("text"), (ctx) => {
            if (ctx.message.chat.type !== "group")
                return;
            let group = ctx.message.chat.id;
            this.addUsersToMentionList(group, TAG_LIST.everyone, [ctx.message.from.username])

            let raw = ctx.message.text;
            if (!raw.startsWith("/"))
                return;

            let param = raw.split(" ").filter(e => e.length > 0);
            let command = (() => {
                let tagIndex = param[0].indexOf("@");
                return param[0].substring(1, tagIndex >= 0 ? tagIndex : undefined);
            })();
            if (param[1] === "add") {
                let users = ctx.message.entities?.filter(e => e.type === "mention").map(e => raw.substring(e.offset, e.offset + e.length));
                command !== TAG_LIST.everyone && this.addUsersToMentionList(group, command, users);
                this.addUsersToMentionList(group, TAG_LIST.everyone, users);
            } else if (param[1] === "remove") {
                let users = ctx.message.entities?.filter(e => e.type === "mention").map(e => raw.substring(e.offset, e.offset + e.length));
                command !== TAG_LIST.everyone && this.removeUserFromMentionList(group, command, users);
                this.addUsersToMentionList(group, TAG_LIST.everyone, users);
            } else {
                let reply = this.createPing(group, command, [ctx.message.from.username]);
                reply.length > 0 && ctx.reply(reply);
            }
        });
        this.instance.on(message("new_chat_members"), (ctx) => {
            if (ctx.message.chat.type !== "group")
                return;
            this.addUsersToMentionList(ctx.message.chat.id, TAG_LIST.everyone, ctx.message.new_chat_members.map(e => e.username))
        });

        return this.instance.launch();
    }

    createPing(group, role, ignore) {
        let _group = database.get(group);
        if (!_group)
            return "";
        let _role = _group[role];
        if (!_role)
            return "";

        let list = Object.keys(_role);
        if (list.length == 0)
            return "";

        let _ignore = ignore ? ignore.map(e => addAtSymboll(e)).reduce((ret, e) => { ret[e] = true; return ret; }, {}) : {};

        return list.filter(e => !_ignore.hasOwnProperty(e)).join(" ");
    }

    addUsersToMentionList(group, role, users) {
        let change = false;
        let _group = database.get(group);
        if (!_group) {
            _group = {};
            change = true;
        }
        let _role = _group[role];
        if (_role == null) {
            _role = {};
            _group[role] = _role;
            change = true;
        }
        for (let len = users?.length || 0, i = 0; i < len; i++) {
            let user = addAtSymboll(users[i]);
            if (user == null || user.length == 0)
                continue;
            if (_role.hasOwnProperty(user))
                continue;
            _role[user] = true;
            change = true;
        }
        if (change) {
            database.set(group, _group);
            database.save();
        }
    }
    removeUserFromMentionList(group, role, users) {
        let change = false;
        let _group = database.get(group);
        if (!_group)
            return;

        let _role = _group[role];
        if (_role == null)
            return;

        for (let len = users?.length || 0, i = 0; i < len; i++) {
            let user = addAtSymboll(users[i]);
            if (user == null || user.length == 0)
                continue;
            if (!_role.hasOwnProperty(user))
                continue;
            delete _role[user];
            change = true;
        }
        if (change) {
            database.set(group, _group);
            database.save();
        }
    }
}

module.exports = TaggerBot;
