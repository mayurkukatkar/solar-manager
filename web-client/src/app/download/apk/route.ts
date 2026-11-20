import { NextResponse } from 'next/server';

const APK_URL = 'https://expo.dev/artifacts/eas/W4k8Hnc6eIBtPhEk9V43oxsTb24eCV4ciSvjj82GQu0.apk';

export async function GET() {
  return NextResponse.redirect(APK_URL, 307);
}
