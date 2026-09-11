/**
 * robotoskunk.com admin panel. The client admin panel of robotoskunk.com
 * Copyright (C) 2026  Edgar Lima (RobotoSkunk)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

import type {
	EntryContext,
	RouterContextProvider,
} from 'react-router';

import {
	ServerRouter,
} from 'react-router';

import {
	renderToReadableStream,
} from 'react-dom/server';

import {
	NonceContext,
} from './contexts/nonce';

import crypto from 'crypto';

export const streamTimeout = 5_000;


export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	_loadContext: RouterContextProvider,
) {
	if (request.method.toUpperCase() === 'HEAD') {
		return new Response(null, {
			status: responseStatusCode,
			headers: responseHeaders,
		});
	}

	let shellRendered = false;

	const allowInsecure = process.env.NODE_ENV !== 'production';
	const nonce = crypto.randomBytes(32).toString('base64url');

	const csp = [
		`default-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
		`style-src 'self' 'unsafe-inline'`,
		`img-src 'self' blob: data:`,
		`font-src 'self'`,
		`object-src 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`frame-ancestors 'none'`,
		`connect-src 'self'`,
		allowInsecure ? '' : 'upgrade-insecure-requests',
	];

	const body = await renderToReadableStream(
		<NonceContext.Provider value={ nonce }>
			<ServerRouter
				context={ routerContext }
				url={ request.url }
				nonce={ nonce }
			/>
		</NonceContext.Provider>,
		{
			nonce,
			signal: AbortSignal.timeout(streamTimeout + 1000),
			onError(error: unknown) {
				responseStatusCode = 500;
				if (shellRendered) {
					console.error(error);
				}
			},
		},
	);

	shellRendered = true;

	if (routerContext.isSpaMode) {
		await body.allReady;
	}

	responseHeaders.set('Content-Type',              'text/html');
	responseHeaders.set('Content-Security-Policy',   csp.join('; '));
	responseHeaders.set('X-UA-Compatible',           'IE=Edge');
	responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains;');
	responseHeaders.set('X-Frame-Options',           'sameorigin');
	responseHeaders.set('X-XSS-Protection',          '0; mode=block');
	responseHeaders.set('X-Content-Type-Options',    'nosniff');
	responseHeaders.set('Referrer-Policy',           'strict-origin-when-cross-origin');
	responseHeaders.set('Feature-Policy',            "microphone 'none'; geolocation 'none'; camera 'none';");
	responseHeaders.set('Keep-Alive',                'timeout=5');
	responseHeaders.set('X-Powered-By',              'Your grandmother');

	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	});
}
