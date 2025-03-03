/*
 * Represents the different opcodes that the parser can interpret.
 * 
 * @enum {number}
 */
enum Opcode {
    HLT = 0,
    ADD = 1,
    SUB = 2,
    STA = 3,
    ERR = 4,
    LDA = 5,
    BRA = 6,
    BRZ = 7,
    BRP = 8,
    INP = 9,
    // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
    OUT = INP,
    // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
    OTC = INP,
    DAT = 10 // Not assigned an opcode in the source spec https://peterhigginson.co.uk/lmc/help_new.html
}

enum IOCode {
    INPUT = 1,
    OUTPUT = 2,
    CHAR = 22 // OTC
}

/**
 * Helper function to get the name of an opcode.
 * 
 * @param opcode The opcode to get the name of.
 * @returns {string} The name of the opcode.
 */
export const getOpcodeName = (opcode: Opcode): string => {
    switch (opcode) {
        case Opcode.HLT:
            return "HLT";
        case Opcode.ADD:
            return "ADD";
        case Opcode.SUB:
            return "SUB";
        case Opcode.STA:
            return "STA";
        case Opcode.ERR:
            return "ERR";
        case Opcode.LDA:
            return "LDA";
        case Opcode.BRA:
            return "BRA";
        case Opcode.BRZ:
            return "BRZ";
        case Opcode.BRP:
            return "BRP";
        case Opcode.INP:
            return "INP";
        case Opcode.OUT:
            return "OUT";
        case Opcode.OTC:
            return "OTC";
        case Opcode.DAT:
            return "DAT";
        default:
            return "ERR";
    }
}

export default Opcode;
export { IOCode };
