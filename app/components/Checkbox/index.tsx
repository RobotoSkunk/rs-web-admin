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
	motion,
	AnimatePresence,
} from 'motion/react';

import style from './checkbox.module.css';

export default function Checkbox({
	name,
	children,
	disabled,
	defaultChecked,
	onChange,
}: {
	name?: string;
	children?: React.ReactNode;
	disabled?: boolean;
	defaultChecked: boolean;
	onChange?: (ev: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => void;
})
{
	const [ checked, setChecked ] = useState(defaultChecked);

	return (
		<label className={ style.checkbox }>
			<input
				type='checkbox'
				name={ name }
				defaultChecked={ defaultChecked }
				disabled={ disabled }
				onChange={ (ev) =>
				{
					if (onChange) {
						onChange(ev);
					}

					setChecked(ev.currentTarget.checked);
				} }
			/>
			<AnimatePresence initial={ false }>
				<motion.div
					className={ style.switch }
					animate={{
						background: disabled ? '#4b5563' : (checked ? '#047857' : '#9f1239'),
					}}
				>
					<motion.div
						className={ style.handler }
						animate={{
							x: checked ? 22 : 0,
						}}
					/>
				</motion.div>
			</AnimatePresence>
			{ children &&
				<span>{ children }</span>
			}
		</label>
	);
}
