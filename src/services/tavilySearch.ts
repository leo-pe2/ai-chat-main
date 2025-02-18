import { config } from '../config/env.config';

export async function searchTavily(query: string): Promise<string> {
  if (!config.TAVILY_API_KEY) {
    throw new Error("Tavily API key is missing");
  }
  
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        include_images: false,
        max_results: 3,
      })
    });
    const data = await response.json();
    console.log("Tavily raw response:", data); // Debug log full response
    if (data.answer) {
      return data.answer;
    } else if (data.results && data.results.length > 0) {
      // Concatenate every "content" from the results array
      return data.results.map((result: any) => result.content).join("\n");
    }
    return "";
  } catch (err) {
    console.error("Tavily search failed:", err);
    return "";
  }
}
