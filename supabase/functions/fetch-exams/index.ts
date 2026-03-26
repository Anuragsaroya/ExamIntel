import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXAM_SOURCES = [
  { id: "jee-main-2026", name: "JEE Main", urls: ["https://jeemain.nta.nic.in"] },
  { id: "bitsat-2026", name: "BITSAT", urls: ["https://www.bitsadmission.com"] },
  { id: "wbjee-2026", name: "WBJEE", urls: ["https://wbjeeb.nic.in"] },
  { id: "viteee-2026", name: "VITEEE", urls: ["https://vit.ac.in/admissions/btech"] },
  { id: "comedk-2026", name: "COMEDK", urls: ["https://www.comedk.org"] },
  { id: "mhtcet-2026", name: "MHT CET", urls: ["https://cetcell.mahacet.org"] },
  { id: "kcet-2026", name: "KCET", urls: ["https://cetonline.karnataka.gov.in"] },
  { id: "srmjeee-2026", name: "SRMJEEE", urls: ["https://www.srmist.edu.in"] },
  { id: "gujcet-2026", name: "GUJCET", urls: ["https://gujcet.gseb.org"] },
  { id: "amee-2026", name: "AMEE (Amrita)", urls: ["https://www.amrita.edu"] },
  { id: "cuet-ug-2026", name: "CUET UG", urls: ["https://cuet.nta.nic.in"] },
  { id: "snu-2026", name: "Shiv Nadar University", urls: ["https://snuadmissions.com"] },
  { id: "keam-2026", name: "KEAM", urls: ["https://cee.kerala.gov.in"] },
  { id: "cusat-2026", name: "CUSAT CAT", urls: ["https://admissions.cusat.ac.in"] },
  { id: "ap-eapcet-2026", name: "AP EAPCET", urls: ["https://cets.apsche.ap.gov.in"] },
  { id: "ncet-2026", name: "NCET", urls: ["https://ncet.nta.nic.in"] },
  { id: "met-2026", name: "MET (Manipal)", urls: ["https://manipal.edu"] },
  { id: "isi-2026", name: "ISI", urls: ["https://www.isical.ac.in"] },
  { id: "cgpet-2026", name: "CG-PET", urls: ["https://vyapam.cgstate.gov.in"] },
  { id: "kleee-2026", name: "KLEEE", urls: ["https://www.kletech.ac.in"] },
  { id: "ojee-2026", name: "OJEE", urls: ["https://ojee.nic.in"] },
  { id: "ugee-2026", name: "UGEE (IIIT Hyderabad)", urls: ["https://ugadmissions.iiit.ac.in"] },
  { id: "assam-cee-2026", name: "Assam CEE", urls: ["https://www.astu.ac.in"] },
  { id: "ipu-cet-2026", name: "IPU CET", urls: ["https://www.ipu.ac.in"] },
  { id: "ts-eapcet-2026", name: "TS EAPCET", urls: ["https://eapcet.tsche.ac.in"] },
  { id: "cmi-2026", name: "CMI", urls: ["https://www.cmi.ac.in"] },
  { id: "nest-2026", name: "NEST", urls: ["https://www.nestexam.in"] },
  { id: "kiitee-p1-2026", name: "KIITEE Phase I", urls: ["https://kiitee.kiit.ac.in"] },
  { id: "kiitee-p2-2026", name: "KIITEE Phase II", urls: ["https://kiitee.kiit.ac.in"] },
  { id: "kiitee-p3-2026", name: "KIITEE Phase III", urls: ["https://kiitee.kiit.ac.in"] },
  { id: "iat-2026", name: "IAT (IISER)", urls: ["https://www.iiseradmission.in"] },
  { id: "srmjeee-2026", name: "SRMJEEE Phase I", urls: ["https://www.srmist.edu.in"] },
  { id: "hpcet-2026", name: "HPCET", urls: ["https://www.himtu.ac.in"] },
];

// Deduplicate by URL to avoid fetching same site multiple times
function getUniqueUrlMap(): Map<string, string[]> {
  const urlToExamIds = new Map<string, string[]>();
  for (const exam of EXAM_SOURCES) {
    for (const url of exam.urls) {
      if (!urlToExamIds.has(url)) {
        urlToExamIds.set(url, []);
      }
      urlToExamIds.get(url)!.push(exam.id);
    }
  }
  return urlToExamIds;
}

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const html = await resp.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return text;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { examIds } = await req.json();
    const targetExams = examIds
      ? EXAM_SOURCES.filter((e) => examIds.includes(e.id))
      : EXAM_SOURCES;

    // Batch exams by unique URL to avoid duplicate fetches
    const urlContentCache = new Map<string, string | null>();
    const uniqueUrls = [...new Set(targetExams.flatMap(e => e.urls))];
    
    // Fetch all unique URLs in parallel (batch of 10 at a time)
    const batchSize = 10;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (url) => {
          const content = await fetchPageContent(url);
          return { url, content };
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") {
          urlContentCache.set(r.value.url, r.value.content);
        }
      }
    }

    // Build exam content from cache
    const fetchedData = targetExams
      .map((exam) => {
        const contents: string[] = [];
        for (const url of exam.urls) {
          const content = urlContentCache.get(url);
          if (content) contents.push(content);
        }
        return {
          examId: exam.id,
          examName: exam.name,
          content: contents.join("\n\n"),
          fetched: contents.length > 0,
        };
      })
      .filter((d) => d.fetched);

    if (fetchedData.length === 0) {
      return new Response(JSON.stringify({ success: false, data: [], message: "Could not fetch any exam websites." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process with AI in batches of 5
    const allResults: any[] = [];
    const aiBatchSize = 5;
    
    for (let i = 0; i < fetchedData.length; i += aiBatchSize) {
      const batch = fetchedData.slice(i, i + aiBatchSize);
      const structuredResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                tools: [{
                  type: "function",
                  function: {
                    name: "extract_exam_data",
                    description: "Extract structured exam information from website content",
                    parameters: {
                      type: "object",
                      properties: {
                        registration_start: { type: "string", description: "Registration start date in YYYY-MM-DD or null" },
                        registration_end: { type: "string", description: "Registration end date in YYYY-MM-DD or null" },
                        admit_card_date: { type: "string", description: "Admit card release date in YYYY-MM-DD or null" },
                        exam_date: { type: "string", description: "Exam date in YYYY-MM-DD or null. For exam windows use the start date." },
                        result_date: { type: "string", description: "Result date in YYYY-MM-DD or null" },
                        application_fee: { type: "string", description: "Application fee details or null" },
                        eligibility: { type: "string", description: "Brief eligibility criteria or null" },
                        important_notice: { type: "string", description: "Any important notice or update found" },
                        confidence_score: { type: "number", description: "Confidence in extracted data from 0 to 1" },
                      },
                      required: ["confidence_score"],
                    },
                  },
                }],
                tool_choice: { type: "function", function: { name: "extract_exam_data" } },
                messages: [
                  {
                    role: "system",
                    content: "You are a data extraction expert specializing in Indian entrance exams. Extract exam dates and details from the provided website content. Use YYYY-MM-DD format for dates. The year is 2025-2026 academic cycle. If information is clearly present, confidence should be high (0.8-1.0). If you're guessing, set confidence low (0.3-0.5)."
                  },
                  {
                    role: "user",
                    content: `Extract exam information for ${item.examName} from this website content:\n\n${item.content}`
                  }
                ],
              }),
            });

            if (!aiResp.ok) {
              console.error(`AI extraction failed for ${item.examName}:`, await aiResp.text());
              return { examId: item.examId, examName: item.examName, extracted: false };
            }

            const aiData = await aiResp.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              const parsed = JSON.parse(toolCall.function.arguments);
              return { examId: item.examId, examName: item.examName, extracted: true, data: parsed };
            }
            return { examId: item.examId, examName: item.examName, extracted: false };
          } catch (e) {
            console.error(`Error processing ${item.examName}:`, e);
            return { examId: item.examId, examName: item.examName, extracted: false };
          }
        })
      );

      for (const r of structuredResults) {
        if (r.status === "fulfilled") allResults.push(r.value);
      }
    }

    console.log(`Processed ${allResults.length} exams, ${allResults.filter(r => r.extracted).length} extracted successfully`);

    return new Response(JSON.stringify({ success: true, data: allResults, fetchedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-exams error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
