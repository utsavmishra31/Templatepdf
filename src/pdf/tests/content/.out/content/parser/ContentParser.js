"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentParser = void 0;
const operators_1 = require("../lexer/operators");
const ParserState_1 = require("./ParserState");
class ContentParser {
    tokens;
    pos = 0;
    operators = [];
    state;
    constructor(tokens) {
        this.tokens = tokens;
        this.state = {
            graphicsStateStack: [],
            currentGraphicsState: JSON.parse(JSON.stringify(ParserState_1.DEFAULT_GRAPHICS_STATE)),
            textState: null,
            inTextObject: false,
            operandStack: [],
            errors: [],
        };
    }
    parse() {
        this.operators = [];
        this.pos = 0;
        this.state.operandStack = [];
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === "eof") {
                break;
            }
            if (token.type === "operator") {
                this.handleOperator(token);
                this.pos += 1;
            }
            else if (token.type === "array-open") {
                const arrayValue = this.readArrayFromCurrent();
                this.state.operandStack.push(arrayValue);
            }
            else {
                this.state.operandStack.push(this.tokenToValue(token));
                this.pos += 1;
            }
        }
        if (this.state.operandStack.length > 0) {
            this.state.errors.push({
                message: `${this.state.operandStack.length} leftover operands at end of content stream`,
                offset: this.tokens[this.pos - 1]?.offset || 0,
                recoverable: true,
            });
        }
        return {
            operators: this.operators,
            errors: this.state.errors,
        };
    }
    readArrayFromCurrent() {
        const array = [];
        if (this.tokens[this.pos].type !== "array-open") {
            return array;
        }
        this.pos += 1;
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type === "array-close") {
                this.pos += 1;
                break;
            }
            if (token.type === "array-open") {
                array.push(...this.readArrayFromCurrent());
            }
            else if (token.type !== "operator" && token.type !== "eof") {
                const val = this.tokenToValue(token);
                array.push(val);
                this.pos += 1;
            }
            else {
                this.pos += 1;
            }
        }
        return array;
    }
    tokenToValue(token) {
        switch (token.type) {
            case "number":
                return token.value;
            case "name":
                return token.value;
            case "string":
                return token.value;
            case "hex-string":
                return this.hexStringToValue(token.value);
            default:
                return "";
        }
    }
    hexStringToValue(hexStr) {
        const result = [];
        for (let i = 0; i < hexStr.length; i += 2) {
            const pair = hexStr.slice(i, i + 2).padEnd(2, "0");
            result.push(Number.parseInt(pair, 16));
        }
        return result;
    }
    handleOperator(token) {
        const opName = token.value;
        const arity = (0, operators_1.getOperatorArity)(opName);
        if (arity === undefined) {
            this.state.errors.push({
                message: `Unknown operator: ${opName}`,
                offset: token.offset,
                recoverable: true,
            });
            return;
        }
        if (this.state.operandStack.length < arity) {
            this.state.errors.push({
                message: `Operator ${opName} requires ${arity} operands, got ${this.state.operandStack.length}`,
                offset: token.offset,
                recoverable: true,
            });
            this.state.operandStack = [];
            return;
        }
        const operands = this.state.operandStack.splice(-arity);
        const operator = {
            type: opName,
            operands: operands,
            offset: token.offset,
        };
        this.operators.push(operator);
        this.updateState(opName, operands);
    }
    updateState(opName, operands) {
        switch (opName) {
            case "BT":
                this.state.inTextObject = true;
                this.state.textState = JSON.parse(JSON.stringify(ParserState_1.DEFAULT_TEXT_STATE));
                break;
            case "ET":
                this.state.inTextObject = false;
                break;
            case "q":
                this.state.graphicsStateStack.push(JSON.parse(JSON.stringify(this.state.currentGraphicsState)));
                if (this.state.graphicsStateStack.length > 128) {
                    this.state.errors.push({
                        message: "Graphics state stack depth exceeded (max 128)",
                        offset: 0,
                        recoverable: false,
                    });
                }
                break;
            case "Q":
                if (this.state.graphicsStateStack.length > 0) {
                    this.state.currentGraphicsState = this.state.graphicsStateStack.pop();
                }
                break;
            case "Tf":
                if (this.state.textState && typeof operands[0] === "string" && typeof operands[1] === "number") {
                    this.state.textState.fontName = operands[0];
                    this.state.textState.fontSize = operands[1];
                }
                break;
            case "Tm":
                if (this.state.textState && operands.length === 6) {
                    this.state.textState.textMatrix = operands;
                    this.state.textState.lineMatrix = operands;
                }
                break;
            case "Td":
                if (this.state.textState && operands.length === 2) {
                    const [tx, ty] = operands;
                    const m = this.state.textState.lineMatrix;
                    this.state.textState.lineMatrix = [m[0], m[1], m[2], m[3], m[4] + tx, m[5] + ty];
                    this.state.textState.textMatrix = this.state.textState.lineMatrix;
                }
                break;
            case "TL":
                if (this.state.textState && typeof operands[0] === "number") {
                    this.state.textState.leading = operands[0];
                }
                break;
            case "Tc":
                if (this.state.textState && typeof operands[0] === "number") {
                    this.state.textState.charSpacing = operands[0];
                }
                break;
            case "Tw":
                if (this.state.textState && typeof operands[0] === "number") {
                    this.state.textState.wordSpacing = operands[0];
                }
                break;
            case "Tz":
                if (this.state.textState && typeof operands[0] === "number") {
                    this.state.textState.horizontalScale = operands[0];
                }
                break;
            case "Tr":
                if (this.state.textState && typeof operands[0] === "number") {
                    this.state.textState.renderingMode = operands[0];
                }
                break;
            case "Ts":
                if (this.state.textState && typeof operands[0] === "number") {
                    this.state.textState.rise = operands[0];
                }
                break;
            case "cm":
                if (operands.length === 6) {
                    const m = this.state.currentGraphicsState.ctm;
                    const [a, b, c, d, e, f] = operands;
                    this.state.currentGraphicsState.ctm = [
                        a * m[0] + c * m[1],
                        b * m[0] + d * m[1],
                        a * m[2] + c * m[3],
                        b * m[2] + d * m[3],
                        a * m[4] + c * m[5] + e,
                        b * m[4] + d * m[5] + f,
                    ];
                }
                break;
        }
    }
}
exports.ContentParser = ContentParser;
