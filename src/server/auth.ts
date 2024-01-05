import { Lucia, TimeSpan } from "lucia";
import { adapter } from "./db";
import type { DatabaseUserAttributes } from "./schema";
import { GitHub } from "arctic";

export const lucia = new Lucia(adapter, {
    sessionExpiresIn: new TimeSpan(4, 'w'),
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: import.meta.env.PROD
		}
	},
    getUserAttributes: ({}) => {
        return {
            
        }
    },
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

export const github = new GitHub(
	import.meta.env.GITHUB_CLIENT_ID,
	import.meta.env.GITHUB_CLIENT_SECRET
);
