import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const trimmedQuery = query.trim();

    // 1. Try Google Books API first
    try {
      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          trimmedQuery
        )}&maxResults=8&printType=books`,
        { headers: { Accept: "application/json" } }
      );

      if (googleRes.ok) {
        const data = await googleRes.json();
        const items = data.items || [];

        if (items.length > 0) {
          const results = items.map((item: any) => {
            const info = item.volumeInfo || {};
            let coverUrl =
              info.imageLinks?.thumbnail ||
              info.imageLinks?.smallThumbnail ||
              null;

            if (coverUrl && coverUrl.startsWith("http://")) {
              coverUrl = coverUrl.replace("http://", "https://");
            }

            return {
              id: item.id,
              title: info.title || "Untitled",
              author: info.authors ? info.authors.join(", ") : "Unknown Author",
              coverUrl,
              totalPages: info.pageCount || null,
              description: info.description || null,
              publishedDate: info.publishedDate || null,
            };
          });

          return NextResponse.json({ results });
        }
      }
    } catch (gErr) {
      console.warn("Google Books API query failed, trying OpenLibrary fallback:", gErr);
    }

    // 2. Fallback to OpenLibrary API (handles 429 quota limits on Google Books)
    try {
      const openLibRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          trimmedQuery
        )}&limit=8`,
        { headers: { Accept: "application/json" } }
      );

      if (openLibRes.ok) {
        const olData = await openLibRes.json();
        const docs = olData.docs || [];

        if (docs.length > 0) {
          const results = docs.map((doc: any) => {
            const coverId = doc.cover_i;
            const coverUrl = coverId
              ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
              : null;

            return {
              id: doc.key || String(Math.random()),
              title: doc.title || "Untitled",
              author: doc.author_name ? doc.author_name.slice(0, 2).join(", ") : "Unknown Author",
              coverUrl,
              totalPages: doc.number_of_pages_median || null,
              description: null,
              publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
            };
          });

          return NextResponse.json({ results });
        }
      }
    } catch (olErr) {
      console.warn("OpenLibrary fallback failed:", olErr);
    }

    return NextResponse.json({ results: [] });
  } catch (err: any) {
    console.error("Book search route error:", err);
    return NextResponse.json({ results: [] });
  }
}
