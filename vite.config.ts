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

import {
	reactRouter,
} from '@react-router/dev/vite';

import {
	defineConfig,
	loadEnv,
} from 'vite';

import 'dotenv/config';


export default defineConfig(({ mode }) =>
{
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			reactRouter(),
		],
		server: {
			port: Number.parseInt(env.PORT ?? '3000'),
			host: true,
		},
		resolve: {
			tsconfigPaths: true,
		},
		define: {
			API_PREFIX: JSON.stringify(env.API_PREFIX),
		},
	};
});
