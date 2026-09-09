export default async function handler(req, res) {
  // -----------------------------
  // CORS
  // -----------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const { playerAction, worldState } = req.body || {};

    if (!playerAction) {
      return res.status(400).json({
        ok: false,
        error: "Missing playerAction"
      });
    }

    // -----------------------------
    // World Engine instructions
    // -----------------------------
    const systemPrompt = `
You are the World Engine for "The Lives We Didn't Live."

This is an interactive narrative set in a realistic version of Boston.

Your role is NOT to write a predetermined story.

Your role is to simulate the next believable moment in the world after the player's action.

CORE PRINCIPLES:

1. The player controls their own actions and intentions.
2. The player does NOT control other people's reactions.
3. Other people have their own agency.
4. The world follows realistic physical, social, cultural, legal, financial, and temporal rules.
5. Do not guarantee a desired outcome.
6. Uncertainty is part of the experience.
7. The player's chosen theme affects tone, not outcome.
8. Every action should move the world forward.
9. Do not repeatedly reset the scene.
10. Do not force a dramatic event if an ordinary response is more believable.
11. Important people should remain visually and narratively consistent.
12. Preserve continuity from the previous world state.

The experience is a possibility simulator, not a fantasy simulator.

The player may use natural language.
Interpret their action in the most reasonable way while preserving their agency.

Generate the next meaningful moment.

Return ONLY the structured JSON requested by the response schema.
`;

    // -----------------------------
    // Player + world context
    // -----------------------------
    const userPrompt = `
PLAYER ACTION:
${playerAction}

CURRENT WORLD STATE:
${JSON.stringify(worldState || {}, null, 2)}

Generate the next moment in the world.
`;

    // -----------------------------
    // OpenAI Responses API
    // -----------------------------
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",

          reasoning: {
            effort: "low"
          },

          input: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],

          text: {
            format: {
              type: "json_schema",
              name: "world_engine_response",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  scene: {
                    type: "string"
                  },

                  choices: {
                    type: "array",
                    items: {
                      type: "string"
                    }
                  },

                  worldState: {
                    type: "object",
                    additionalProperties: true
                  },

                  importantPeople: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        name: {
                          type: "string"
                        },
                        description: {
                          type: "string"
                        }
                      },
                      required: [
                        "name",
                        "description"
                      ]
                    }
                  },

                  memoryMoment: {
                    type: "boolean"
                  }
                },

                required: [
                  "scene",
                  "choices",
                  "worldState",
                  "importantPeople",
                  "memoryMoment"
                ]
              }
            }
          },

          max_output_tokens: 900
        })
      }
    );

    const data = await response.json();

    // -----------------------------
    // OpenAI error handling
    // -----------------------------
    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        ok: false,
        error: data
      });
    }

    // -----------------------------
    // Extract model output
    // -----------------------------
    let text = data.output_text || "";

    // Fallback for Responses API output structure
    if (!text && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const content of item.content) {
          if (content.type === "output_text" && content.text) {
            text += content.text;
          }
        }
      }
    }

    if (!text) {
      console.error("No model output:", data);

      return res.status(500).json({
        ok: false,
        error: "The World Engine returned no text."
      });
    }

    // -----------------------------
    // Parse structured JSON
    // -----------------------------
    let result;

    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parsing failed.");
      console.error("Raw model output:", text);

      // Extra safety:
      // remove accidental markdown code fences
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        result = JSON.parse(cleaned);
      } catch (secondError) {
        return res.status(500).json({
          ok: false,
          error: "AI returned invalid JSON",
          raw: text
        });
      }
    }

    // -----------------------------
    // Success
    // -----------------------------
    return res.status(200).json({
      ok: true,
      ...result,
      responseId: data.id
    });

  } catch (error) {
    console.error("World Engine error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Unknown server error"
    });
  }
}
