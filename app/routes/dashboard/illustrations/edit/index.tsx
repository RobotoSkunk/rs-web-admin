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
	useEffect,
	useRef,
	useState,
} from 'react';

import {
	useImmer,
} from 'use-immer';

import type {
	Route,
} from './+types/index';

import Fetcher from '@/utils/fetcher';

import style from './page.module.css';

type Alt = {
	id: UUID;
	lang: string;
	content: string;
	description: string;
};

type Illustration = {
	id: UUID;
	filename: string;
	filename_small: string;
	size: {
		x: number;
		y: number;
	};
	uploaded_at: string;
	created_at: string;
	hidden: boolean;
	alts: Alt[];
};

export default function Page({ params }: Route.LoaderArgs)
{
	const [ creating, setCreating ] = useState(false);
	const [ data, setData ] = useImmer<Illustration | null>(null);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const result = await Fetcher.get<Illustration>(`illustrations/${params.id}`);

			if (!stop && result.status === 200) {
				setData(result.body);
			}
		})();

		return () =>
		{
			stop = true;
		};
	}, [ ]);


	if (!data) {
		return (
			<h1>Loading...</h1>
		);
	}


	function DescriptionRow({
		altId,
		lang,
		name,
		description,
		mode,
	}: {
		altId?: string;
		lang?: string;
		name?: string;
		description?: string;
		mode: 'editing' | 'creating';
	})
	{
		const id = crypto.randomUUID();
		const [ editing, setEditing ] = useState(false);
		const formRef = useRef<HTMLFormElement>(null);

		return (
			<form
				className={ style.row }
				ref={ formRef }

				onSubmit={ async (ev) =>
				{
					ev.preventDefault();
					const form = ev.currentTarget;

					if (!form.checkValidity()) {
						form.reportValidity();
						return;
					}

					const formData = new FormData(form);

					if (mode === 'creating') {
						const response = await Fetcher.post<{
							id: UUID
						}>(
							`illustrations/${params.id}/alt`,
							Object.fromEntries(formData)
						);

						if (response.status === 200) {
							setData(data =>
							{
								if (!data) {
									return;
								}

								data.alts = [
									...data.alts,
									{
										id: response.body.id,
										lang: formData.get('lang') as string,
										content: formData.get('content') as string,
										description: formData.get('description') as string,
									}
								];
							});

							setCreating(false);
						}
					} else {
						const response = await Fetcher.put(`illustrations/alt/${altId}`, Object.fromEntries(formData));

						if (response.status === 200) {
							setData(data =>
							{
								if (!data) {
									return;
								}

								data.alts = [
									...data.alts.filter(a => a.id !== altId),
									{
										id: altId as UUID,
										lang: formData.get('lang') as string,
										content: formData.get('content') as string,
										description: formData.get('description') as string,
									}
								];
							});

							setCreating(false);
						}
					}
				} }
			>
				<div className={ style.header }>
					<div>
						<label htmlFor={ `lang-${id}` }>Lang</label>
						<select
							id={ `lang-${id}` }
							name='lang'
							defaultValue={ lang }
							onChange={ () => setEditing(true) }
						>
							<option value='en-US'>en-US</option>
							<option value='es-MX'>es-MX</option>
						</select>
					</div>

					<div>
						<label htmlFor={ `name-${id}` }>Name</label>
						<input
							type='text'
							id={ `name-${id}` }
							name='content'
							defaultValue={ name }
							onInput={ () => setEditing(true) }
						/>
					</div>
				</div>

				<div className={ style.body }>
					<label htmlFor={ `desc-${id}` }>Description (alt)</label>
					<textarea
						id={ `desc-${id}` }
						name='description'
						defaultValue={ description }
						onInput={ () => setEditing(true) }
					/>
				</div>

				<div className={ style.footer }>
					{ mode === 'editing' && <>
						<button
							role='button'
							onClick={ async (ev) =>
							{
								ev.preventDefault();
								await Fetcher.delete(`illustrations/alt/${altId}`);

								setData(data =>
								{
									if (!data) {
										return;
									}

									data.alts = data.alts.filter(a => a.id !== altId);
								});
							} }
						>
							Delete
						</button>
					</> }
					{ mode === 'editing' && editing && <>
						<button>Update</button>
					</> }
					{ mode === 'creating' && <>
						<button role='button' onClick={ () => setCreating(false) }>Cancel</button>
						<button>Upload</button>
					</> }
				</div>
			</form>
		);
	}


	return (<>
		<h1>Illustration ({ params.id })</h1>
		<div className={ style.container }>
			<div className={ style.info }>
				<img
					src={ `${API_PREFIX}/assets/${data.filename_small}` }
					width={ data.size.x }
					height={ data.size.y }
				/>
				<a href={ `${API_PREFIX}/assets/${data.filename_small}` } target='_blank'>Scaled Image</a>
				<a href={ `${API_PREFIX}/assets/${data.filename}` } target='_blank'>Original Image</a>
				<span>Created At: { data.created_at }</span>
				<span>Uploaded At: { data.uploaded_at }</span>
				<span>Hidden: { data.hidden ? 'true' : 'false' }</span>
			</div>
			<div className={ style.alts }>
				{ data.alts.map((alt, i) =>
				(
					<DescriptionRow
						key={ i }
						mode='editing'
						altId={ alt.id }
						lang={ alt.lang }
						name={ alt.content }
						description={ alt.description }
					/>
				)) }

				{ !creating &&
					<button onClick={ () => setCreating(true) }>
						Add
					</button>
				}
				{ creating &&
					<DescriptionRow
						mode='creating'
					/>
				}
			</div>
		</div>
	</>);
}
