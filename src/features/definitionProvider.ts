/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import AbstractSupport from './abstractProvider';
import * as Protocol from '../protocol';
import {createRequest, toLocation} from '../typeConvertion';
import {Uri, TextDocument, Position, Location, CancellationToken, DefinitionProvider} from 'vscode';

export default class CSharpDefinitionProvider extends AbstractSupport implements DefinitionProvider {

	public provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Promise<Location> {

        let req = createRequest<Protocol.GotoDefinitionRequest>(document, position);
        req.WantMetadata = true;

        return this._server.makeRequest<Protocol.GotoDefinitionResponse>(Protocol.GoToDefinition, req, token).then(value => {
            if (!value) {
                return;
            } else if (value.FileName) {
                return toLocation(value);
            } else if (value.MetadataSource) {
                const path = `${value.MetadataSource.ProjectName}/${value.MetadataSource.AssemblyName}/${value.MetadataSource.TypeName}`;
                const query = new Buffer(JSON.stringify(value.MetadataSource)).toString('base64');
                return new Location(Uri.parse(`omnisharp://metadata/${path}.cs?${query}`), new Position(0, 0));
			}
		});
	}
}
