"use strict";

const fs = require("fs");
const path = require("path");

class LocalDatabase {
    _data;

    constructor(path) {
        /** @protected */
        this._path = path;
        if (fs.existsSync(path)) {
            try {
                let text = fs.readFileSync(path).toString();
                if (text.length >= 2)
                    this._data = JSON.parse(text);
            } catch (e) {

            }
        }
        if (this._data == null)
            this._data = {};
    }

    /**
     * @param {string} key 
     * @returns
     */
    get(key) {
        return this._data[key];
    }

    /**
     * @param {string} key 
     * @param {*} value 
     * @returns 
     */
    set(key, value) {
        let old = this.get(key);
        if (old === value)
            return false;

        this._data[key] = value;
        this.save();
        return true;
    }

    save() {
        this._timeout && clearTimeout(this._timeout);

        /** @protected */
        this._timeout = setTimeout(() => this._save(), 200)
    }

    /** @protected */
    _save() {
        let dir = path.dirname(this._path);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        return fs.writeFileSync(this._path, JSON.stringify(this._data));
    }
}

/** @type {Object.<string, LocalDatabase>} */
var map = {};

/**
 * @param {String} path 
 */
module.exports = function (path) {
    if (!map[path])
        map[path] = new LocalDatabase(path);

    return map[path];
}
