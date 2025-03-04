import { Interpreter, Parser } from '../src';

test('simple run', done => {
    const parser = new Parser({
        program: 'inp; out; hlt',
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
    const interpreter = new Interpreter({
        program: result.instructions,
        events: {
            onInput: () => 0,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onOutput: () => {},
            onFinished: () => done(false)
        },
        memorySize: 100
    });
    interpreter.run();
}, 500);

test('simple run alt', done => {
    const parser = new Parser({
        program: 'inp; out; hlt',
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
    const interpreter = new Interpreter({
        program: result.instructions,
        events: {
            onInput: () => 0,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onOutput: () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onFinished: () => {}
        },
        memorySize: 100
    });
    interpreter.run();
    done();
}, 500);

test('input', done => {
    const parser = new Parser({
        program: 'inp',
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
    const interpreter = new Interpreter({
        program: result.instructions,
        events: {
            onInput: done,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onOutput: () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onFinished: () => {}
        },
        memorySize: 100
    });
    interpreter.run();
}, 500);

test('output', done => {
    const parser = new Parser({
        program: 'out',
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
    const interpreter = new Interpreter({
        program: result.instructions,
        events: {
            onInput: () => 0,
            onOutput: done,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onFinished: () => {}
        },
        memorySize: 100
    });
    interpreter.run();
}, 500);

test('output as char', (done) => {
    const parser = new Parser({
        program: `lda char
otc
hlt
char dat 101`,
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
    const interpreter = new Interpreter({
        program: result.instructions,
        events: {
            onInput: () => 0,
            onOutput: (value: string) => {
                done(value !== 'e');
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onFinished: () => {}
        },
        memorySize: 100
    });
    interpreter.run();
}, 500);
