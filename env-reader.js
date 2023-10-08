"use strict";

const fs = require("fs");

const _env = (function () {
    var envPath = "./.env"
    var cache = null;
    /** @type {Object.<string, string>} */
    var proxy = null;

    return {
        get env() {
            if (proxy)
                return proxy;

            if (cache == null) {
                if (!fs.existsSync(envPath)) {
                    envPath += ".template";
                }
                if (fs.existsSync(envPath)) {
                    cache = fs.readFileSync(envPath)
                        .toString()
                        .split(/\r?\n/g)
                        .filter(e => e != null && e.length > 0)
                        .reduce((ret, line) => {
                            let tmp = line.split("=").map(e => e.trim())
                            ret[tmp[0]] = tmp[1];
                            return ret;
                        }, {})
                } else {
                    cache = {};
                }
            }

            proxy = new Proxy(cache, {
                get: function (target, prop) {
                    return target[prop];
                },
                set: function (target, prop, value) {
                    return false;
                }
            });

            return proxy;
        }
    }
})()

module.exports = _env.env;
