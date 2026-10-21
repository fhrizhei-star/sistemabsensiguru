import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby0DdiBERSda-XSxlvdtQrr9h9JILecQhDWsrctfZu514jP-NRo3v6T6LrSKL39PrY35Q/exec";

function getCORSHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-script-url",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders()
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptUrl =
      searchParams.get("script_url") ||
      request.headers.get("x-script-url") ||
      process.env.GOOGLE_SCRIPT_URL ||
      DEFAULT_SCRIPT_URL;

    if (!scriptUrl || scriptUrl.includes("GANTI_DENGAN_URL")) {
      return NextResponse.json(
        { success: false, message: "Google Apps Script URL belum dikonfigurasi." },
        { headers: getCORSHeaders() }
      );
    }

    const targetUrl = new URL(scriptUrl);
    searchParams.forEach((val, key) => {
      if (key !== "script_url") targetUrl.searchParams.set(key, val);
    });

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { headers: getCORSHeaders() });
    } catch {
      return NextResponse.json(
        { success: false, raw: text.slice(0, 500), error: "Respons bukan JSON valid" },
        { headers: getCORSHeaders() }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: getCORSHeaders() }
    );
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptUrl =
      searchParams.get("script_url") ||
      request.headers.get("x-script-url") ||
      process.env.GOOGLE_SCRIPT_URL ||
      DEFAULT_SCRIPT_URL;

    if (!scriptUrl || scriptUrl.includes("GANTI_DENGAN_URL")) {
      return NextResponse.json(
        { success: false, message: "Google Apps Script URL belum dikonfigurasi." },
        { headers: getCORSHeaders() }
      );
    }

    const body = await request.text();

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body,
      redirect: "follow",
      cache: "no-store"
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { headers: getCORSHeaders() });
    } catch {
      return NextResponse.json(
        { success: false, raw: text.slice(0, 500), error: "Respons bukan JSON valid" },
        { headers: getCORSHeaders() }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: getCORSHeaders() }
    );
  }
}
