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

import {
	Reorder,
} from 'motion/react';

import {
	useNavigate,
} from 'react-router';

import type {
	Route,
} from './+types/index';

import {
	langOptions,
} from '@/utils/common';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Fetcher from '@/utils/fetcher';
import Checkbox from '@/components/Checkbox';
import CanvasManipulator from '@/utils/canvas-manipulator';

import draggerIcon from '@/assets/img/dragger.svg';
import plusIcon from '@/assets/img/plus.svg';

import style from './page.module.css';

type Picture = {
	id: string;
	picture: {
		filename: string;
		size: {
			x: number;
			y: number;
		};
	};
	alts: {
		id: UUID;
		lang: string;
		content: string;
	}[];
};

type ProjectContent = {
	id: UUID;
	lang: string;
	name: string;
	description: string;
};

type ProjectData = {
	comment: string;
	hidden: boolean;
	icon: {
		filename: string;
		size: {
			x: number;
			y: number;
		};
	};
};

type Project = ProjectData & {
	pictures: Picture[];
	contents: ProjectContent[];
};

type PictureInput = {
	picture: string,
	picture_small: string,
};

async function loadImage(file: File)
{
	return new Promise<string[]>((resolve) =>
	{
		const img = new Image();
		img.src = URL.createObjectURL(file);

		async function onLoad()
		{
			img.removeEventListener('load', onLoad);

			const canvasOriginal = document.createElement('canvas');
			canvasOriginal.width = img.width;
			canvasOriginal.height = img.height;

			const context = canvasOriginal.getContext('2d')!;
			context.drawImage(img, 0, 0);

			const imgData = canvasOriginal.toDataURL();
			const imgSmallData = await CanvasManipulator.processImage(file, {
				size: 250,
				axis: 'y',
				type: 'webp',
				quality: 0.75,
			});

			resolve([
				imgData,
				imgSmallData,
			]);
		}

		img.addEventListener('load', onLoad);
	});
}

export default function Page({ params }: Route.LoaderArgs)
{
	const navigator = useNavigate();

	const [ data, setData ] = useImmer<ProjectData | null>(null);
	const [ pictures, setPictures ] = useImmer<Picture[]>([]);
	const [ contents, setContents ] = useImmer<ProjectContent[]>([]);
	
	const [ creatingContent, setCreatingContent ] = useState(false);
	const [ creatingPicture, setCreatingPicture ] = useState(false);

	const [ picturesToSend, setPicturesToSend ] = useState<PictureInput[]>([]);

	const reorderTimer = useRef<NodeJS.Timeout>(null);
	const commentTimer = useRef<NodeJS.Timeout>(null);


	function setProjectData(data: Project)
	{
		const { pictures, contents, ...rest } = data;

		setData(rest);
		setContents(contents);
		setPictures(pictures);
	}


	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const response = await Fetcher.get<Project>(`projects/${params.id}`);

			if (!stop) {
				setProjectData(response.body);
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
		contentData,
		mode,
	}: {
		contentData?: ProjectContent;
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
							`projects/${params.id}/content`,
							Object.fromEntries(formData)
						);

						if (response.status === 200) {
							setContents(content =>
							{
								if (!content) {
									return;
								}

								content.push({
									id: response.body.id,
									lang: formData.get('lang') as string,
									name: formData.get('name') as string,
									description: formData.get('description') as string,
								});
							});

							setCreatingContent(false);
						}
					} else {
						const response = await Fetcher.patch(`projects/content/${contentData?.id}`, Object.fromEntries(formData));

						if (response.status === 200) {
							setContents(content =>
							{
								if (!content) {
									return;
								}

								content = [
									...content.filter(c => c.id !== contentData?.id),
									{
										id: contentData?.id as UUID,
										lang: formData.get('lang') as string,
										name: formData.get('name') as string,
										description: formData.get('description') as string,
									},
								];
							});

							setEditing(false);
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
							defaultValue={ contentData?.lang }
							onChange={ () => setEditing(true) }
						>
							{ mode === 'creating' && 
								langOptions
									.filter(lang => contents.findIndex(c => c.lang == lang.value) == -1)
									.map((option, i) => (
										<option
											key={ i }
											value={ option.value }
										>
											{ option.label }
										</option>
									))
							}
							{ mode === 'editing' && 
								langOptions
									.map((option, i) => (
										<option
											key={ i }
											value={ option.value }
										>
											{ option.label }
										</option>
									))
							}
						</select>
					</div>

					<div className={ style.name }>
						<label htmlFor={ `name-${id}` }>Name</label>
						<input
							type='text'
							id={ `name-${id}` }
							name='name'
							defaultValue={ contentData?.name }
							onInput={ () => setEditing(true) }
						/>
					</div>
				</div>

				<div className={ style.body }>
					<label htmlFor={ `desc-${id}` }>Description</label>
					<textarea
						id={ `desc-${id}` }
						name='description'
						defaultValue={ contentData?.description }
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
							onClick={ async (ev) =>
							{
								ev.preventDefault();
								await Fetcher.delete(`projects/content/${contentData?.id}`);

								setContents(contents.filter(c => c.id !== contentData?.id));
							} }
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

	function PictureRow({
		picData,
	}: {
		picData: Picture;
	})
	{
		const [ addingAlt, setAddingAlt ] = useState(false);

		return (<>
			<div className={ style.centered }>
				<img
					src={ draggerIcon }
					width={ 38 }
					height={ 38 }
					alt=''
					draggable={ false }
				/>
			</div>
			<div className={ style.centered }>
				<img
					src={ `/api/assets/${picData.picture.filename}` }
					width={ picData.picture.size.x }
					height={ picData.picture.size.y }
					alt=''
					draggable={ false }
				/>
				<div className={ style.controls }>
					{/* <button>Change Picture</button> */}
					<button
						onClick={ async (ev) =>
						{
							ev.preventDefault();

							const answer = confirm('Are you sure you want to delete this ALT?');

							if (!answer) {
								return;
							}

							const response = await Fetcher.delete<{
								success: boolean;
							}>(`projects/picture/${picData.id}`);

							if (response.status === 200) {
								setPictures(pictures.filter(pic => pic.id !== picData.id));
							}
						}}
					>
						Delete
					</button>
				</div>
			</div>
			<div className={ style.rows }>
				{ picData.alts.map((alt, i) =>
				(
					<form
						key={ i }
						className={ style['alt-row'] }
						
						onSubmit={ async (ev) =>
						{
							ev.preventDefault();

							if (!ev.currentTarget.checkValidity()) {
								ev.currentTarget.reportValidity();
								return;
							}

							const formData = new FormData(ev.currentTarget);
							const toSend = Object.fromEntries(formData);

							const response = await Fetcher.patch(`projects/picture/alt/${alt.id}`, toSend);

							if (response.status === 200) {
								setPictures(pictures =>
								{
									const picture = pictures.find(pic => pic.id === picData.id);

									if (picture) {
										const _alt = picture.alts.find(a => a.id === alt.id);

										if (_alt) {
											_alt.lang = formData.get('lang') as string;
											_alt.content = formData.get('content') as string;
										}
									}
								});
							}
						} }
					>
						<div className={ style.inputs }>
							<div>
								<label>Lang</label>
								<select name='lang' defaultValue={ alt.lang } required>
									{ langOptions.map((option, i) => (
										<option
											key={ i }
											value={ option.value }
										>
											{ option.label }
										</option>
									)) }
								</select>
							</div>
							<div className={ style.name }>
								<label>Alt</label>
								<input
									type='text'
									name='content'
									defaultValue={ alt.content }
									required
								/>
							</div>
						</div>
						<div className={ style.inputs }>
							<button>Update</button>
							<button
								role='button'
								onClick={ async (ev) =>
								{
									ev.preventDefault();

									const answer = confirm('Are you sure you want to delete this ALT?');

									if (!answer) {
										return;
									}

									const response = await Fetcher.delete<{
										success: boolean;
									}>(`projects/picture/alt/${alt.id}`);

									if (response.status === 200) {
										setPictures(pictures =>
										{
											const picture = pictures.find(pic => pic.id === picData.id);

											if (picture) {
												const newList = picture.alts.filter(a => a.id !== alt.id);
												picture.alts = newList;
											}
										});
									}
								}}
							>
								Delete
							</button>
						</div>
					</form>
				)) }
				{ addingAlt &&
					<form
						className={ style['alt-row'] }

						onSubmit={ async (ev) =>
						{
							ev.preventDefault();

							if (!ev.currentTarget.checkValidity()) {
								ev.currentTarget.reportValidity();
								return;
							}

							const formData = new FormData(ev.currentTarget);
							const toSend = Object.fromEntries(formData);

							const response = await Fetcher.post<{
								error?: string;
								id: string;
							}>(`projects/picture/${picData.id}/alt`, toSend);

							if (response.status === 200) {
								setPictures(pictures =>
								{
									const picture = pictures.find(pic => pic.id === picData.id);

									if (picture) {
										picture.alts.push({
											id: response.body.id as UUID,
											lang: formData.get('lang') as string,
											content: formData.get('content') as string,
										});
									}
								});
							}
						} }
					>
						<div className={ style.inputs }>
							<div>
								<label>Lang</label>
								<select name='lang' required>
									{ langOptions
										.filter(lang => picData.alts.findIndex(p => p.lang == lang.value) == -1)
										.map((option, i) => (
											<option
												key={ i }
												value={ option.value }
											>
												{ option.label }
											</option>
										))
									}
								</select>
							</div>
							<div className={ style.name }>
								<label>Alt</label>
								<input
									type='text'
									name='content'
									required
								/>
							</div>
						</div>
						<div className={ style.inputs }>
							<button>Add</button>
							<button role='button' onClick={ () => setAddingAlt(false) }>
								Cancel
							</button>
						</div>
					</form>
				}
				{ !addingAlt && picData.alts.length !== langOptions.length &&
					<button className={ style['alt-row'] + ' ' + style.new } onClick={ () => setAddingAlt(true) }>
						<img
							src={ plusIcon }
							width={ 30 }
							height={ 30 }
							alt='Add new alt'
						/>
					</button>
				}
			</div>
		</>);
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
					<input
						type='text'
						defaultValue={ data.comment }

						onInput={ (ev) => {
							if (commentTimer.current) {
								clearTimeout(commentTimer.current);
							}

							let comment = ev.currentTarget.value;

							commentTimer.current = setTimeout(async () =>
							{
								await Fetcher.patch<Project>(`projects/${params.id}`, {
									comment,
								});
							}, 250);
						} }
					/>
				</label>

				<Checkbox
					defaultChecked={ !data.hidden }
					onChange={ async (ev) =>
					{
						await Fetcher.patch<Project>(`projects/${params.id}`, {
							hidden: !ev.currentTarget.checked,
						});
					} }
				>
					Public
				</Checkbox>

				<button
					onClick={ async () =>
					{
						const answer = confirm('Are you sure you want to delete this project?');

						if (answer) {
							await Fetcher.delete<Project>(`projects/${params.id}`);
							await navigator('/dashboard/portfolio');
						}
					} }
				>
					Delete
				</button>
			</div>

			<section>
				<h2>Contents</h2>

				<div className={ style.contents }>
					{ contents.map((content, i) =>
					(
						<ContentRow
							key={ i }
							mode='editing'
							contentData={ content }
						/>
					)) }

					{ creatingContent &&
						<ContentRow mode='creating'/>
					}
				</div>
				{ !creatingContent && contents.length !== langOptions.length &&
					<button onClick={ () => setCreatingContent(true) }>
						Create
					</button>
				}
			</section>

			<section>
				<h2>Pictures</h2>

				<Reorder.Group
					values={ pictures }
					className={ style.contents + ' ' + style.pictures }

					onReorder={ newOrder =>
					{
						setPictures(newOrder);

						if (reorderTimer.current) {
							clearTimeout(reorderTimer.current);
						}

						reorderTimer.current = setTimeout(async () =>
						{
							const list: string[] = [];

							for (const picture of newOrder) {
								list.push(picture.id);
							}

							await Fetcher.post('projects/picture/order', list);
						}, 1000);
					} }
				>
					{ pictures.map((picData) =>
					(
						<Reorder.Item
							key={ picData.id }
							value={ picData }

							className={ style.picture }
							onDragStart={ (ev) => (ev.target as HTMLLIElement).style.cursor = 'grabbing' }
							onDragEnd={ (ev) => (ev.target as HTMLLIElement).style.cursor = 'grab' }
						>
							<PictureRow
								picData={ picData }
							/>
						</Reorder.Item>
					)) }
				</Reorder.Group>

				{ creatingPicture && <>
					<form
						onSubmit={ async (ev) =>
						{
							ev.preventDefault();

							if (!ev.currentTarget.checkValidity()) {
								ev.currentTarget.reportValidity();
								return;
							}

							try {
								for (const chunk of picturesToSend) {
									const responsePost = await Fetcher.post(`projects/${params.id}/picture`, chunk);

									if (responsePost.status !== 200) {
										console.error(responsePost);
										throw new Error('Something went wrong when trying to upload a picture.');
									}
								}
							} catch (e) {
								console.error(e);
							} finally {
								const responseGet = await Fetcher.get<Project>(`projects/${params.id}`);
								setProjectData(responseGet.body);

								setCreatingPicture(false);
							}
						} }
					>
						<input
							type='file'
							accept='image/png, image/jpeg, image/webp'
							required
							multiple

							onChange={ async (ev) =>
							{
								if (!ev.currentTarget.files) {
									return;
								}

								const files = ev.currentTarget.files;

								let dataToSet: PictureInput[] = [];

								for (const file of files) {
									const result = await loadImage(file);
									dataToSet.push({
										picture: result[0],
										picture_small: result[1],
									});
								}

								setPicturesToSend(dataToSet);
							} }
						/>

						{ picturesToSend.length > 0 &&
							<button>
								Upload
							</button>
						}
					</form>

					<button onClick={ () => setCreatingPicture(false) }>
						Cancel
					</button>
				</> }
				{ !creatingPicture &&
					<button onClick={ () => {
						setCreatingPicture(true);
						setPicturesToSend([]);
					} }>
						Create
					</button>
				}
			</section>
		</div>
	</>);
}
