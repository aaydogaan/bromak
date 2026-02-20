import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // 🚫 İyi Akşamlar maili devre dışı bırakıldı.
    return NextResponse.json({ success: true, message: 'Disabled: Evening greeting is turned off' })
}
