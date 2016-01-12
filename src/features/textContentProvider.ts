/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import AbstractSupport from './abstractProvider';
import * as Protocol from '../protocol';
import {createRequest, toRange} from '../typeConvertion';
import {CancellationToken, Uri, TextDocumentContentProvider} from 'vscode';


export default class  OmnisharpTextContentProvider extends AbstractSupport implements TextDocumentContentProvider {

    provideTextDocumentContent(uri: Uri, token: CancellationToken): Promise<string> {

        const raw = new Buffer(uri.query, 'base64').toString();
        const request = <Protocol.MetadataRequest> JSON.parse(raw);

        return this._server.makeRequest<Protocol.MetadataResponse>(Protocol.Metadata, request, token).then(response => {
            if (response) {
                return response.Source;
            }

            return 'Ops - failed to load source from metadata.';
        });
    }
}