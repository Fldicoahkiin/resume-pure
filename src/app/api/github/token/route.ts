import { NextRequest, NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = 'Ov23liQEMBP6qi66U653';

export async function POST(request: NextRequest) {
  const body = await request.json() as { device_code?: string };
  const deviceCode = body.device_code;

  if (!deviceCode) {
    return NextResponse.json(
      { error: 'missing device_code' },
      { status: 400 },
    );
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'token-exchange-failed' },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
