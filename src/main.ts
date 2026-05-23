import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { TerminalView, VIEW_TYPE_GEMINI_TERMINAL } from './TerminalView';

interface GeminiSettings {
	command: string;
	args: string;
}

const DEFAULT_SETTINGS: GeminiSettings = {
	command: 'gemini',
	args: '--yolo --resume latest'
}

export default class GeminiPlugin extends Plugin {
	settings: GeminiSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_GEMINI_TERMINAL,
			(leaf) => new TerminalView(leaf, this)
		);

		this.addRibbonIcon('bot', 'Open Gemini CLI', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-gemini-cli',
			name: 'Open Gemini CLI',
			callback: () => {
				this.activateView();
			},
		});

		this.addSettingTab(new GeminiSettingTab(this.app, this));
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GEMINI_TERMINAL);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_GEMINI_TERMINAL);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_GEMINI_TERMINAL,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class GeminiSettingTab extends PluginSettingTab {
	plugin: GeminiPlugin;

	constructor(app: App, plugin: GeminiPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Gemini CLI Settings' });

		new Setting(containerEl)
			.setName('Gemini Command')
			.setDesc('The command to run Gemini CLI (e.g., /usr/local/bin/gemini or just gemini).')
			.addText(text => text
				.setPlaceholder('gemini')
				.setValue(this.plugin.settings.command)
				.onChange(async (value) => {
					this.plugin.settings.command = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default Arguments')
			.setDesc('Default arguments to pass to the Gemini CLI.')
			.addText(text => text
				.setPlaceholder('--yolo --resume latest')
				.setValue(this.plugin.settings.args)
				.onChange(async (value) => {
					this.plugin.settings.args = value;
					await this.plugin.saveSettings();
				}));
	}
}
