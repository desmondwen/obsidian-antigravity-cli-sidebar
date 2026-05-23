import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TerminalManager } from './TerminalManager';
import GeminiPlugin from './main';

export const VIEW_TYPE_GEMINI_TERMINAL = 'gemini-terminal-view';

export class TerminalView extends ItemView {
    private terminal: Terminal;
    private fitAddon: FitAddon;
    private manager: TerminalManager;
    private container: HTMLElement;
    private plugin: GeminiPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: GeminiPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_GEMINI_TERMINAL;
    }

    getDisplayText(): string {
        return 'Gemini CLI';
    }

    getIcon(): string {
        return 'bot';
    }

    async onOpen() {
        this.container = this.contentEl.createDiv({ cls: 'gemini-terminal-container' });
        
        this.terminal = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#000000',
            },
            allowProposedApi: true
        });

        this.fitAddon = new FitAddon();
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.open(this.container);
        this.fitAddon.fit();

        this.manager = new TerminalManager();

        const { command, args } = this.plugin.settings;
        
        // Use vault path as default CWD
        const vaultPath = (this.app.vault.adapter as any).getBasePath?.() || '.';

        this.manager.spawn({
            cols: this.terminal.cols,
            rows: this.terminal.rows,
            cwd: vaultPath,
            command: command || 'gemini',
            args: args.split(' ').filter(a => a.length > 0)
        }, (data) => {
            this.terminal.write(data);
        }, (code) => {
            this.terminal.write(`\r\n[Process exited with code ${code}]\r\n`);
        });

        this.terminal.onData((data) => {
            this.manager.write(data);
        });

        this.terminal.onResize((size) => {
            this.manager.resize(size.cols, size.rows);
        });

        this.registerEvent(this.app.workspace.on('resize', () => {
            this.fitAddon.fit();
        }));

        // Handle focus
        this.container.addEventListener('click', () => {
            this.terminal.focus();
        });
    }

    async onClose() {
        this.manager.kill();
        this.terminal.dispose();
    }
}
