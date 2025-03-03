import Interpreter from "./interpreter/Interpreter";
import Parser from "./parser/Parser";

// Parse a program
const parser = new Parser({
    program: `inp;out;add two;out;two dat 2`, // INP, OUT, ADD TWO, OUT, TWO DAT 2
    comments: {
        enabled: true,
        sequence: "//"
    },
    splitLines: {
        enabled: true,
        sequence: ";"
    }
});
const result = parser.parse();

// Interpret a program
// Note: the memory will not be reset upon .run() calls, so you may want to create a new Interpreter instance for each program
const interpreter = new Interpreter({
    program: result.instructions,
    verbose: true,
    events: {
        onInput: () => {
            const input = Math.floor(Math.random() * 9) + 1;
            console.log(`> Input: ${input}`);
            return input
        },
        onOutput: (value) => {
            console.log(`> Output: ${value}`);
        },
        onFinished: () => {
            console.log("> Finished!");
        },
        onVerbose: (state) => {
            console.log(`> Verbose: ${JSON.stringify(state)}`);
        }
    },
    memorySize: 100
});
interpreter.run();