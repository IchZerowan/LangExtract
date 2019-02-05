// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "langextractor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.langExtract', () => {
		// The code you place here will be executed every time your command is executed

		const editor = vscode.window.activeTextEditor;
		if(editor !== undefined && vscode.workspace !== undefined){
			let text = editor.document.getText(editor.selection);
			// Lang variable name is built as follows by default:  
			let name = toVariableName(text);
			
			let result = vscode.window.showInputBox({prompt: "Enter lang variable name", value: name});
			result.then(function(result){
				if(result !== undefined && result.match(/^[0-9a-z_]+$/i)){
					extractVariable(editor, result, text);
				} else {
					vscode.window.showErrorMessage("Invalid variable name!");
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

function toVariableName(text: string): string {
	return text.match(/^[0-9a-z_\s]+$/i)? 
		text.trim().substr(0, 32)
		.toLowerCase()
		.replace(/\s/, '_')
		: '';
}

function getRootPath(): string {
	return vscode.workspace.workspaceFolders![0].uri.fsPath!;
}

function getLangFile(): string {
	const config = vscode.workspace.getConfiguration('langExtract', vscode.window.activeTextEditor!.document.uri);
	let file = "" + config.get('langFile');
	let full = path.join(getRootPath(), file);
	console.log(full);
	return full;
}

function extractVariable(editor: vscode.TextEditor, name: string, value: string){
	// Replace text to $lang variable
	editor!.edit(function(editBuilder){
		editBuilder.replace(editor.selection, "<?=$lang['" + name + "']?>");
	});

	// Ensure file exists
	let file = getLangFile();
	if(!fs.existsSync(file)){
		vscode.window.showErrorMessage("Invalid lang file path!");
		return;
	} 

	// Add value to $lang[]
	fs.readFile(file, 'utf8', function(error, data){
		if(error){
			vscode.window.showErrorMessage("Unable to read lang file!\n" + error);
			return;
		}
		var result = data.replace(/[\)\]];/, "\t'" + name + "' => '" + value + "',\n);");

		fs.writeFile(file, result, 'utf8', function (error) {
			if(error){
				vscode.window.showErrorMessage("Unable to write lang file!\n" + error);
			}
		});
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
