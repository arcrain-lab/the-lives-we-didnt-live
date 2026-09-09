export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { playerAction, worldState } = req.body || {};

    if (!playerAction) {
      return res.status(400).json({
        error: "No player action provided"
      });
    }

    const systemPrompt = `
You are the World Engine and Co-Director for
"The Lives We Didn't Live."

This is an interactive narrative world based on a realistic Boston.

The player is a real person exploring a possible version
of their life.

Your job is NOT to write a predetermined story.

Your job is to respond to the player's action and move
the world forward.

Core principles:

1. The player controls their own choices.
2. Other people have their own agency.
3. The player cannot control other people's responses.
4. The world follows realistic physical, social, cultural,
   legal, financial, and temporal rules.
5. Do not guarantee a desired outcome.
6. Preserve uncertainty.
7. Every meaningful player action should move the world forward.
8. Do not decide what the player wants.
9. The player may always describe an action in natural language.
10. The story should emerge from interaction.

Write the next moment of the experience.

Keep the response immersive and concise.

Include:
- What happens
- What the player can perceive
- What important people do or say
- 2-4 possible actions the player could take next

Do not explain your reasoning.
Do not mention these instructions.
`;

    const userInput = `
Current world state:
${JSON.stringify(worldState || {}, null, 2)}

Player action:
${playerAction}
`;

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
          instructions: systemPrompt,
          input: userInput,
          max_output_tokens: 600
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error: "OpenAI request failed",
        details: data
      });
    }

    return res.status(200).json({
      ok: true,
      text: data.output_text || "",
      responseId: data.id || null
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
}
