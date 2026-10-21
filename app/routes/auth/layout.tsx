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
	useContext,
	useEffect,
} from 'react';

import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigate,
} from 'react-router';

import {
	NonceContext,
} from '../../contexts/nonce';

import style from './auth.module.css';
import Fetcher from '@/utils/fetcher';


export default function Layout()
{
	const navigator = useNavigate();

	const nonce = useContext(NonceContext);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const result = await Fetcher.get<Identity>('identity');

			if (!stop && result.status === 200) {
				await navigator('/dashboard');
			}
		})();

		return () =>
		{
			stop = true;
		};
	}, [ ]);

	return (
		<html lang='en'>
			<head>
				<meta charSet='utf-8'/>
				<meta name='viewport' content='width=device-width, initial-scale=1'/>

				<title>RobotoSkunk's Admin Panel</title>

				<Meta/>
				<Links nonce={ nonce }/>
			</head>
			<body className={ style.body }>
				<Outlet/>
				<ScrollRestoration nonce={ nonce }/>
				<Scripts nonce={ nonce }/>
			</body>
		</html>
	);
}
