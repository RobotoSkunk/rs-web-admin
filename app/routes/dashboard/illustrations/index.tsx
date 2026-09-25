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
	Link,
} from 'react-router';

import Fetcher from '@/utils/fetcher';
import CanvasManipulator from '@/utils/canvas-manipulator';

import plusIcon from '@/assets/img/plus.svg';

import style from './page.module.css';

type Illustration = {
	id: string;
	filename: string;
	size: {
		x: number;
		y: number;
	};
	hidden: boolean;
};

const allowedTypes = [
	'image/png',
	'image/jpeg',
	'image/webp',
];

export default function Page()
{
	const [ list, setList ] = useState<Illustration[]>([]);

	const imgOriginal = useRef<HTMLImageElement>(null);
	const imgScaled = useRef<HTMLImageElement>(null);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const result = await Fetcher.get<Illustration[]>('illustrations/list');

			if (!stop && result.status === 200) {
				setList(result.body);
			}
		})();

		return () =>
		{
			stop = true;
		};
	}, [ ]);


	return (<>
		<section>
			<h1>Illustrations</h1>
			<div className={ style.container }>
				<Link to='new' className={ `${style.card} ${style.new}` }>
					<img
						src={ plusIcon }
						width={ 50 }
						height={ 50 }
					/>
				</Link>
				{ list.map((illustration, i) =>
				(
					<div className={ style.card } key={ i }>
						<img
							src={ `${API_PREFIX}/assets/${illustration.filename}` }
							width={ illustration.size.x }
							height={ illustration.size.y }
						/>
						<span>{ illustration.id }</span>
						<Link to={ illustration.id }>Manage</Link>
					</div>
				)) }
			</div>
		</section>
		<section>
			<h2>Publish</h2>
			<form
				onSubmit={ async (ev) =>
				{
					ev.preventDefault();


					const data = {
						picture: imgOriginal.current!.src,
						picture_small: imgScaled.current!.src,
					};

					await Fetcher.post('illustrations/upload', data);
				} }
			>
				<input type='file'
					onChange={ async (ev) =>
					{
						const files = ev.currentTarget.files;

						if (!files) {
							return;
						}

						const file = files[0]!;
						const fileUrl = URL.createObjectURL(file);

						const img = new Image();
						img.src = fileUrl;

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
								size: 350,
								axis: 'y',
								type: 'webp',
								quality: 0.75,
							});

							imgOriginal.current!.src = imgData;
							imgScaled.current!.src = imgSmallData;
						}

						img.addEventListener('load', onLoad);
					} }
				/>

				<div className={ style.row }>
					<div>
						<span>Original</span>
						<img ref={ imgOriginal }/>
					</div>
					<div>
						<span>Scaled (small)</span>
						<img ref={ imgScaled }/>
					</div>
				</div>

				<button>
					Submit
				</button>
			</form>
		</section>
	</>);
}
