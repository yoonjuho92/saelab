import { NextRequest, NextResponse } from "next/server";
import { formatPrompt } from "@/lib/promptLoader";

type PromptName =
  | "create_logline"
  | "create_from_logline_w_gulino"
  | "create_from_logline_w_vogel"
  | "create_from_logline_w_snider"
  | "extract_plot_point"
  | "extract_structure"
  | "create_from_logline"
  | "revise_story_structure"
  | "extract_character"
  | "revise_story_with_character";

export async function POST(request: NextRequest) {
  try {
    const {
      promptName,
      variables,
      responseFormat = "text",
    } = await request.json();

    if (!promptName) {
      return NextResponse.json(
        { error: "promptName is required" },
        { status: 400 }
      );
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const { system, user } = formatPrompt(
      promptName as PromptName,
      variables || {}
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: user,
          },
        ],
        temperature: 1,
        max_tokens: 4000,
        response_format:
          responseFormat === "json" ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // JSON 응답인 경우 파싱해서 반환
    if (responseFormat === "json") {
      try {
        const jsonContent = JSON.parse(content);
        return NextResponse.json({ result: jsonContent });
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error("Raw content:", content);

        // JSON 파싱 실패 시 사용자에게 에러 반환
        return NextResponse.json(
          { error: "Failed to parse JSON response from OpenAI" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ result: content });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
