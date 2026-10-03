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
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from '@react-router/dev/routes';

export default [
	layout('routes/auth/layout.tsx', [
		index('routes/auth/login.tsx'),
	]),
	...prefix('/dashboard', [
		layout('routes/dashboard/layout.tsx', [
			route('/', 'routes/dashboard/home.tsx'),
			route('portfolio', 'routes/dashboard/portfolio/index.tsx'),
			route('portfolio/:id', 'routes/dashboard/portfolio/edit/index.tsx'),
			route('illustrations', 'routes/dashboard/illustrations/index.tsx'),
			route('illustrations/:id', 'routes/dashboard/illustrations/edit/index.tsx'),
		]),
	]),
] satisfies RouteConfig;
