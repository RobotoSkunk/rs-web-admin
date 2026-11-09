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

import Pica from 'pica';


export default class CanvasManipulator
{
	public static async processImage(source: Blob | MediaSource, options: {
		quality?: number;
		size: number;
		axis: 'x' | 'y' | 'auto';
		type: 'webp' | 'jpeg' | 'png';
	}): Promise<string>
	{
		const canvas = document.createElement('canvas');

		const img = new Image();
		img.src = URL.createObjectURL(source);

		return new Promise((resolve, reject) =>
		{
			async function onLoad()
			{
				img.removeEventListener('load', onLoad);
				let scale = 1;

				canvas.width = img.width;
				canvas.height = img.height;

				if (options.axis === 'auto') {
					if (img.width > img.height) {
						options.axis = 'x';
					} else {
						options.axis = 'y';
					}
				}

				if (options.axis === 'x') {
					scale = options.size / img.width;

					const aspectRatio = img.height / img.width;

					canvas.width = options.size;
					canvas.height = options.size * aspectRatio;
				} else {
					scale = options.size / img.height;

					const aspectRatio = img.width / img.height;

					canvas.width = options.size * aspectRatio;
					canvas.height = options.size;
				}

				try {
					if (scale < 1) {
						const pica = Pica();
						console.log(img.width, img.height);
						console.log(canvas.width, canvas.height);

						await pica.resize(img, canvas);
					} else {
						const context = canvas.getContext('2d')!;
						context.drawImage(img, 0, 0, canvas.width, canvas.height);
					}

					const data = canvas.toDataURL(`image/${options.type}`, options.quality ?? 1);
					resolve(data);
				} catch (e) {
					reject(e);
				}
			}

			img.addEventListener('load', onLoad);
		});
	}
}
