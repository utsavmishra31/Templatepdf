"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TEXT_STATE = exports.DEFAULT_GRAPHICS_STATE = void 0;
exports.DEFAULT_GRAPHICS_STATE = {
    ctm: [1, 0, 0, 1, 0, 0],
    lineWidth: 1,
    lineJoin: 0,
    lineCap: 0,
    dashPattern: [],
    strokeColor: [0],
    fillColor: [0],
    renderingMode: 0,
    font: null,
    fontSize: 12,
};
exports.DEFAULT_TEXT_STATE = {
    fontName: null,
    fontSize: 12,
    charSpacing: 0,
    wordSpacing: 0,
    horizontalScale: 100,
    leading: 0,
    renderingMode: 0,
    rise: 0,
    textMatrix: [1, 0, 0, 1, 0, 0],
    lineMatrix: [1, 0, 0, 1, 0, 0],
};
