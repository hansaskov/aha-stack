import type { APIContext } from "astro";
import { lucia } from "../../server/auth";

export async function POST(context: APIContext): Promise<Response> {
  if (!context.locals.session) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login", // Set the Location header to the login page
      },
    });
  }

  await lucia.invalidateSession(context.locals.session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  // After invalidating the session, also redirect to the login page
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login", // Set the Location header to the login page
    },
  });
}
