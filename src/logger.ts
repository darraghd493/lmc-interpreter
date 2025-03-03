import consola, { LogLevel } from "consola";

consola.level = 3; // info
export default consola;

export const setLoggerLevel = (level: LogLevel) => {
    consola.level = level;
}