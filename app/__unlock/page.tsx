/**
 * Site password gate page.
 *
 * Single-purpose form. No nav, no images, no chunks — minimal surface
 * area to inspect. The actual app bundles only load after unlock.
 */
export const dynamic = "force-dynamic";

type Search = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function UnlockPage({ searchParams }: Search) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const error = sp.error === "1";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
        <title>Restricted</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; height: 100%; background: #0a0a0a; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
          body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { width: 100%; max-width: 380px; padding: 32px 24px; background: #141414; border: 1px solid #252525; border-radius: 14px; }
          h1 { margin: 0 0 6px; font-size: 18px; font-weight: 700; }
          p { margin: 0 0 20px; font-size: 13px; color: #999; }
          input { width: 100%; padding: 12px 14px; background: #0a0a0a; border: 1px solid #252525; border-radius: 8px; color: #fff; font-size: 14px; outline: none; }
          input:focus { border-color: #555; }
          button { width: 100%; margin-top: 12px; padding: 12px; background: #fff; color: #000; border: 0; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; }
          .err { margin-top: 12px; font-size: 12px; color: #ff6b6b; }
        `}</style>
      </head>
      <body>
        <form className="card" action="/api/__unlock" method="POST">
          <h1>Restricted</h1>
          <p>This area is private. Enter the access password to continue.</p>
          <input type="password" name="password" placeholder="Password" autoFocus required autoComplete="off" />
          <input type="hidden" name="next" value={next} />
          <button type="submit">Unlock</button>
          {error ? <div className="err">Incorrect password.</div> : null}
        </form>
      </body>
    </html>
  );
}
