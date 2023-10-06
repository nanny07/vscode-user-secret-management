import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export function activate(context: vscode.ExtensionContext) {
	
	let manageUserSecret = vscode.commands.registerCommand('vscode-user-secret-management.manageUserSecret', async (uri: vscode.Uri) => {
		const wsedit = new vscode.WorkspaceEdit();
		const encoder = new TextEncoder();
		const parser = new XMLParser({ ignoreAttributes: false });

		let propertyGroups : Array<any> = [];
		let userSecretsId : string | undefined = undefined;

		const xmlFileData = readFileSync(uri.fsPath, 'utf8');
		let jsonData = parser.parse(xmlFileData);
		let existsingPropertyGroup = jsonData.Project?.PropertyGroup;

		if(existsingPropertyGroup)
		{
			//This is a little trick when there are more than one PropertyGroup inside the project file
			propertyGroups.push(existsingPropertyGroup);
		}

		propertyGroups?.forEach(propertyGroup => {
			if(propertyGroup.UserSecretsId)
			{
				userSecretsId = propertyGroup.UserSecretsId;
			}
		});

		if(!userSecretsId)
		{
			//Create a new secret.json file and add the UserSecretsId tag to the project's file
			userSecretsId = await createUserSecretsIdAndUpdateProjectFile(propertyGroups, jsonData, uri, wsedit);
		}
		
		let userSecretsFilePath = getUserSecretJsonPath(userSecretsId!);
		let userSecretsUri = vscode.Uri.file(userSecretsFilePath);
		
		wsedit.createFile(userSecretsUri, { ignoreIfExists: true, contents: encoder.encode("{}") });

		if(await vscode.workspace.applyEdit(wsedit))
		{
			const userSecretsTextDocument = await vscode.workspace.openTextDocument(userSecretsUri);
			await vscode.window.showTextDocument(userSecretsTextDocument);
		}
	});

	context.subscriptions.push(manageUserSecret);
}

function getUserSecretJsonPath(userSecretsId: string)
{
	if (os.platform() === 'win32')
	{
		return path.join(os.homedir(), '/AppData/Roaming/Microsoft/UserSecrets/', userSecretsId, '/secrets.json');
	}
	
	return path.join(os.homedir(), '/.microsoft/usersecrets/', userSecretsId, '/secrets.json');
}

async function createUserSecretsIdAndUpdateProjectFile(propertyGroups: any[], jsonData: any, uri: vscode.Uri, wsedit: vscode.WorkspaceEdit) {
	let userSecretsId = uuidv4();
	propertyGroups[0].UserSecretsId = userSecretsId;

	jsonData.Project.PropertyGroup = propertyGroups;

	const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true });
	const xmlContent = xmlBuilder.build(jsonData);

	await updateProjectFile(uri, wsedit, xmlContent);

	return userSecretsId;
}

async function updateProjectFile(uri: vscode.Uri, wsedit: vscode.WorkspaceEdit, xmlContent: any) {
	let projDocument = await vscode.workspace.openTextDocument(uri);

	wsedit.replace(uri, new vscode.Range(0, 0, projDocument.lineCount + 1, 0), xmlContent);
	await vscode.workspace.applyEdit(wsedit);
	await vscode.workspace.saveAll();
}

export function deactivate() {}