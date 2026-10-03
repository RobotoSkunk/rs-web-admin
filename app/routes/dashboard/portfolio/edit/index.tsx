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

import type {
	Route,
} from './+types/index';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Fetcher from '@/utils/fetcher';
import Checkbox from '@/components/Checkbox';

import style from './page.module.css';


type Project = {
	comment: string;
	hidden: boolean;
	icon: {
		filename: string;
		size: {
			x: number;
			y: number;
		};
	};
	pictures: {
		id: string;
		picture: {
			filename: string;
			size: {
				x: number;
				y: number;
			};
		};
	}[];
	contents: {
		lang: string;
		name: string;
		description: string;
	}[];
};

export default function Page({ params }: Route.LoaderArgs)
{
	const [ data, setData ] = useState<Project | null>(null);
	const [ creatingContent, setCreatingContent ] = useState(false);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const response = await Fetcher.get<Project>(`projects/${params.id}`);

			if (!stop) {
				setData(response.body);
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


	function ContentRow({
		contentId,
		lang,
		name,
		description,
		mode,
	}: {
		contentId?: string;
		lang?: string;
		name?: string;
		description?: string;
		mode: 'editing' | 'creating';
	})
	{
		const id = crypto.randomUUID();

		const [ editing, setEditing ] = useState(false);
		const [ preview, setPreview ] = useState('');

		const formRef = useRef<HTMLFormElement>(null);

		return (
			<form
				className={ style.row }
				ref={ formRef }
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
							name='name'
							defaultValue={ name }
							onInput={ () => setEditing(true) }
						/>
					</div>
				</div>

				<div className={ style.body }>
					<label htmlFor={ `desc-${id}` }>Description</label>
					<textarea
						id={ `desc-${id}` }
						name='description'
						defaultValue={ description }
						onInput={ (ev) =>
						{
							setEditing(true);
							setPreview(ev.currentTarget.value);
						} }
					/>
					<br/>
					{ editing && <>
						<span>Preview</span>
						<Markdown
							remarkPlugins={[ remarkGfm ]}
							components={{
								a(props) {
									const { node, target, rel, ...rest } = props;
									return <a target='_blank' rel='noreferrer noopener' { ...rest }/>;
								},
							}}
						>
							{ preview }
						</Markdown>
					</> }
				</div>

				<div className={ style.footer }>
					{ mode === 'editing' && <>
						<button
							role='button'
						>
							Delete
						</button>
					</> }
					{ mode === 'editing' && editing && <>
						<button>Update</button>
					</> }
					{ mode === 'creating' && <>
						<button role='button' onClick={ () => setCreatingContent(false) }>Cancel</button>
						<button>Upload</button>
					</> }
				</div>
			</form>
		);
	}


	return (<>
		<h1>Project { data.comment }</h1>

		<div className={ style.container }>
			<div className={ style.info }>
				<img
					src={ `/api/assets/${data.icon.filename}` }
					width={ data.icon.size.x }
					height={ data.icon.size.y }
				/>

				<label>
					<span>Comment: </span>
					<input type='text' defaultValue={ data.comment }/>
				</label>

				<Checkbox defaultChecked={ !data.hidden }>Public</Checkbox>
			</div>

			<section>
				<h2>Contents</h2>

				{ creatingContent &&
					<div className={ style.contents }>
						<ContentRow mode='creating'/>
					</div>
				}
				{ !creatingContent &&
					<button onClick={ () => setCreatingContent(true) }>
						Create
					</button>
				}
			</section>

			<section>
				<h2>Pictures</h2>
			</section>
		</div>
	</>);
}
