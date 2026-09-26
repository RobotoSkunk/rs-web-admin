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
	useRef,
	useState,
} from 'react';

import {
	motion,
	AnimatePresence,
} from 'motion/react';

import uploadIcon from '@/assets/img/upload.svg';

import style from './input.module.css';

export default function ImageInput({
	name,
	required,
	onChange,
}: {
	name?: string;
	required?: boolean,
	onChange?: (ev: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => void;
})
{
	const imgRef = useRef<HTMLImageElement>(null);
	const [ hasValue, setHasValue ] = useState(false);
	const [ filename, setFilename ] = useState(' ');

	return (
		<motion.label
			className={ style.input }

			initial={{ height: 120 }}
			animate={{
				height: hasValue ? 280 : 120,
			}}
		>
			<input
				type='file'
				accept='image/png, image/jpeg, image/webp'
				name={ name }
				className={ style['file-input'] }

				onChange={ (ev) =>
				{
					if (!imgRef.current || !ev.currentTarget.files) {
						return;
					}

					const file = ev.currentTarget.files[0];
					if (!file) {
						return;
					}

					setFilename(file.name);

					imgRef.current.src = URL.createObjectURL(file);
					setHasValue(true);

					if (onChange) {
						onChange(ev);
					}
				} }

				required
			/>

			<img
				className={ style.preview }
				ref={ imgRef }
				style={{
					opacity: hasValue ? 1 : 0,
				}}
			/>

			<div className={ style.info }>
				<img src={ uploadIcon } className={ style.icon }/>
				<span>{ filename }</span>
			</div>
		</motion.label>
	);
}
