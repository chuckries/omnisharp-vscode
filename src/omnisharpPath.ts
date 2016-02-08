/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import fs = require('fs');
import path = require('path');
import vscode = require('vscode');

export function getOmnisharpDefaultInstallDirectory() : string {
    return path.join(__dirname, '../.omnisharp');
}

export function getOmnisharpRunPath(): string {
    var fileName = process.platform === 'win32' ? 'run.cmd' : 'run';
    
    // look for VS Code configuration setting
    var omnisharpConfig = vscode.workspace.getConfiguration('csharp').get<string>('omnisharp');
    if (omnisharpConfig) {
        var fullPath = path.join(omnisharpConfig, fileName);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    
    // look for OMNISHARP environment variable
    var omnisharpEnv = process.env['OMNISHARP'];
    if (typeof omnisharpEnv === 'string') {
        var fullPath = path.join(omnisharpEnv, fileName);
        if (fs.existsSync(fullPath)) {
            console.warn('[deprecated] use workspace or use settings with "csharp.omnisharp":"/path/to/omnisharp"');
            return fullPath;
        }
    }
    
    // look in default install directory
    var installDirectory = getOmnisharpDefaultInstallDirectory();
    if (installDirectory) {
        var fullPath = path.join(installDirectory, fileName);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    
    return null;
}