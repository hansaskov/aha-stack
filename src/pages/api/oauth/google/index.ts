import { generateState, generateCodeVerifier } from "arctic";
import type { APIContext } from "astro";
import { google } from "../../../../server/auth";


export async function GET(context: APIContext): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier()
	const url = await google.createAuthorizationURL(state, codeVerifier, {scopes: ["profile", "email"]});

	context.cookies.set("google_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	context.cookies.set("google_oauth_code_verifier", codeVerifier, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return context.redirect(url.toString());
}