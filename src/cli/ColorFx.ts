type ColorTextFn = (text: string) => string;

const isColorAllowed = () => !process.env.NO_COLOR;
const colorIfAllowed = (colorFn: ColorTextFn) => (text: string) => isColorAllowed() ? colorFn(text) : text;

export const ColorFx = {
    bold: colorIfAllowed((text: string) => `\x1B[1m${text}\x1B[0m`),
    green: colorIfAllowed((text: string) => `\x1B[32m${text}\x1B[39m`),
    yellow: colorIfAllowed((text: string) => `\x1B[33m${text}\x1B[39m`),
    yellow2: colorIfAllowed((text: string) => `\x1B[38;5;3m${text}\x1B[39m`),
    red: colorIfAllowed((text: string) => `\x1B[31m${text}\x1B[39m`),
    magentaBright: colorIfAllowed((text: string) => `\x1B[95m${text}\x1B[39m`),
    cyanBright: colorIfAllowed((text: string) => `\x1B[96m${text}\x1B[39m`),
    white: colorIfAllowed((text: string) => `\x1B[96m${text}\x1B[39m`),
    gray: colorIfAllowed((text: string) => `\x1B[90m${text}\x1B[39m`),
    bgMagentaBlack: colorIfAllowed((text: string) => `\x1B[45m\x1B[30m${text}\x1B[39m\x1B[49m`),
    bgCyanBlack: colorIfAllowed((text: string) => `\x1B[46m\x1B[30m${text}\x1B[39m\x1B[49m`),
    bgYellowBlack: colorIfAllowed((text: string) => `\x1B[43m\x1B[30m${text}\x1B[39m\x1B[49m`),
    bgRedBlack: colorIfAllowed((text: string) => `\x1B[41m\x1B[30m${text}\x1B[39m\x1B[49m`),
    bgRedWhite: colorIfAllowed((text: string) => `\x1B[41m\x1B[96m${text}\x1B[39m\x1B[49m`),
    bgGreenBlack: colorIfAllowed((text: string) => `\x1B[42m\x1B[30m${text}\x1B[39m\x1B[49m`),
    bgBlueBlack: colorIfAllowed((text: string) => `\x1B[44m\x1B[30m${text}\x1B[39m\x1B[49m`),
};
