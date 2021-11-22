// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CAMEL_CASE, CONSTANT_CASE, KEBAB_CASE, PASCAL_CASE, SNAKE_CASE } from './enums';
const {EOL} = require('os');

export function activate(context: vscode.ExtensionContext) {
	
	let disposable = vscode.commands.registerCommand('form-convert.sqlToJava', () => {
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}
		var selection = editor.selection;
		if (!selection){
			return;
		}
		const result = sqlToJava(editor.document.getText(selection));
		editor.edit( builder => {
			builder.replace(selection, result);
		});
		vscode.window.showInformationMessage('Converted SQL to Java');
	});

	context.subscriptions.push(disposable);
}

function sqlToJava(text?: string) : string {
	if(!text) {
		return '';
	}
	const eol = getEOL(text);
	return text.split(eol).map((line) => {
		const accessor = 'private';
		const matches = line.match(/(\s*)(\w+)\s+(\w+).*/);
		if (!matches){
			return line;
		}
		const indentation = matches[1] || '';
		const fieldName = matches[2];
		const fieldType = matches[3];
		const javaFieldName = getTextCase(fieldName).camel;
		const javaFieldType = getJavaDataTypeFromSqlType(fieldType);
		return `${indentation}${accessor} ${javaFieldType} ${javaFieldName};`;
	}).join(eol);
}

function getJavaDataTypeFromSqlType(sqlDataType:string):string{
	if (/(character.*|varchar.*|text)/.test(sqlDataType)){
		return 'String';
	}
	if (/(timestamp|timestamptz)/.test(sqlDataType)){
		return 'OffsetDateTime';
	}
	if (/bool/.test(sqlDataType)){
		return 'Boolean';
	}
	if (/uuid/.test(sqlDataType)){
		return 'UUID';
	}
	return `${sqlDataType[0].toUpperCase()}${sqlDataType.slice(1)}`;
}


function getEOL(text: string) {
    const m = text.match(/\r\n|\n/g);
    const u = m && m.filter(a => a === '\n').length;
	if (u === null) {
		return EOL; // use the OS default
	}
    const w = m && m.length - u;
    if (w === null || u === w) {
        return EOL; // use the OS default
    }
    return u > w ? '\n' : '\r\n';
}

type NameCase = {
    constant: string;
    snake: string;
    kebab: string;
    readable: string;
    pascal: string;
	camel: string;
};

function getTextCase(text:string): NameCase {
	const constantCaseText = convertToConstantCase(text);
	console.log({constantCaseText});
	return {
		constant: constantCaseText,
		snake: constantCaseText.toLowerCase(),
		kebab: constantCaseText.split('_').join('-').toLowerCase(),
		readable: constantCaseText
			.split('_')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
			.join(' '),
		pascal: constantCaseText.toLowerCase()
			.split('_')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(''),
		camel: constantCaseText.toLowerCase()
			.split('_')
			.map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
			.join('')
	};
}

function convertToConstantCase(text: string) : string {
	if(CONSTANT_CASE.test(text)){
		return text;
	}
	if(SNAKE_CASE.test(text)){
		return text.toUpperCase();
	}
	if(KEBAB_CASE.test(text)){
		return text.split('-').join('_').toUpperCase();
	}
	if(PASCAL_CASE.test(text) || CAMEL_CASE.test(text)){
		return text.replace(/[a-z][A-Z]/g, (match) => `${match[0]}_${match[1]}` ).toUpperCase();
	}
	return text;
}

// this method is called when your extension is deactivated
export function deactivate() {}
