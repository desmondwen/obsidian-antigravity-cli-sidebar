import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { TERMINAL_PTY_PY, TERMINAL_WIN_PY } from './pty';

export interface TerminalOptions {
    cols: number;
    rows: number;
    cwd: string;
    command: string;
    args: string[];
}

export class TerminalManager {
    private process: ChildProcess | null = null;
    private ptyPath: string;

    constructor() {
        this.ptyPath = this.setupPtyScript();
    }

    private setupPtyScript(): string {
        const isWindows = process.platform === 'win32';
        const scriptContent = isWindows ? TERMINAL_WIN_PY : TERMINAL_PTY_PY;
        const scriptName = isWindows ? 'terminal_win.py' : 'terminal_pty.py';
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'antigravity-pty-'));
        const scriptPath = path.join(tempDir, scriptName);
        
        fs.writeFileSync(scriptPath, Buffer.from(scriptContent, 'base64'));
        fs.chmodSync(scriptPath, 0o755);
        return scriptPath;
    }

    public spawn(options: TerminalOptions, onData: (data: string) => void, onExit: (code: number | null) => void) {
        const isWindows = process.platform === 'win32';
        
        const pythonCmd = isWindows ? 'python' : 'python3';
        const spawnArgs = [
            this.ptyPath,
            options.cols.toString(),
            options.rows.toString(),
            options.command,
            ...options.args
        ];

        this.process = spawn(pythonCmd, spawnArgs, {
            cwd: options.cwd,
            env: this.getEnhancedEnv()
        });

        this.process.stdout?.on('data', (data) => {
            onData(data.toString());
        });

        this.process.stderr?.on('data', (data) => {
            onData(data.toString());
        });

        this.process.on('exit', (code) => {
            onExit(code);
            this.cleanup();
        });
    }

    public write(data: string) {
        this.process?.stdin?.write(data);
    }

    public resize(cols: number, rows: number) {
        // The Python script listens for this special sequence to resize the PTY
        const resizeSeq = `\x1b]RESIZE;${cols};${rows}\x07`;
        this.write(resizeSeq);
    }

    public kill() {
        if (this.process) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
    }

    private cleanup() {
        try {
            const dir = path.dirname(this.ptyPath);
            if (fs.existsSync(this.ptyPath)) fs.unlinkSync(this.ptyPath);
            if (fs.existsSync(dir)) fs.rmdirSync(dir);
        } catch (e) {
            // Best effort cleanup
        }
    }

    private getEnhancedEnv(): NodeJS.ProcessEnv {
        const env: NodeJS.ProcessEnv = { ...process.env, TERM: 'xterm-256color' };
        const shell = process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/zsh');
        env.SHELL = shell;

        if (process.platform !== 'win32') {
            let userPath = process.env.PATH || '';
            try {
                const shellOutput = require('child_process').execSync(`${shell} -l -c 'echo __PATH__:\$PATH'`, {
                    encoding: 'utf8',
                    timeout: 3000
                });
                const match = shellOutput.match(/__PATH__:(.*)/);
                if (match && match[1]) {
                    userPath = match[1].trim();
                }
            } catch (e) {
                // Fallback to existing env PATH
            }

            const home = os.homedir();
            const commonPaths = [
                '/opt/homebrew/bin',
                '/opt/homebrew/sbin',
                '/usr/local/bin',
                '/usr/local/sbin',
                path.join(home, '.local', 'bin'),
                path.join(home, '.cargo', 'bin')
            ];

            const currentParts = userPath.split(path.delimiter).filter(Boolean);
            for (const p of commonPaths) {
                if (fs.existsSync(p) && !currentParts.includes(p)) {
                    currentParts.unshift(p);
                }
            }
            env.PATH = currentParts.join(path.delimiter);
            if (!env.LANG) env.LANG = 'en_US.UTF-8';
            if (!env.LC_ALL) env.LC_ALL = 'en_US.UTF-8';
        }

        return env;
    }
}
