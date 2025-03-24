import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = new URL("https://www.idi.ntnu.no/education/fordypningsprosjekt.php")

    // Copy all search parameters from the request to the target URL
    searchParams.forEach((value, key) => {
        url.searchParams.append(key, value)
    })

    try {
        const response = await fetch(url.toString())

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch data from NTNU" }, { status: response.status })
        }

        const data = await response.text()
        return new NextResponse(data, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        })
    } catch (error) {
        console.error("Error fetching data:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

