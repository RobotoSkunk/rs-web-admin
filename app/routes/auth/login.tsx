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
	AnimatePresence,
	motion,
	type Variants,
} from 'motion/react';

import bcrypt from 'bcryptjs';
import SRP from 'secure-remote-password/client';
import Fetcher from '~/utils/fetcher';


const variants = {
	start: {
		x: 100,
		opacity: 0,
	},
	show: {
		x: 0,
		opacity: 1,
	},
	hide: {
		x: -100,
		opacity: 0,
	},
} satisfies Variants;

type ChallengeResponse = {
	session_id: string;
	user_id: string;
	srp_salt: string;
	ephemeral: string;
};

type VerifyResponse = {
	success: boolean;
	proof?: string;
	verifier?: string;
};


export default function Login()
{
	const [ sessionId, setSessionId ] = useState('');
	const [ currentSection, setCurrentSection ] = useState(0);

	const sections = [
		(
			<form
				method='POST'
				onSubmit={ async (ev) =>
				{
					ev.preventDefault();
					const form = ev.currentTarget;

					if (!form.checkValidity()) {
						form.reportValidity();
						return;
					}

					const formData = new FormData(form);
					const username = formData.get('username') as string;
					const password = formData.get('password') as string;

					// Challenge
					const clientEphemeral = SRP.generateEphemeral();

					const challengeResponse = await Fetcher.post<ChallengeResponse>('auth/challenge', {
						username,
						client_ephemeral: clientEphemeral.public,
					});

					const params = challengeResponse.body;

					// Verify
					const encoder = new TextEncoder();
					const bcryptSalt = bcrypt.encodeBase64(encoder.encode(params.srp_salt), 16);
					const passwordHash = await bcrypt.hash(password, `$2b$10$${bcryptSalt}`);

					const privateKey = SRP.derivePrivateKey(params.srp_salt, params.user_id, passwordHash);
					const clientSession = SRP.deriveSession(clientEphemeral.secret, params.ephemeral, params.srp_salt, params.user_id, privateKey);

					const verifyResponse = await Fetcher.post<VerifyResponse>('auth/verify', {
						session_id: params.session_id,
						session_proof: clientSession.proof,
					})

					console.log(verifyResponse.body);
				} }
			>
				<p>
					<label htmlFor='username'>Username: </label><br/>
					<input id='username' name='username' required/>
				</p>
				<p>
					<label htmlFor='password'>Password: </label><br/>
					<input id='password' name='password' type='password' required/>
				</p>
				<button>Continue</button>
			</form>
		),
		(
			<form
				method='POST'
				onSubmit={ async (ev) =>
				{
					ev.preventDefault();
					setCurrentSection(currentSection + 1);
				} }
			>
				<p>
					<label htmlFor='totp'>TOTP Token: </label><br/>
					<input id='totp' name='totp' required/>
				</p>
				<button>Authenticate</button>
			</form>
		),
	];

	return (
		<div className='container'>
			<h1>ADMINISTRATOR'S PANEL</h1>
			<div className='login-forms'>
				<AnimatePresence initial={ false } mode='wait'>
					<motion.div
						variants={ variants }
						initial='start'
						animate='show'
						exit='hide'

						transition={{
							type: 'spring',
							stiffness: 300,
							damping: 30,
						}}

						key={ currentSection }
					>
						{ sections[currentSection] }
					</motion.div>
				</AnimatePresence>
			</div>
			<a href='https://robotoskunk.com'>robotoskunk.com</a>
		</div>
	);
}
