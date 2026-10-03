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
	Reorder,
} from 'motion/react';

import {
	Link,
} from 'react-router';

import Modal from '@/components/Modal';
import ImageInput from '@/components/ImageInput';
import CanvasManipulator from '@/utils/canvas-manipulator';
import Fetcher from '@/utils/fetcher';

import draggerIcon from '@/assets/img/dragger.svg';

import style from './page.module.css';


interface Project {
	id: UUID;
	comment: string;
	icon_filename: string;
	icon_size: {
		x: number;
		y: number;
	};
	hidden: boolean;
}

export default function Page()
{
	const [ creating, setCreating ] = useState(false);
	const inputPicture = useRef<HTMLInputElement>(null);

	const [ projects, setProjects ] = useState<Project[]>([]);
	const timer = useRef<NodeJS.Timeout>(null);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const response = await Fetcher.get<Project[]>('projects');

			if (!stop) {
				setProjects(response.body);
			}
		})();

		return () =>
		{
			stop = true;
		};
	}, [ ]);

	return (<>
		<h1>Portfolio</h1>
		<div>
			<button onClick={ () => setCreating(true) }>
				Create new
			</button>
		</div>

		<div>
			<Reorder.Group
				values={ projects }
				className={ style.container }

				onReorder={ newOrder =>
				{
					setProjects(newOrder);

					if (timer.current) {
						clearTimeout(timer.current);
					}

					timer.current = setTimeout(() =>
					{
						console.log(newOrder);
					}, 1000);
				} }
			>
				{ projects.map(project =>
				(
					<Reorder.Item
						key={ project.id }
						value={ project }
						className={ style.project }
						onDragStart={ (ev) => (ev.target as HTMLLIElement).style.cursor = 'grabbing' }
						onDragEnd={ (ev) => (ev.target as HTMLLIElement).style.cursor = 'drag' }
					>
						<div className={ style.borders }>
							<img
								src={ draggerIcon }
								width={ 38 }
								height={ 38 }
								alt=''
								draggable={ false }
							/>
						</div>
						<div className={ style.body }>
							<div className={ style.header }>
								<img
									src={ `/api/assets/${project.icon_filename}` }
									width={ 38 }
									height={ 38 }
									alt=''
									draggable={ false }
								/>
								<span className={ style.comment }>
									{ project.comment }
								</span>
							</div>
							<span>
								[ ] { project.hidden ? 'Hidden' : 'Public' }
							</span>
						</div>
						<div className={ style.borders }>
							<Link to={ `/dashboard/portfolio/${project.id}` }>
								Manage
							</Link>
						</div>
					</Reorder.Item>
				)) }
			</Reorder.Group>
		</div>

		{ creating &&
			<Modal
				onClose={ () => setCreating(false) }
			>
				<form
					onSubmit={ async (ev) =>
					{
						ev.preventDefault();

						if (!ev.currentTarget.checkValidity()) {
							ev.currentTarget.reportValidity();
							return;
						}

						const formData = new FormData(ev.currentTarget);
						const toSend = Object.fromEntries(formData);

						const response = await Fetcher.post('projects', toSend);

						console.log(response);
					} }
				>
					<h2>New Project</h2>
					<input type='hidden' name='icon' ref={ inputPicture }/>

					<label>
						<span>Comment</span>
						<br/>
						<input type='text' name='comment' required/>
					</label>

					<ImageInput
						onChange={ async (ev) =>
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

								const imgSmallData = await CanvasManipulator.processImage(file, {
									size: 48,
									axis: 'x',
									type: 'webp',
									quality: 0.75,
								});

								inputPicture.current!.value = imgSmallData;
							}

							img.addEventListener('load', onLoad);
						} }

						required
					/>

					<button>Create</button>
				</form>
			</Modal>
		}
	</>);
}
