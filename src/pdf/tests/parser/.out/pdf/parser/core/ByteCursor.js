"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteCursor = void 0;
class ByteCursor {
    bytes;
    text;
    constructor(bytes) {
        this.bytes = bytes;
        this.text = Buffer.from(bytes).toString("latin1");
    }
    length() {
        return this.bytes.length;
    }
    slice(start, end) {
        return this.bytes.slice(start, end);
    }
    textSlice(start, end) {
        return this.text.slice(start, end);
    }
    toText() {
        return this.text;
    }
    lastIndexOf(needle, from) {
        if (typeof from === "number") {
            return this.text.lastIndexOf(needle, from);
        }
        return this.text.lastIndexOf(needle);
    }
    indexOf(needle, from = 0) {
        return this.text.indexOf(needle, from);
    }
}
exports.ByteCursor = ByteCursor;
