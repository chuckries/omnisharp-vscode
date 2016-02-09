/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import fs = require('fs');
import vscode = require('vscode');
import { OmnisharpServer } from './omnisharpServer.ts';

var GitHub = require('github-releases');
var es = require('event-stream');
var tmp = require('tmp');
var vfs = require('vinyl-fs');

var isWindows = process.platform === 'win32';
var isLinux = process.platform === 'linux';
var isDarwin = process.platform === 'darwin';

export function promptToInstall(server: OmnisharpServer) {
    var item = {
        title: "Install",
        command() {
            var channel = server.getChannel();
            channel.show();
            
            downloadOmniSharp("v1.7.2.1", channel);
        }
    }
    
    vscode.window.showInformationMessage("OmniSharp provides a much richer C# experience. Would you like to install it now?", item).then(
        selection => {
            if (selection) {
                selection.command();
            }
        });
}

function downloadOmniSharp(version: string, channel: vscode.OutputChannel) {
    var result = es.through();
    
    function onError(err: string) {
        result.emit('error', err);
    }
    
    var repo = new GitHub({
		repo: 'OmniSharp/omnisharp-roslyn',
		token: process.env['GITHUB_TOKEN']
	});
    
    repo.getReleases({ tag_name: version }, (err, releases) => {
        if (err) {
            return onError(err);
        }
        
        var assetName = 'omnisharp-coreclr-';
        if (isWindows) {
            assetName += 'win-x64';
        }
        else if (isLinux) {
            assetName += 'linux-x64';
        }
        else if (isDarwin) {
            assetName += 'darwin-x64';
        }
        else {
           return onError(`Omnisharp is not supported on ${process.platform}.`);
        }
        
        channel.appendLine(`Looking for ${assetName}...`);
        
        var asset = null;
        
        for (var i = 0; i < releases.length; i++) {
            var r = releases[i];
            
            for (var j = 0; j < r.assets.length; j++) {
                if (r.assets[j].name.indexOf(assetName) >= 0) {
                    asset = r.assets[j];
                }
            }
        }
        
        if (asset == null) {
            return onError(`Could not find ${assetName}.`);
        }
        
        channel.appendLine(`Found it! Downloading ${asset.name}, ${version}...`);
        
        repo.downloadAsset(asset, (err, istream) => {
            if (err) {
                return onError(err);
            }
            
            tmp.file((err, tmpPath, fd, cleanupCallback) => {
                if (err) {
                    return onError(err);
                }
               
                var ostream = fs.createWriteStream(null, { fd: fd });
                ostream.once('error', onError);
                istream.once('error', onError);
                ostream.once('finish', () => {
                    vfs.src(tmpPath).pipe(result);
                });
                istream.pipe(ostream);
            });
        })
    });
}