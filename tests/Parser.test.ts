import { Opcode, Parser } from '../src/';

describe('comments', () => {
    test('single seuqnece comments', () => {
        const parser = new Parser({
            program: `hlt;out
hlt ; out
hlt; out`,
            comments: {
                enabled: true,
                sequence: ';'
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();

        result.instructions.forEach((instruction) => {
            expect(instruction).toEqual({
                opcode: Opcode.HLT
            });
        });
    });
    
    test('multi-seuqnece comments', () => {
        const parser = new Parser({
            program: `hlt//inp
hlt // inp
hlt// inp`,
            comments: {
                enabled: true,
                sequence: '//'
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();

        result.instructions.forEach((instruction) => {
            expect(instruction).toEqual({
                opcode: Opcode.HLT
            });
        });
    });
});

describe('split lines', () => {
    test('generic split lines', () => {
        const parser = new Parser({
            program: 'hlt; hlt;hlt',
            comments: {
                enabled: false,
                sequence: ''
            },
            splitLines: {
                enabled: true,
                sequence: ';'
            }
        });

        const result = parser.parse();

        result.instructions.forEach((instruction) => {
            expect(instruction).toEqual({
                opcode: Opcode.HLT
            });
        });
    });
    
    test('multi-sequence split lines', () => {
        const parser = new Parser({
            program: 'hlt;!abc;hlt;!abc;hlt',
            comments: {
                enabled: false,
                sequence: ''
            },
            splitLines: {
                enabled: true,
                sequence: ';!abc;'
            }
        });

        const result = parser.parse();

        result.instructions.forEach((instruction) => {
            expect(instruction).toEqual({
                opcode: Opcode.HLT
            });
        });
    });
});

describe('parser', () => {
    test('one-set', () => {
        const parser = new Parser({
            program: 'hlt',
            comments: {
                enabled: false,
                sequence: ''
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();
        expect(result.instructions).toEqual([{
            opcode: Opcode.HLT
        }]);
    });
    
    test('two-set-label', () => {
        const parser = new Parser({
            program: `bra end
end hlt`,
            comments: {
                enabled: false,
                sequence: ''
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();
        expect(result.instructions.map((instruction) => instruction.opcode)).toEqual([
            Opcode.BRA,
            Opcode.HLT
        ]);
        expect(result.labels).toEqual(new Map([['end', 1]]));
    });
    
    test('two-set-operand', () => {
        const parser = new Parser({
            program: 'bra 1',
            comments: {
                enabled: false,
                sequence: ''
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();
        expect(result.instructions).toEqual([{
            opcode: Opcode.BRA,
            operand: 1
        }]);
    });

    test('three-set', () => {
        const parser = new Parser({
            program: 'end bra end',
            comments: {
                enabled: false,
                sequence: ''
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();
        expect(result.instructions.map((instruction) => instruction.opcode)).toEqual([
            Opcode.BRA
        ]);
        expect(result.labels).toEqual(new Map([['end', 0]]));
    });

    test('test-script', () => {
        const parser = new Parser({
            program: `// program:
// > "hello"
// > brp (didn't manage to include)
// > take in input for question q{n} 1-3, add q num to value
// > request each question until complete
// > "bye"


// "hello"
	lda char_h
	otc
	lda char_e
	otc
	lda char_l
	otc
	otc
	lda char_o
	otc

// brp (didn't include)
	lda two
	sub one
	brp start
	hlt

// input + 1
start   inp
        add one
        out
        sta ans_1

// input + 2
        inp
        add two
        out
        sto ans_2

// input + 3
        inp
        add three
        out
        sto ans_3

// question 1
q1      lda char_q
        otc
        lda char_1
        otc

        inp
	sub ans_1
	brz q2
	bra q1

q2	lda char_q
	otc
	lda char_2
	otc

	inp
	sub ans_2
	brz q3
	bra q2

q3	lda char_q
	otc
	lda char_3
	otc

	inp
	sub ans_3
	brz bye
	bra q3

bye	lda char_b
	otc
	lda char_y
	otc
	lda char_e
	otc



one     dat 1
two     dat 2
three   dat 3
ans_1   dat 0
ans_2   dat 0
ans_3   dat 0

// used for hello
char_h  dat 104
char_e  dat 101
char_l  dat 108
char_o  dat 111

// used for bye
char_b  dat 98
char_y  dat 121 

// used for q{n}
char_q  dat 113
char_1  dat 49
char_2  dat 50
char_3  dat 51
`,
            comments: {
                enabled: true,
                sequence: '//'
            },
            splitLines: {
                enabled: false,
                sequence: ''
            }
        });

        const result = parser.parse();

        // TODO: in-depth testing
        expect(result.instructions.map((instruction) => instruction.opcode)).toEqual([
            Opcode.LDA, Opcode.OTC,
            Opcode.LDA, Opcode.OTC,
            Opcode.LDA, Opcode.OTC, Opcode.OTC,
            Opcode.LDA, Opcode.OTC,
            Opcode.LDA, Opcode.SUB, Opcode.BRP, Opcode.HLT,
            Opcode.INP, Opcode.ADD, Opcode.OUT, Opcode.STA,
            Opcode.INP, Opcode.ADD, Opcode.OUT, Opcode.STA,
            Opcode.INP, Opcode.ADD, Opcode.OUT, Opcode.STA,
            Opcode.LDA, Opcode.OTC, Opcode.LDA, Opcode.OTC,
            Opcode.INP, Opcode.SUB, Opcode.BRZ, Opcode.BRA,
            Opcode.LDA, Opcode.OTC, Opcode.LDA, Opcode.OTC,
            Opcode.INP, Opcode.SUB, Opcode.BRZ, Opcode.BRA,
            Opcode.LDA, Opcode.OTC, Opcode.LDA, Opcode.OTC,
            Opcode.INP, Opcode.SUB, Opcode.BRZ, Opcode.BRA,
            Opcode.LDA, Opcode.OTC,
            Opcode.LDA, Opcode.OTC,
            Opcode.LDA, Opcode.OTC,
            Opcode.DAT, Opcode.DAT, Opcode.DAT,
            Opcode.DAT, Opcode.DAT, Opcode.DAT,
            Opcode.DAT, Opcode.DAT, Opcode.DAT, Opcode.DAT,
            Opcode.DAT, Opcode.DAT,
            Opcode.DAT, Opcode.DAT, Opcode.DAT, Opcode.DAT
        ]);
    });
});
