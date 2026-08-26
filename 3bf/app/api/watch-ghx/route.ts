import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const workerUrls = [
      process.env.NEXT_PUBLIC_3BF_WORKER_URL,
      "http://localhost:8005",
      "http://127.0.0.1:8005",
    ].filter(Boolean) as string[];

    for (const url of workerUrls) {
      try {
        const workerRes = await fetch(`${url}/check-mtime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        if (workerRes.ok) {
          const data = await workerRes.json();
          return NextResponse.json(data);
        }
      } catch (err: any) {
        // Continue to fallback url
      }
    }

    return NextResponse.json({ status: "error", results: [] }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
