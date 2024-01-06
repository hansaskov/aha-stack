import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import type { APIContext } from "astro";

import { and, eq } from "drizzle-orm";
import { google, lucia } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { oauthTable, userTable } from "../../../../server/schema";


const PROVIDER = "google"

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
	const storedCodeVerifier = context.cookies.get("google_oauth_code_verifier")?.value ?? null;
	if (!code || !state || !storedCodeVerifier || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const init: RequestInit = {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		}

		const [googleUserResponse] = await Promise.all([
			await fetch("https://openidconnect.googleapis.com/v1/userinfo", init),
		])

		const [googleUser]: [GoogleUser] = await Promise.all([
			googleUserResponse.json()
		])

		const existingUser = (await db.select()
			.from(oauthTable)
			.where(and(eq(oauthTable.provider, PROVIDER), eq(oauthTable.providerId, googleUser.sub))))
			.at(0)

		if (existingUser) {
			const session = await lucia.createSession(existingUser.userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return context.redirect("/");
		}

		const userId = generateId(15);

		await db.transaction(async (tx) => {
			await tx.insert(userTable).values({
				id: userId,
				username: googleUser.name,
				email: googleUser.email,
				isEmailVerified: googleUser.email_verified
			})

			await tx.insert(oauthTable).values({
				userId: userId,
				provider: PROVIDER,
				providerId: googleUser.sub,
			})
		})

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return context.redirect("/");
	} catch (e) {
		console.log(e)
		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GoogleUser {
	sub: string,
	name: string,
	given_name: string,
	family_name: string,
	picture: string,
	email: string,
	email_verified: boolean,
	locale: string,
	hd: string
}