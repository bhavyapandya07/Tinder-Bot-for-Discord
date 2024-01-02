import fs from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const Levels = ['info', 'warn', 'error', 'critical', 'debug'] as const;

export class Log {
    private static writeQueue: { msg: string; verboseOnly: boolean }[] = [];
    private static rotated = false;

    constructor(private loggerName: string) {}

    public static rotate() {
        if (!fs.existsSync('log')) fs.mkdirSync('log');
        const crashPath = join('log', 'crashes');
        if (!fs.existsSync(crashPath)) fs.mkdirSync(crashPath);

        if (fs.existsSync(join('log', 'verbose.txt'))) {
            fs.unlinkSync(join('log', 'verbose.txt'));
        }

        const files = [...fs.readdirSync('log')]
            .filter((d) => d.startsWith('log.txt'))
            .sort((fileA, fileB) => {
                let a = parseInt(fileA.slice('log.txt.'.length));
                let b = parseInt(fileB.slice('log.txt.'.length));

                if (fileA === 'log.txt') a = 0;
                if (fileB === 'log.txt') b = 0;

                return b - a;
            });

        for (const file of files) {
            const index = file === 'log.txt' ? 0 : parseInt(file.slice('log.txt.'.length));

            if (index + 1 > 5) {
                fs.unlinkSync(join('log', file));
            } else {
                fs.renameSync(join('log', file), join('log', `log.txt.${index + 1}`));
            }
        }
        this.rotated = true;
        this.writeQueue.forEach(({ msg, verboseOnly }) => {
            this.write(msg, verboseOnly);
        });
    }

    public static createCrash() {
        const crashPath = join('log', 'crashes');
        if (!fs.existsSync(crashPath)) fs.mkdirSync(crashPath);
        const crashTime = new Date().toISOString();

        fs.copyFileSync(join('log', 'log.txt'), join(crashPath, `${crashTime}.txt`));
        fs.copyFileSync(join('log', 'verbose.txt'), join(crashPath, `${crashTime}.verbose.txt`));
    }

    private static getMsg(level: (typeof Levels)[number], data: unknown[] | unknown): string {
        const msg: string[] = [];

        if (!Array.isArray(data)) data = [data];
        if ((data as unknown[]).length === 0) return this.getMsg(level, '');

        for (const datum of data as unknown[]) {
            if (datum instanceof Error) {
                msg.push(datum.stack!);
                if (datum.cause != null) {
                    msg.push(
                        datum.cause instanceof Error ? datum.cause.stack! : JSON.stringify(datum, null, 2)
                    );
                }
            } else if (datum instanceof Object) {
                msg.push(JSON.stringify(datum, null, 2));
            } else {
                msg.push(datum as string);
            }
        }

        switch (level) {
            case 'info': {
                return `${chalk.green(
                    `[ ${new Date()
                        .toISOString()
                        .replace(/T|(\.[0-9]*)Z/g, ' ')
                        .trim()} ]`
                )} ${chalk.green.bold('[I]')} ${chalk.green(msg.join(' '))}`;
            }
            case 'warn': {
                return `${chalk.yellow(
                    `[ ${new Date()
                        .toISOString()
                        .replace(/T|(\.[0-9]*)Z/g, ' ')
                        .trim()} ]`
                )} ${chalk.yellow.bold('[W]')} ${chalk.yellow(msg.join(' '))}`;
            }
            case 'error': {
                return `${chalk.red(
                    `[ ${new Date()
                        .toISOString()
                        .replace(/T|(\.[0-9]*)Z/g, ' ')
                        .trim()} ]`
                )} ${chalk.red.bold('[E]')} ${chalk.red(msg.join(' '))}`;
            }
            case 'critical': {
                return `${chalk.redBright(
                    `[ ${new Date()
                        .toISOString()
                        .replace(/T|(\.[0-9]*)Z/g, ' ')
                        .trim()} ]`
                )} ${chalk.redBright.bold('[C]')} ${chalk.redBright(msg.join(' '))}`;
            }
            case 'debug': {
                return `${chalk.blue(
                    `[ ${new Date()
                        .toISOString()
                        .replace(/T|(\.[0-9]*)Z/g, ' ')
                        .trim()} ]`
                )} ${chalk.blue.bold('[D]')} ${chalk.blue(msg.join(' '))}`;
            }
        }
    }

    private static write(msg: string, verboseOnly = false) {
        if (this.rotated) {
            fs.appendFileSync(join('log', 'verbose.txt'), msg.trim() + '\n');
            if (verboseOnly) return;
            fs.appendFileSync(join('log', 'log.txt'), msg.trim() + '\n');
        } else {
            this.writeQueue.push({ msg, verboseOnly });
        }
    }

    public static info(...data: unknown[]) {
        const msg = this.getMsg('info', data);
        console.log(msg);
        this.write(msg);
    }

    public static warn(...data: unknown[]) {
        const msg = this.getMsg('warn', data);
        console.warn(msg);
        this.write(msg);
    }

    public static error(...data: unknown[]) {
        const msg = this.getMsg('error', data);
        console.error(msg);
        this.write(msg);
    }

    public static critical(...data: unknown[]) {
        const msg = this.getMsg('critical', data);
        console.error(msg);
        this.write(msg);
    }

    public static debug(...data: unknown[]) {
        const msg = this.getMsg('debug', data);
        this.write(msg, true);
        if (process.env.VERBOSE_LOGGING) console.debug(msg);
    }

    // public static logMethod(level: (typeof Levels)[number], tag: string) {
    //     return (target: unknown, key: string, descriptor: unknown) => {
    //         const originalMethod = descriptor.value;
    //         descriptor.value = function (...args: unknown[]) {
    //             Log[level](
    //                 `[method-logger] [${tag}] called ${
    //                     target.constructor.name === 'Function' ? target.name : target.constructor.name
    //                 }.${key}(${args.join(', ')})`
    //             );
    //             return originalMethod.apply(target, args);
    //         };
    //         return descriptor;
    //     };
    // }

    public info(...data: unknown[]) {
        Log.info(this.name, ...data);
    }

    public warn(...data: unknown[]) {
        Log.warn(this.name, ...data);
    }

    public error(...data: unknown[]) {
        Log.error(this.name, ...data);
    }

    public critical(...data: unknown[]) {
        Log.critical(this.name, ...data);
    }

    public debug(...data: unknown[]) {
        Log.debug(this.name, ...data);
    }

    private get name() {
        return `[${this.loggerName}]`;
    }
}

export function create(name: string) {
    return new Log(name);
}

export default Log;

process.on('uncaughtException', (e) => {
    Log.critical('=== Unhandled Exception ===');
    Log.critical(e);
    Log.createCrash();
    process.exit(1);
});

process.on('unhandledRejection', (e) => {
    Log.critical('=== Unhandled Rejection ===');
    Log.critical(e);
    Log.createCrash();
    process.exit(1);
});
