import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export function activate(context: vscode.ExtensionContext) {

	let manageUserSecret = vscode.commands.registerCommand('vscode-user-secret-management.manageUserSecrets', async (uri: vscode.Uri) => {

		try {
			if (uri) {
				const wsedit = new vscode.WorkspaceEdit();
				const encoder = new TextEncoder();
				//Regexs
				const userSecretsIdRegex = "<UserSecretsId>([0-9A-Fa-f]{8}-(?:[0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12})<\/UserSecretsId>";
				const endProjectRegex = "<\/PropertyGroup>";

				let userSecretsId: string | undefined = undefined;

				const projectDocument = await vscode.workspace.openTextDocument(uri);
				const xmlFileData = projectDocument.getText();

				const isSecretPresent = xmlFileData.match(userSecretsIdRegex);

				if (isSecretPresent && isSecretPresent.length > 1) {
					userSecretsId = isSecretPresent[1];
				}

				if (!userSecretsId) {
					userSecretsId = uuidv4();
					const isEndProjectPresent = xmlFileData.match(endProjectRegex);

					if (!isEndProjectPresent) {
						return;
					}

					const position = projectDocument.positionAt(isEndProjectPresent.index!);
					wsedit.insert(uri, position, "  <UserSecretsId>" + userSecretsId + "</UserSecretsId>" + os.EOL + "  ");
				}

				const userSecretsFilePath = getUserSecretJsonPath(userSecretsId!);
				const userSecretsUri = vscode.Uri.file(userSecretsFilePath);

				wsedit.createFile(userSecretsUri, { ignoreIfExists: true, contents: encoder.encode("{}") });

				if (await vscode.workspace.applyEdit(wsedit)) {
					const userSecretsTextDocument = await vscode.workspace.openTextDocument(userSecretsUri);
					await vscode.window.showTextDocument(userSecretsTextDocument);
				}
			}
		}
		catch (error) {
			if (error instanceof Error && error.message) {
				vscode.window.showErrorMessage(error.message);
			}
		}
	});

	context.subscriptions.push(manageUserSecret);
}

function getUserSecretJsonPath(userSecretsId: string) {
	if (os.platform() === 'win32') {
		return path.join(os.homedir(), '/AppData/Roaming/Microsoft/UserSecrets/', userSecretsId, '/secrets.json');
	}

	return path.join(os.homedir(), '/.microsoft/usersecrets/', userSecretsId, '/secrets.json');
}

export function deactivate() { }