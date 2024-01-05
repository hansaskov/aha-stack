import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import type { APIContext } from "astro";

import { and, eq } from "drizzle-orm";
import { github, lucia } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { oauthTable, userTable } from "../../../../server/schema";


const PROVIDER = "github"

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("github_oauth_state")?.value ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await github.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const githubUser: GitHubUser = await githubUserResponse.json();
		const existingUser = (await db.select()
			.from(oauthTable)
			.where(and(eq(oauthTable.provider, PROVIDER), eq(oauthTable.providerId, githubUser.id))))
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
			})

			await tx.insert(oauthTable).values({
				userId: userId,
				provider: PROVIDER,
				providerId: githubUser.id,
			})

		})

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return context.redirect("/");
	} catch (e) {
		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			console.log(e)
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

interface GitHubUser {
	id: string;
	login: string;
}