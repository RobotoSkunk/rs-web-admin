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

type FetcherResponse<T> = {
	status: number;
	body: T;
};

type HTTPMethods = 'PATCH' | 'DELETE' | 'GET' | 'POST' | 'PUT';


export default class Fetcher
{
	public static async fetch<T>(method: HTTPMethods, endpoint: string, body?: object): Promise<FetcherResponse<T>>
	{
		try {
			const response = await fetch(`${API_PREFIX}/${endpoint}`, {
				method: method,
				headers: {
					'content-type': 'application/json',
				},
				body: body ? JSON.stringify(body) : null,
			});

			const responseBody = await response.json();

			return {
				status: response.status,
				body: responseBody,
			};
		} catch(e) {
			throw e;
		}
	}

	public static async get<T>(endpoint: string): Promise<FetcherResponse<T>>
	{
		return await Fetcher.fetch('GET', endpoint);
	}

	public static async post<T>(endpoint: string, body: object): Promise<FetcherResponse<T>>
	{
		return await Fetcher.fetch('POST', endpoint, body);
	}

	public static async patch<T>(endpoint: string, body: object): Promise<FetcherResponse<T>>
	{
		return await Fetcher.fetch('PATCH', endpoint, body);
	}

	public static async put<T>(endpoint: string, body: object): Promise<FetcherResponse<T>>
	{
		return await Fetcher.fetch('PUT', endpoint, body);
	}

	public static async delete<T>(endpoint: string): Promise<FetcherResponse<T>>
	{
		return await Fetcher.fetch('DELETE', endpoint);
	}
}
