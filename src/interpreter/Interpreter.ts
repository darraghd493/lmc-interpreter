import Instruction from "../common/Instruction";
import Opcode, { getOpcodeName, IOCode } from "../common/Opcodes";
import consola from "../logger";

interface InterpreterEvents {
    /**
     * Called when the interpreter requires input.
     * 
     * @returns {number} The input value.
     * 
     * @memberOf InterpreterEvents
     */
    onInput(): number;

    /**
     * Called when the interpreter outputs a value.
     * 
     * @param {number} value The output value.
     * 
     * @memberOf InterpreterEvents
     */
    onOutput(value: number): void;

    /**
     * Called when the interpreter has finished.
     * 
     * @memberOf InterpreterEvents
     */
    onFinished(): void;
}

/**
 * Represents the options for the Interpreter class.
 */
interface InterpreterOptions {
    /*
     * The program to interpret.
     * 
     * @type {Instruction[]}
     */
    program: Instruction[];

    /*
     * The events to handle during interpretation.
     * 
     * @type {InterpreterEvents}
     */
    events: InterpreterEvents;

    /*
     * The size of the memory.
     * 
     * @type {number}
     */
    memorySize: number;
};

/*
 * Interprets the parsed program.
 * 
 * @class Interpreter
 */
class Interpreter {
    private options: InterpreterOptions;
    
    // Registers
    private accumulator = 0;
    private programCounter = 0; // Instruction pointer
    private instructionRegister: Opcode = 0; // Opcode
    private addressRegister = 0; // Operand

    // Memory
    private memory: number[];

    constructor(options: InterpreterOptions) {
        this.options = options;
        this.memory = new Array(options.memorySize).fill(0);
    }

    public run() {
        this.options.program.forEach((instruction, index) => {
            if (instruction.opcode === Opcode.DAT) {
                this.memory[index] = instruction.operand as number;
            } else {
                this.memory[index] = this.encode(instruction);
            }
        });

        this.memory[this.options.program.length] = this.encode({
            opcode: Opcode.HLT
        });

        consola.info("Starting program execution");
        consola.debug("Program: " + this.options.program.map((instruction) => getOpcodeName(instruction.opcode) + (instruction.operand !== undefined ? " " + instruction.operand : "")).join(", "));
        consola.debug("Memory: " + this.memory.join(", "));

        while (this.step()) {
            // Do nothing
        }

        consola.success("Finished program execution");
        this.options.events.onFinished();
    }

    public step(): boolean {
        // Fetch
        const rawInstruction = this.memory[this.programCounter];
        if (!rawInstruction) {
            return false;
        }

        const instruction = this.decode(rawInstruction);

        // Decode
        this.instructionRegister = instruction.opcode;
        if (instruction.operand !== undefined) {
            this.addressRegister = instruction.operand;
        }

        // Execute
        switch (this.instructionRegister) {
            case Opcode.HLT:
                consola.debug("Halted");
                return false;
            case Opcode.ADD:
                consola.debug(`Performing add on ${this.accumulator} and ${this.memory[this.addressRegister]}`);
                this.accumulator += this.memory[this.addressRegister];
                break;
            case Opcode.SUB:
                consola.debug(`Performing sub on ${this.accumulator} and ${this.memory[this.addressRegister]}`);
                this.accumulator -= this.memory[this.addressRegister];
                break;
            case Opcode.STA:
                consola.debug(`Storing ${this.accumulator} at ${this.addressRegister}`);
                this.memory[this.addressRegister] = this.accumulator;
                break;
            case Opcode.ERR:
                throw new Error("ERR opcode encountered");
            case Opcode.LDA:
                consola.debug(`Loading ${this.memory[this.addressRegister]} into accumulator, replacing ${this.accumulator}`);
                this.accumulator = this.memory[this.addressRegister];
                break;
            case Opcode.BRA:
                consola.debug(`Branching to ${this.addressRegister}`);
                this.programCounter = this.addressRegister;
                break;
            case Opcode.BRZ:
                if (this.accumulator === 0) {
                    consola.debug(`Branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                    this.programCounter = this.addressRegister;
                } else {
                    consola.debug(`Not branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                }
                break;
            case Opcode.BRP:
                if (this.accumulator >= 0) {
                    this.programCounter = this.addressRegister;
                    consola.debug(`Branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                } else {
                    consola.debug(`Not branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                }
                break;
            case Opcode.INP:
                switch (this.addressRegister) {
                    case IOCode.INPUT:
                        this.accumulator = this.options.events.onInput();
                        consola.debug(`Inputting ${this.accumulator} into accumulator`);
                        break;
                    case IOCode.OUTPUT:
                        this.options.events.onOutput(this.accumulator);
                        consola.debug(`Outputting ${this.accumulator} from accumulator`);
                        break;
                    case IOCode.CHAR:
                        this.options.events.onOutput(String.fromCharCode(this.accumulator).charCodeAt(0));
                        consola.debug(`Outputting ${this.accumulator} from accumulator as character`);
                        break;   
                }
                break;
            case Opcode.DAT:
                // Do nothing
                break;
            default:
                throw new Error(`Unknown opcode: ${this.instructionRegister}`);
        }

        // Increment
        this.programCounter++;

        return true;
    }

    // Instruction
    private encode(instruction: Instruction): number {
        return (instruction.opcode << 8) | (instruction.operand || 0);
    }

    private decode(rawInstruction: number): Instruction {
        return {
            opcode: (rawInstruction & 0xFF00) >> 8,
            operand: rawInstruction & 0x00FF
        };
    }
}

export default Interpreter;