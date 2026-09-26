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

import {
	useImmer,
} from 'use-immer';

import Fetcher from '@/utils/fetcher';
import CanvasManipulator from '@/utils/canvas-manipulator';

import plusIcon from '@/assets/img/plus.svg';

import ImageInput from '@/components/ImageInput';
import Modal from '@/components/Modal';
import Checkbox from '@/components/Checkbox';

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

export default function Page()
{
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ list, setList ] = useImmer<Illustration[]>([]);

	const inputPicture = useRef<HTMLInputElement>(null);
	const inputPictureSmall = useRef<HTMLInputElement>(null);

	useEffect(() =>
	{
		let stop = false;

		(async () =>
		{
			const result = await Fetcher.get<Illustration[]>('illustrations');

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
		<h1>Illustrations</h1>
		<div className={ style.container }>
			<button
				className={ `${style.card} ${style.new}` }
				onClick={ () => setModalOpen(true) }
			>
				<img
					src={ plusIcon }
					width={ 50 }
					height={ 50 }
				/>
			</button>
			{ list.map((illustration, i) =>
			(
				<div className={ style.card } key={ i }>
					<img
						src={ `${API_PREFIX}/assets/${illustration.filename}` }
						width={ illustration.size.x }
						height={ illustration.size.y }
					/>
					<span>{ illustration.id }</span>
					<Checkbox
						defaultChecked={ !illustration.hidden }
						onChange={ async (ev) =>
						{
							const checked = ev.currentTarget.checked;

							await Fetcher.patch(`illustrations/${illustration.id}`, {
								hidden: !checked,
							});
						} }
					/>
					<Link to={ illustration.id }>Manage</Link>
				</div>
			)) }
		</div>

		{ modalOpen &&
			<Modal
				onClose={ () => setModalOpen(false) }
			>
				<form
					className={ style.form }
					onSubmit={ async (ev) =>
					{
						ev.preventDefault();

						if (!ev.currentTarget.checkValidity()) {
							ev.currentTarget.reportValidity();
							return;
						}

						const formData = new FormData(ev.currentTarget);
						const toSend = Object.fromEntries(formData);

						const response = await Fetcher.post<Illustration & { success: boolean }>('illustrations', toSend);

						if (response.status === 200 && response.body.success) {
							setList(list =>
							{
								list.unshift({
									id: response.body.id,
									filename: response.body.filename,
									size: response.body.size,
									hidden: true,
								});
							});

							setModalOpen(false);
						}
					} }
				>
					<h2>Upload image</h2>
					<input type='hidden' name='picture' ref={ inputPicture }/>
					<input type='hidden' name='picture_small' ref={ inputPictureSmall }/>

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

								inputPicture.current!.value = imgData;
								inputPictureSmall.current!.value = imgSmallData;
							}

							img.addEventListener('load', onLoad);
						} }
					/>
					<label className={ style.date }>
						<span>Created At</span>
						<br/>
						<input type='date' name='created_at' required/>
					</label>

					<button>
						Upload
					</button>
				</form>
			</Modal>
		}
	</>);
}
