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
	useState,
} from 'react';

import {
	useImmer,
} from 'use-immer';

import type {
	Route,
} from './+types/index';

import Checkbox from '@/components/Checkbox';
import Modal from '@/components/Modal';
import Fetcher from '@/utils/fetcher';

import style from './page.module.css';

import plusIcon from '@/assets/img/plus.svg';


type BlogEntry = {
	id: number;
	comment: string;
	hidden: boolean;
};

export async function clientLoader()
{
	const response = await Fetcher.get<BlogEntry[]>('blogs');
	return response.body;
}

export function HydrateFallback()
{
	return (<>
		<h1>Blogs</h1>
		<p>Loading...</p>
	</>);
}

export default function Page({ loaderData }: Route.ComponentProps)
{
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ blogs, setBlogs ] = useImmer<BlogEntry[]>(loaderData);

	return (<>
		<h1>Blogs</h1>
		<div className={ style.container }>
			<button
				className={ style.blog }
				onClick={ () => setModalOpen(true) }
			>
				<img
					src={ plusIcon }
					width={ 50 }
					height={ 50 }
				/>
			</button>
			{ blogs.map((v) =>
			(
				<div
					key={ v.id }
					className={ style.blog }
				>
					<a href={ `/dashboard/blogs/${v.id}` }>
						{ v.comment }
					</a>
					<Checkbox
						defaultChecked={ !v.hidden }

						onChange={ async (ev) =>
						{
							const checked = ev.currentTarget.checked;

							const response = await Fetcher.patch<{ error: { message: string }, }>(`blogs/${ v.id }`, {
								hidden: !checked,
							});

							if (response.status === 200) {
								setBlogs(b =>
								{
									const blog = b.find(p => p.id === v.id);

									if (blog) {
										blog.hidden = !checked;
									}
								});
							} else {
								console.error(response.body.error.message);
							}
						} }
					/>
				</div>
			)) }
		</div>

		{ modalOpen &&
			<Modal onClose={ () => setModalOpen(false) }>
				<form
					className={ style.form }
					onSubmit={ async (ev) =>
					{
						ev.preventDefault();

						const form = ev.currentTarget;

						if (!form.checkValidity()) {
							form.reportValidity();
							return;
						}

						const formData = new FormData(form);
						const toSend = Object.fromEntries(formData);

						const response = await Fetcher.post<{
							error: { message: string },
							id: number,
						}>('blogs', toSend);

						if (response.status === 200) {
							setBlogs(b =>
							{
								b.push({
									id: response.body.id,
									comment: formData.get('comment') as string,
									hidden: true,
								});
							});
						} else {
							console.error(response.body.error.message);
						}

						setModalOpen(false);
					} }
				>
					<label>Comment</label><br/>
					<input type='text' name='comment' required/><br/>
					<button>
						Submit
					</button>
				</form>
			</Modal>
		}
	</>);
}
