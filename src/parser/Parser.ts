import logger from "../logger";
import Instruction from "../common/Instruction";
import Opcode, { IOCode } from "../common/Opcodes";

/**
 * Represents the options for handling comments in the program.
 */
interface CommentOptions {
    /**
     * Whether comments should be ignored or not.
     * 
     * @type {boolean}
     */
    enabled: boolean;

    /**
     * The sequence that indicates a comment.
     * 
     * Suggested: ;
     *  (alternative): #
     * 
     * @type {string}
     */
    sequence: string;
}

/**
 * Represents the options for splitting lines in the program.
 */
interface SplitOptions {
    /**
     * Whether lines should be split or not.
     * 
     * @type {boolean}
     */
    enabled: boolean;

    /**
     * The sequence that indicates a line should be split.
     * 
     * Suggested: ;
     * 
     * @type {string}
     */
    sequence: string;
}

/**
 * Represents the options for the parser.
 */
interface ParserOptions {
    /**
     * The program to be parsed.
     * 
     * @type {string}
     */
    program: string;

    /**
     * The options for handling comments in the program.
     * 
     * @type {CommentOptions}
     */
    comments: CommentOptions;
    
    /**
     * The options for splitting lines in the program.
     * 
     * @type {SplitOptions}
     */
    splitLines: SplitOptions;
}

/**
 * Represents the result of parsing the program.
 */
interface ParserResult {
    /**
     * Stores each instruction contained in the program.
     * 
     * @type {Instruction[]} instructions
     */
    instructions: Instruction[];

    /**
     * Maps each label to its corresponding instruction index.
     */
    labels: Map<string, number>;
}

/**
 * Represents the state of the parser when two tokens are expected. (internal use only)
 */
type TwoTokenState = 'label' | 'operand';

/**
 * Represents an instruction in the program. (internal use only)
 */
interface IntermediaryInstruction {
    opcode: Opcode;
    operand?: number | string;
}

/**
 * Helper function to test if an opcode is valid.
 * 
 * @param opcodeName The name of the opcode to test.
 * @returns {boolean} Whether the opcode is valid or not.
 */
const findOpcode = (opcodeName: string): Opcode | undefined => {
    return Opcode[opcodeName.toUpperCase() as keyof typeof Opcode];
}

/**
 * Helper function to test if a label is valid.
 * 
 * @param labelName The name of the label to test.
 * @returns {boolean} Whether the label is valid or not.
 */
const testLabel = (labelName: string): boolean => {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(labelName);
}

/**
 * Parses the program into a list of instructions.
 * 
 * @class Parser
 */
class Parser {
    private options: ParserOptions;

    constructor(options: ParserOptions) {   
        this.options = options;
    }
    
    parse(): ParserResult {
        const result: ParserResult = {
            instructions: [],
            labels: new Map()
        };
        const instructions: IntermediaryInstruction[] = [];

        // Helper functions
        const handleLabel = (label: string): boolean => {
            if (testLabel(label) && !result.labels.has(label)) {
                result.labels.set(label, instructions.length);
                return true;
            } else {
                logger.error(`Invalid label: ${label}`);
                return false;
            }
        }

        const handleOperand = (operand: string): number | string | undefined => {
            if (!isNaN(parseInt(operand))) {
                return parseInt(operand);
            }
            if (testLabel(operand)) {
                return operand;
            }
            logger.error(`Invalid operand: ${operand}`);
            return undefined;
        }

        // Prepare the program for parsing
        let lines = this.options.program.split("\n");
        if (this.options.splitLines.enabled) {
            for (let i = 0; i < lines.length; i++) {
                const content = lines[i].split(this.options.splitLines.sequence);
                if (content.length > 1) {
                    lines.splice(i, 1, ...content);
                }
            }
        }
        if (this.options.comments.enabled) {
            lines = lines.map(line =>
                line.split(this.options.comments.sequence)[0]
            );
        }

        logger.info(`Parsing program with ${lines.length} lines`);

        // Tokenise the program
        let errored = false;
        for (let i = 0; i < lines.length && !errored; i++) {
            const line = lines[i].trim();
            if (line.length === 0) {
                logger.debug(`Line ${i + 1} is empty`);
                continue;
            }

            const tokens = line.split(/\s+/);

            // Parse the tokens
            let rawOpcode: string | undefined; // Used for later handling
            let twoTokenState: TwoTokenState = 'operand'; // Used to determine if the token is an operand or label in a two-token line
            
            let opcode: Opcode | undefined;
            let operand: number | string | undefined;

            logger.debug(`Got tokens: ${tokens} (${tokens.length})`);

            switch (tokens.length) { // TODO: Clean up
                case 1:
                    opcode = findOpcode(rawOpcode = tokens[0]);
                    if (opcode === undefined) {
                        errored = true;
                        logger.error(`Invalid opcode: ${line}`);
                        break;
                    }
                    break;
                case 2:
                    // Find the opcode
                    opcode = findOpcode(rawOpcode = tokens[0]);
                    if (opcode === undefined) {
                        opcode = findOpcode(rawOpcode = tokens[1]);
                        twoTokenState = 'label';
                    }
                    if (opcode === undefined) {
                        errored = true;
                        logger.error(`Invalid line: ${line}`); // Either side is wrong - leave to user to debug
                        break;
                    }
                    // Handle either the operand or label
                    if (twoTokenState == 'operand') {
                        operand = handleOperand(tokens[1]);
                        if (operand === undefined) {
                            errored = true;
                            break;
                        }
                    } else {
                        handleLabel(tokens[0]);
                    }
                    break;
                case 3:
                    opcode = findOpcode(tokens[1]);
                    if (opcode === undefined) {
                        opcode = Opcode.ERR;
                        logger.error(`Invalid opcode: ${line}`);
                        break;
                    }
                    operand = handleOperand(rawOpcode = tokens[2]);
                    if (operand === undefined) {
                        errored = true;
                        break;
                    }
                    handleLabel(tokens[0]);
                    break;
                default:
                    errored = true;
                    logger.error(`Invalid line: ${line} (too many tokens)`);
                    break;
            }

            // Handle the opcode
            switch (opcode) {
                case Opcode.ERR:
                    logger.error(`Parsed an error opcode: ${line}`);
                    errored = true;
                    break;
                case undefined:
                    if (!errored) {
                        logger.trace(`Invalid line: ${line} (opcode is undefined but no error)`);
                    }
                    break;
            }
            
            // Handle the operand
            if (operand === undefined) { // Handle operand for certain opcodes 
                switch (opcode) {
                    case Opcode.ADD:
                    case Opcode.SUB:
                    case Opcode.STA:
                    case Opcode.LDA:
                    case Opcode.BRA:
                    case Opcode.BRZ:
                    case Opcode.BRP:
                        errored = true;
                        logger.error(`Attempted to use ${operand} opcode without operand: ${line}`);
                        break;
                    case Opcode.INP:
                        switch (rawOpcode?.toLowerCase()) {
                            case 'inp':
                                operand = IOCode.INPUT;
                                break;
                            case 'out':
                                operand = IOCode.OUTPUT;
                                break;
                            case 'otc':
                                operand = IOCode.CHAR;
                                break;
                        }
                        break;
                }
            }

            // Create the instruction
            if (errored) {
                instructions.push({
                    opcode: Opcode.ERR
                });
                break
            } else {
                instructions.push({
                    opcode: opcode as Opcode,
                    operand: operand
                });
            }
        }

        // Build instructions from the intermediary instructions
        instructions.forEach(instruction => {
            if (instruction.operand !== undefined && typeof instruction.operand === 'string') {
                const index = result.labels.get(instruction.operand);
                if (index !== undefined) {
                    result.instructions.push({
                        opcode: instruction.opcode,
                        operand: index
                    });
                } else {
                    logger.error(`Label ${instruction.operand} not found`);
                    result.instructions.push({
                        opcode: Opcode.ERR
                    });
                }
            } else {
                result.instructions.push({
                    opcode: instruction.opcode,
                    operand: instruction.operand as number
                });
            }
        });

        logger.success(`Parsed ${result.instructions.length} instructions`);
        return result;
    }
}

export default Parser;