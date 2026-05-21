import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gim, "")
    .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gim, "")
    .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gim, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, depth = 1 } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Crawling URL: ${url} with depth: ${depth}`);
    
    const visited = new Set<string>();
    const results: { url: string; content: string }[] = [];
    const queue = [{ url, currentDepth: 0 }];
    const baseUrl = new URL(url);

    // Limit to 5 pages total to stay within time limits
    while (queue.length > 0 && results.length < 5) {
      const { url: currentUrl, currentDepth } = queue.shift()!;
      
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        console.log(`Fetching: ${currentUrl}`);
        const response = await fetch(currentUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${currentUrl}: ${response.statusText}`);
          continue;
        }

        const html = await response.text();
        const cleaned = cleanHtml(html);
        
        results.push({ url: currentUrl, content: cleaned });

        // If we want more depth, find internal links
        if (currentDepth < depth) {
          const linkRegex = /href=["']([^"']+)["']/gi;
          let match;
          while ((match = linkRegex.exec(html)) !== null && queue.length < 10) {
            try {
              const link = match[1];
              const absoluteUrl = new URL(link, currentUrl).href;
              const parsedLink = new URL(absoluteUrl);
              
              // Only same domain, no anchors, no queries (to keep it simple)
              if (
                parsedLink.hostname === baseUrl.hostname && 
                !absoluteUrl.includes('#') &&
                !visited.has(absoluteUrl) &&
                !queue.some(q => q.url === absoluteUrl)
              ) {
                // Prioritize "likely important" pages
                const isImportant = /pricing|plans|about|contact|services|products|features/i.test(absoluteUrl);
                if (isImportant) {
                  queue.unshift({ url: absoluteUrl, currentDepth: currentDepth + 1 });
                } else {
                  queue.push({ url: absoluteUrl, currentDepth: currentDepth + 1 });
                }
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching ${currentUrl}:`, e);
      }
    }

    // Combine all content
    const combinedContent = results
      .map(r => `[Página: ${r.url}]\n${r.content}`)
      .join("\n\n")
      .slice(0, 100000); // Increased limit to 100k

    return new Response(JSON.stringify({ 
      content: combinedContent,
      pages_crawled: results.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
