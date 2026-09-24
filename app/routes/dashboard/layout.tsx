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
	useState,
} from 'react';

import {
	Links,
	Meta,
	NavLink,
	Outlet,
	Scripts,
	ScrollRestoration,
} from 'react-router';

import {
	NonceContext,
} from '../../contexts/nonce';

import {
	IdentityContext,
} from '@/contexts/identity';

import Fetcher from '@/utils/fetcher';

import './globals.css';


export default function Layout()
{
	const nonce = useContext(NonceContext);
	const [ identity, setIdentity ] = useState<Identity | null>(null);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const result = await Fetcher.get<Identity>('identity');

			if (!stop && result.status === 200) {
				setIdentity(result.body);
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

				<title>Dashboard</title>

				<Meta/>
				<Links nonce={ nonce }/>
			</head>
			<body>
				<header>
					<div>
						<NavLink to='/dashboard/admins'>Administration</NavLink>
						<NavLink to='/dashboard/blogs'>Blogs</NavLink>
						<NavLink to='/dashboard/portfolio'>Portfolio</NavLink>
						<NavLink to='/dashboard/illustrations'>Illustrations</NavLink>
					</div>
					<div>
						<span className='username'>{ identity?.username }</span>
						<NavLink to='/logout'>Log Out</NavLink>
					</div>
				</header>

				<main>
					<IdentityContext.Provider value={ identity }>
						<Outlet/>
					</IdentityContext.Provider>
				</main>

				<ScrollRestoration nonce={ nonce }/>
				<Scripts nonce={ nonce }/>
			</body>
		</html>
	);
}
