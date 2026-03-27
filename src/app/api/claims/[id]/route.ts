import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const token = cookies().get("accessToken")?.value;

  const upstream = `http://localhost:9000/api/claims/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(upstream, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (res.status === 204) {
      return new Response(null, { status: 204 });
    }

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      let message = res.statusText;
      try {
        if (contentType.includes("application/json")) {
          const errJson = await res.json();
          message = errJson?.message || errJson?.error || message;
          return NextResponse.json(errJson, { status: res.status });
        }
        const errText = await res.text();
        message = errText || message;
      } catch (e) {
        // ignore parse errors
      }
      return NextResponse.json({ success: false, message }, { status: res.status });
    }

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": contentType || "text/plain" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Upstream request failed" },
      { status: 502 }
    );
  }
}


