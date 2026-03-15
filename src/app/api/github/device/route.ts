import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = 'Ov23liQEMBP6qi66U653';

export async function POST() {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user',
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'device-code-failed' },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
