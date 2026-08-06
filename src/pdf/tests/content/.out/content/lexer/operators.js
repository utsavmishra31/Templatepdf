"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATOR_ARITY = void 0;
exports.isOperator = isOperator;
exports.getOperatorArity = getOperatorArity;
exports.OPERATOR_ARITY = {
    // Text state operators
    BT: 0,
    ET: 0,
    Tf: 2,
    Tc: 1,
    Tw: 1,
    Tz: 1,
    TL: 1,
    Tr: 1,
    Ts: 1,
    Tm: 6,
    Td: 2,
    TD: 2,
    "T*": 0,
    // Text showing operators
    Tj: 1,
    TJ: 1,
    "'": 2,
    '"': 3,
    // Graphics state
    q: 0,
    Q: 0,
    // Path operators
    m: 2,
    l: 2,
    c: 6,
    re: 4,
    S: 0,
    f: 0,
    B: 0,
    n: 0,
    // Matrix
    cm: 6,
};
function isOperator(name) {
    return name in exports.OPERATOR_ARITY;
}
function getOperatorArity(name) {
    return exports.OPERATOR_ARITY[name];
}
