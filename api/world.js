export default async function handler(req, res) {
  try {
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
          instructions: `
You are testing the World Engine for
"The Lives We Didn't Live."

Respond to the player's action as if this were
the beginning of a realistic interactive story.

Keep it short, immersive, and human.

The player can choose their own actions,
but cannot control what other people do.

Do not explain your reasoning.
          `,
          input: "I walk toward a woman sitting near the Charles River and ask if she needs help.",
          max_output_tokens: 250
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data
      });
    }

    return res.status(200).json({
      ok: true,
      message: "AI World Engine is working.",
      responseId: data.id,
      text: data.output_text || extractText(data)
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

function extractText(data) {
  try {
    return data.output
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");
  } catch {
    return "";
  }
}
