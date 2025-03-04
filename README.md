# lmc-interpreter

This is a simple interpreter/simulator for the Little Man Computing (LMC) architecture written in Typescript.

**Components:**

- parser
- interpreter

## Installation

```bash
npm install lmc-interpreter
```

```bash
yarn add lmc-interpreter
```

```bash
pnpm add lmc-interpreter
```

## Usage

```ts
import Interpreter from "./interpreter/Interpreter"; // or: Interpreter from "lmc-interpreter"
import Parser from "./parser/Parser"; // or: Parser from "lmc-interpreter"

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
        }
        // onDump = dump per step
        // onLog = logs/actions
    },
    memorySize: 100
});
interpreter.run();
```

[View example here.](./src/example.ts)

## Parser

### Instructions

| Code | Instruction | Description |
| ---- | ----------- | ----------- |
| 0    | HLT         | Stop/exit   |
| 1    | ADD         | Adds the contents of the memory address provided to the Accumulator |
| 2    | SUB         | Subtracts the contents of the memory address provided from the Accumulator |
| 3    | STA/STO     | Stores the contents of the Accumulator in the memory address provided |
| 4    |             | Unused, throws an error |
| 5    | LDA         | Loads the contents of the memory address provided into the Accumulator |
| 6    | BRA         | Branches to the memory address provided |
| 7    | BRZ         | Branches to the memory address provided if the Accumulator is zero |
| 8    | BRP         | Branches to the memory address provided if the Accumulator is positive |
| 9    | INP/OUT     | Input (default `1`)/Output (default `2`), [Codes](#io-codes) |
| 9    | OTC         | Output Character, [Codes](#io-codes) |

> All instructions are inherited from [PeterHigginson.co.uk](https://peterhigginson.co.uk/lmc/help_new.html)'s Little Man Computing implementation.

#### I/O Codes

| Code | Description |
| ---- | ----------- |
| 1    | Input       |
| 2    | Output      |
| 22   | Output Character (OTC only, assigned by default) |

### Syntax

The parser expects the following syntax for instructions:

```plaintext
<label?> <instruction> <operand?>
```

Using a space to split the tokens, this prevents labels from containing spaces as they will not be tokenised correctly. Read more here: [Labels](#labels)

#### Comments

The parser optionally supports comments using the `#` character. Comments can be placed at the end of a line or on a line by themselves.

Any content **after** the `#` character is ignored.

#### Split Lines

The parser optionally supports splitting lines using the `;` character. This allows for multiple instructions to be placed on a single line.

#### Labels

Labels are optional and can be used to reference memory addresses.

Labels must fit the following syntax:

- alphanumeric; tokensiation is based on spaces
- can contain underscores
- must not start with a number; to prevent confusion with memory addresses
- must not match an instruction; to prevent confusion with instructions; `<label> <opcode>` v. `<opcode> <operand>` is identified by identifying the opcode position.

## Interpreter

In comparison to Peter Higginson's implementation, this interpreter has the following fundamental differences:

- unrestricted sizes (memory, accumulator, etc.)
