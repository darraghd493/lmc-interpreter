import Instruction from "../common/Instruction";
import Opcode, { getOpcodeName, IOCode } from "../common/Opcodes";
import consola from "../logger";

/*
 * Represents the state of the interpreter when verbose output is enabled.
 * 
 * @interface InterpreterVerboseState
* */
interface InterpreterVerboseState {
    /*
     * The value of the accumulator.
     * 
     * @type {number}
     * @memberOf InterpreterVerboseState
    * */
    accumulator: number;

    /*
     * The value of the program counter.
     * 
     * @type {number}
     * @memberOf InterpreterVerboseState
     */
    programCounter: number;

    /**
     * The current instruction.
     * 
     * @type {Opcode}
     * @memberOf InterpreterVerboseState
     */
    instructionRegister: Opcode;

    /*
     * The value of the address register.
     * 
     * @type {number}
     * @memberOf InterpreterVerboseState
    * */
    addressRegister: number;

    /**
     * The memory of the interpreter.
     * 
     * @type {number[]}
     * @memberOf InterpreterVerboseState
     */
    memory: number[];
}

/**
 * Represents the events that can be handled by the Interpreter.
 * 
 * @interface InterpreterEvents
 */
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
    onOutput(value: string | number): void;

    /**
     * Called when the interpreter has finished.
     * 
     * @memberOf InterpreterEvents
     */
    onFinished(): void;

    /**
     * Called when the interpreter is in verbose mode to dump the state.
     * 
     * @param {InterpreterVerboseState} state 
     * 
     * @memberOf InterpreterEvents
     */
    onDump?(state: InterpreterVerboseState): void;

    /*
     * Called when the interpreter logs a message.
     * 
     * @param {string} message The message to log.
     * 
     * @memberOf InterpreterEvents
    * */
    onLog?(message: string): void;
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

    /*
     * Whether to append a halt instruction to the end of the program.
     * 
     * @type {boolean}
     * @memberOf InterpreterOptions
    * */
    appendHalt?: boolean;
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
        this.initialise();

        consola.log("Starting program execution");
        if (this.options.events.onLog) {
            this.options.events.onLog("Starting program execution");
        }

        this.debug("Program: " + this.options.program.map((instruction) => getOpcodeName(instruction.opcode) + (instruction.operand !== undefined ? " " + instruction.operand : "")).join(", "));
        this.debug("Memory: " + this.memory.join(", "));
        
        while (this.step()) {
            if (this.options.events.onDump) {
                this.options.events.onDump(this.state);
            }
        }

        consola.success("Finished program execution");
        if (this.options.events.onLog) {
            this.options.events.onLog("Finished program execution");
        }

        this.options.events.onFinished();
    }

    public initialise() {
        this.options.program.forEach((instruction, index) => {
            if (instruction.opcode === Opcode.DAT) {
                this.memory[index] = instruction.operand as number;
            } else {
                this.memory[index] = this.encode(instruction);
            }
        });

        if (this.options.appendHalt) {
            this.memory[this.options.program.length] = this.encode({
                opcode: Opcode.HLT
            });
        }
    }

    public step(): boolean {
        // Fetch
        const rawInstruction = this.memory[this.programCounter];
        if (!rawInstruction) {
            return false;
        }

        // Increment
        this.programCounter++;
        
        // Decode
        const instruction = this.decode(rawInstruction);

        this.instructionRegister = instruction.opcode;
        if (instruction.operand !== undefined) {
            this.addressRegister = instruction.operand;
        }

        // Execute
        switch (this.instructionRegister) {
            case Opcode.HLT:
                this.debug("Halted");
                return false;
            case Opcode.ADD:
                this.debug(`Performing add on ${this.accumulator} and ${this.memory[this.addressRegister]}`);
                this.accumulator += this.memory[this.addressRegister];
                break;
            case Opcode.SUB:
                this.debug(`Performing sub on ${this.accumulator} and ${this.memory[this.addressRegister]}`);
                this.accumulator -= this.memory[this.addressRegister];
                break;
            case Opcode.STA:
                this.debug(`Storing ${this.accumulator} at ${this.addressRegister}`);
                this.memory[this.addressRegister] = this.accumulator;
                break;
            case Opcode.ERR:
                throw new Error("ERR opcode encountered");
            case Opcode.LDA:
                this.debug(`Loading ${this.memory[this.addressRegister]} into accumulator, replacing ${this.accumulator}`);
                this.accumulator = this.memory[this.addressRegister];
                break;
            case Opcode.BRA:
                this.debug(`Branching to ${this.addressRegister}`);
                this.programCounter = this.addressRegister;
                break;
            case Opcode.BRZ:
                if (this.accumulator === 0) {
                    this.debug(`Branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                    this.programCounter = this.addressRegister;
                } else {
                    this.debug(`Not branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                }
                break;
            case Opcode.BRP:
                if (this.accumulator >= 0) {
                    this.programCounter = this.addressRegister;
                    this.debug(`Branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                } else {
                    this.debug(`Not branching to ${this.addressRegister} because accumulator is ${this.accumulator}`);
                }
                break;
            case Opcode.INP:
                switch (this.addressRegister) {
                    case IOCode.INPUT:
                        this.accumulator = this.options.events.onInput();
                        this.debug(`Inputting ${this.accumulator} into accumulator`);
                        break;
                    case IOCode.OUTPUT:
                        this.options.events.onOutput(this.accumulator);
                        this.debug(`Outputting ${this.accumulator} from accumulator`);
                        break;
                    case IOCode.CHAR:
                        this.options.events.onOutput(String.fromCharCode(this.accumulator));
                        this.debug(`Outputting ${this.accumulator} from accumulator as character`);
                        break;   
                }
                break;
            case Opcode.DAT:
                // Do nothing
                break;
            default:
                throw new Error(`Unknown opcode: ${this.instructionRegister}`);
        }

        return true;
    }

    public wipe() {
        this.accumulator = 0;
        this.programCounter = 0;
        this.instructionRegister = 0;
        this.addressRegister = 0;
        this.memory = new Array(this.options.memorySize).fill(0);
    }

    get state(): InterpreterVerboseState {
        return {
            accumulator: this.accumulator,
            programCounter: this.programCounter,
            instructionRegister: this.instructionRegister,
            addressRegister: this.addressRegister,
            memory: this.memory
        };
    }

    get memoryDump(): string {
        return this.memory.join(", ");
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

    // Log
    private debug(message: string) {
        if (this.options.events.onLog) {
            this.options.events.onLog(message);
        }
        consola.debug(message);
    }
}

export default Interpreter;