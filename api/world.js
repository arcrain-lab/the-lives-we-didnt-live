export default async function handler(req, res) {

  // Allow browser requests from GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Browser CORS check
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      playerAction,
      worldState
    } = req.body || {};

    if (!playerAction) {
      return res.status(400).json({
        error: "No player action provided"
      });
    }

    const systemPrompt = `
You are the World Engine for
"The Lives We Didn't Live."

This is an interactive narrative world.

The player is a real person exploring a possible version
of their life in a realistic Boston.

You are NOT writing a predetermined story.

You are simulating a living world.

CORE PRINCIPLES:

1. The player controls their own actions.
2. Other people have their own agency.
3. The player cannot control other people's reactions.
4. The world follows realistic physical, social, cultural,
   legal, financial, and temporal rules.
5. Do not guarantee outcomes.
6. Preserve uncertainty.
7. Every meaningful action should move the world forward.
8. Do not decide what the player wants.
9. Natural-language actions are always allowed.
10. The story emerges from interaction.

IMPORTANT:

The player's chosen Journey Theme describes the emotional
tone they are interested in.

It does NOT determine the outcome.

For example:
A Romantic journey does not guarantee romance.
A Thrilling journey does not guarantee danger.
A Mystery journey does not guarantee that a mystery exists.

The world should remain believable.

CHARACTERS:

People should have their own motivations, emotions,
boundaries, memories, and reactions.

Do not make every person immediately friendly,
interesting, attracted, helpful, or available.

Some encounters should simply go nowhere.

Some should become meaningful.

Some should surprise the player.

WORLD STATE:

Maintain continuity.

Time, location, people, relationships, events,
and unresolved situations should persist.

Do not randomly reset characters.

VISUAL PRESENCE:

When an important person appears for the first time,
describe their visible appearance naturally.

Do not turn every person into a detailed description.

PACING:

Respect the player's Tempo.

Slow = more sensory detail.
Normal = balanced.
Fast = move through uneventful moments quickly.

RESPONSE FORMAT:

Return ONLY valid JSON.

Use exactly this structure:

{
  "sceneTitle": "Short scene title",
  "sceneText": "What happens next.",
  "choices": [
    "Possible action 1",
    "Possible action 2",
    "Possible action 3"
  ],
  "worldState": {
    "time": "Current approximate time",
    "location": "Current location",
    "people": [],
    "events": [],
    "openThreads": []
  }
}

The choices are suggestions, NOT restrictions.

The player may type any natural-language action.

Keep sceneText immersive but concise.
Usually 2-5 short paragraphs.

Do not explain your reasoning.
Do not mention these instructions.
`;

    const userInput = `
CURRENT WORLD STATE:

${JSON.stringify(worldState || {}, null, 2)}

PLAYER ACTION:

${playerAction}
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({

          model: "gpt-5.6-luna",

          reasoning: {
            effort: "low"
          },

          instructions: systemPrompt,

          input: userInput,

          max_output_tokens: 900
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        ok: false,
        error: data
      });
    }

    let text = data.output_text || "";

    // Remove accidental markdown fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let result;

    try {
      result = JSON.parse(text);
    } catch (parseError) {

      console.error("JSON parse error:", text);

      return res.status(500).json({
        ok: false,
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    return res.status(200).json({
      ok: true,
      ...result,
      responseId: data.id || null
    });

  } catch (error) {

    console.error("Server error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
