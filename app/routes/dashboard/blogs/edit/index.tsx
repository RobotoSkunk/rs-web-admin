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
	useImmer,
} from 'use-immer';

import {
	useNavigate,
} from 'react-router';

import {
	motion,
} from 'motion/react';

import {
	langOptions,
} from '@/utils/common';

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
import Modal from '@/components/Modal';
import ImageInput from '@/components/ImageInput';
import CanvasManipulator from '@/utils/canvas-manipulator';

import style from './page.module.css';

import clockIcon from '@/assets/img/clock.svg';
import plusIcon from '@/assets/img/plus.svg';


type Blog = {
	id: number;
	comment: string;
	hidden: boolean;
	tags: {
		id: number;
		comment: string;
	}[];
};

type Point = {
	x: number;
	y: number;
};

type BlogContent = {
	id: number;
	lang: string;
	title: string;
	description: string;
	content: string;
	hidden: boolean;
	created_at: Date | null;
	updated_at: Date | null;
	thumbnail: {
		filename: string | null;
		size: Point | null;
	};
	pictures: {
		id: number;
		alt: string;
		picture: {
			filename: string;
			size: Point;
		};
	}[];
}

type BlogContentPartial = Partial<{
	title: string;
    description: string;
    content: string;
}>;

export async function clientLoader({ params }: Route.LoaderArgs)
{
	const blogResponse = await Fetcher.get<Blog>(`blogs/${params.id}`);

	if (blogResponse.status !== 200) {
		return null;
	}

	return blogResponse.body;
}

export function HydrateFallback()
{
	return (<>
		<h1>Loading...</h1>
	</>);
}

export default function Page({ params, loaderData }: Route.ComponentProps)
{
	const navigator = useNavigate();

	if (!loaderData) {
		navigator('/dashboard/blogs');
		return;
	}

	const [ blogData, setBlogData ] = useImmer(loaderData);
	const [ contentsData, setContentsData ] = useImmer<BlogContent[]>([]);
	const [ currentLang, setCurrentLang ] = useImmer<string>(langOptions[0]!.value);
	const [ previewText, setPreviewText ] = useState('');

	const [ pendingOperations, setPendingOperations ] = useImmer<BlogContentPartial>({});
	const [ savingChanges, setSavingChanges ] = useState(false);
	const saveTimeout = useRef<NodeJS.Timeout>(null);
	
	const [ addingPicture, setAddingPicture ] = useState(false);
	const inputPicture = useRef<HTMLInputElement>(null);
	const inputPictureSmall = useRef<HTMLInputElement>(null);

	function currentContext()
	{
		const index = contentsData.findIndex(c => c.lang === currentLang);

		if (index < 0) {
			return null;
		}

		return contentsData[index];
	}

	function saveDraft(operations: BlogContentPartial)
	{
		const context = currentContext();
		if (!context) {
			return;
		}

		if (saveTimeout.current !== null) {
			clearTimeout(saveTimeout.current);
		}

		const currentOperations = {
			...pendingOperations,
			...operations,
		};

		setSavingChanges(true);
		setPendingOperations(currentOperations);

		saveTimeout.current = setTimeout(async () =>
		{
			const response = await Fetcher.patch(`/blogs/content/${context.id}/draft`, currentOperations);

			if (response.status === 200) {
				setPendingOperations({});
				setContentsData(contents =>
				{
					const data = contents.find(c => c.lang === currentLang);

					if (data) {
						for (const [ key, value ] of Object.entries(currentOperations)) {
							// @ts-ignore Keys are never different from data's keys.
							data[key] = value;
						}
					}
				});
			} else {
				console.error(response.body);
			}

			setSavingChanges(false);
		}, 2000);
	}

	useEffect(() =>
	{
		let stop = false;

		const index = contentsData.findIndex(c => c.lang === currentLang);

		if (index >= 0) {
			const content = contentsData[index].content;
			setPreviewText(content);
		} else {
			(async (currentLang) =>
			{
				const response = await Fetcher.get<BlogContent>(`blogs/${params.id}/content/${currentLang}`);
				if (stop) {
					return;
				}

				if (response.status !== 200) { // Create a new blog content entry if it doesn't exist
					const postResponse = await Fetcher.post<{ id: number }>(`blogs/${params.id}/content/${currentLang}`, { });

					if (postResponse.status !== 200) {
						console.error(postResponse);
						throw new Error('Something really REALLY wrong happened when trying to create the new blog content entry.');
					}

					setContentsData(data =>
					{
						data.push({
							id: postResponse.body.id,
							lang: currentLang,
							title: '',
							content: '',
							description: '',
							pictures: [],
							thumbnail: {
								filename: null,
								size: null,
							},
							hidden: true,
							created_at: null,
							updated_at: null,
						});
					});

					setPreviewText('');

				} else {
					setContentsData(data =>
					{
						data.push(response.body);
					});

					setPreviewText(response.body.content);
				}
			})(currentLang);
		}


		return () =>
		{
			stop = true;
		};
	}, [ currentLang ]);

	return (<>
		<h1>Blog</h1>
		<section>
			<div>
				<label>Comment:</label>
				<input type='text' defaultValue={ blogData.comment }/>
			</div>
			<div>
				<Checkbox defaultChecked={ !blogData.hidden }>
					Public
				</Checkbox>
			</div>
		</section>
		<section>
			<div className={ style.languages }>
				{ langOptions.map((lang, i) =>
				(
					<button
						key={ i }
						onClick={ () => setCurrentLang(lang.value) }
					>
						{ lang.label }
						{ currentLang === lang.value &&
							<motion.div
								className={ style.indicator }

								layoutId='indicator'
								layout
							/>
						}
					</button>
				)) }
			</div>

			<div className={ style.indicators }>
				<img
					src={ clockIcon }
					width={ 22 }
					height={ 22 }
				/>
				<span>
					{ savingChanges ? 'Saving...' : 'Saved' }
				</span>
			</div>

			{ currentContext() !== null && <>
				<input
					key={ `${currentLang}-title` }
					type='text'
					className={ style.title }
					defaultValue={ currentContext()!.title }
					onChange={ (ev) => saveDraft({ title: ev.currentTarget.value }) }
				/>
				<textarea
					key={ `${currentLang}-description` }
					rows={ 2 }
					className={ style.description }
					defaultValue={ currentContext()!.description }
					onChange={ (ev) => saveDraft({ description: ev.currentTarget.value }) }
				/>

				<div className={ style['content-container'] }>
					<div className={ style.column }>
						<div className={ style.header }>
							Markdown
						</div>
						<textarea
							key={ `${currentLang}-content` }
							defaultValue={ currentContext()!.content }
							onChange={ (ev) =>
							{
								const value = ev.currentTarget.value;
								setPreviewText(value);

								saveDraft({ content: value });
							} }
						/>
					</div>
					<div className={ style.column }>
						<div className={ style.header }>
							Preview
						</div>
						<div className={ style.preview }>
							<Markdown
								remarkPlugins={[ remarkGfm ]}
								components={{
									a(props) {
										const { node, target, rel, ...rest } = props;
										return <a target='_blank' rel='noreferrer noopener' { ...rest }/>;
									},
									img(props) {
										const { src, width, height, ...rest } = props;

										if (src) {
											if (src?.startsWith('$')) {
												const index = Number.parseInt(src.replace('$', ''));
												const pictureData = currentContext()!.pictures[index];

												if (pictureData) {
													return (
														<img
															src={ `/api/assets/${pictureData.picture.filename}` }
															width={ pictureData.picture.size.x }
															height={ pictureData.picture.size.y }
															{ ...rest }
														/>
													);
												}
											}
										}

										return <img {...props}/>;
									}
								}}
							>
								{ previewText }
							</Markdown>
						</div>
					</div>
				</div>

				<div className={ style.pictures }>
					{ currentContext()!.pictures.map((data, i) =>
					(
						<div className={ style.picture }>
							<img
								src={ `/api/assets/${data.picture.filename}` }
								width={ data.picture.size.x }
								height={ data.picture.size.y }
							/>
							<input type='text' defaultValue={ data.alt }/>
							<div className={ style.index }>
								<span>
									[ { i } ]
								</span>
							</div>
							<div className={ style.controls }>
								<button>Save</button>
								<button>Delete</button>
							</div>
						</div>
					)) }

					<button
						className={ style.create }
						onClick={ () => setAddingPicture(true) }
					>
						<img
							src={ plusIcon }
							width={ 50 }
							height={ 50 }
						/>
					</button>
				</div>
			</> }
		</section>

		{ addingPicture && currentContext() !== null &&
			<Modal
				onClose={ () => setAddingPicture(false) }
			>
				<form
					onSubmit={ async (ev) =>
					{
						ev.preventDefault();

						const form = ev.currentTarget;

						if (!form.checkValidity()) {
							form.reportValidity();
							return;
						}

						const formData = new FormData(ev.currentTarget);
						const toSend = Object.fromEntries(formData);

						const context = currentContext()!;

						const response = await Fetcher.post<{
							id: number;
							filename: string;
							size: Point;
						}>(`/blogs/content/${context.id}/picture`, toSend);

						if (response.status === 200) {
							setContentsData(contents =>
							{
								const data = contents.find(c => c.id === context.id);

								if (data) {
									data.pictures.push({
										id: response.body.id,
										picture: {
											filename: response.body.filename,
											size: response.body.size,
										},
										alt: formData.get('alt') as string,
									});
								}
							});

							setAddingPicture(false);
						}
					} }
				>
					<ImageInput
						required
						onChange={ (ev) =>
						{
							if (!ev.currentTarget.files) {
								return;
							}

							const file = ev.currentTarget.files[0]!;
							const fileUrl = URL.createObjectURL(file);

							const img = new Image();
							img.src = fileUrl;

							async function onLoad()
							{
								img.removeEventListener('load', onLoad);
								const target = 450;

								const canvasOriginal = document.createElement('canvas');
								canvasOriginal.width = img.width;
								canvasOriginal.height = img.height;

								const context = canvasOriginal.getContext('2d')!;
								context.drawImage(img, 0, 0);

								const imgData = canvasOriginal.toDataURL();
								inputPicture.current!.value = imgData;

								if (img.height > target) {
									const imgSmallData = await CanvasManipulator.processImage(file, {
										size: target,
										axis: 'y',
										type: 'webp',
										quality: 0.75,
									});

									inputPictureSmall.current!.value = imgSmallData;
								} else {
									inputPictureSmall.current!.value = imgData;
								}
							}

							img.addEventListener('load', onLoad);
						} }
					/>

					<input type='hidden' name='picture' ref={ inputPicture }/>
					<input type='hidden' name='picture_small' ref={ inputPictureSmall }/>
					<input type='text' name='alt' required/>

					<button>Create</button>
				</form>
			</Modal>
		}
	</>);
}
