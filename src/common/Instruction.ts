import Opcode from "./Opcodes"

/**
 * Represents an instruction in the program.
 */
interface Instruction {
    opcode: Opcode;
    operand?: number;
}

export default Instruction;