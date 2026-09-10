export default async function handler(req, res) {
  // =====================================================
  // CORS
  // =====================================================

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
    // =====================================================
    // INPUT
    // =====================================================

    const { playerAction, worldState } = req.body || {};

    if (!playerAction) {
      return res.status(400).json({
        ok: false,
        error: "Missing playerAction"
      });
    }

    // =====================================================
    // WORLD ENGINE PROMPT
    // =====================================================

    const systemPrompt = `
You are the World Engine for "The Lives We Didn't Live."

This is an interactive narrative set in a realistic version of Boston.

You are NOT writing a predetermined story.

You simulate the next believable moment after the player's action.

The world should feel like a living place rather than a linear story.

CORE PRINCIPLES:

1. The player controls only their own actions and intentions.

2. The player does NOT control other people's reactions.

3. Other people have their own agency, motivations, boundaries, moods,
   schedules, relationships, and incomplete information.

4. The world follows realistic physical, social, cultural, legal,
   financial, and temporal rules.

5. Never guarantee the player's desired outcome.

6. Uncertainty is part of the experience.

7. The selected Journey theme affects emotional tone and atmosphere,
   NOT the guaranteed outcome.

8. Intensity affects how emotionally or situationally significant
   moments may feel, but does not force dramatic events.

9. Tempo affects story density:
   - Slow: allow more sensory detail and small moments.
   - Normal: balanced pacing.
   - Fast: skip uneventful moments and move forward efficiently.

10. Every meaningful player action should move the world forward.

11. The journey begins at the exact date and time provided
    in the current world state.

12. Treat the current world-state time as the canonical in-world time.

13. Never reset the time to an earlier time or invent a new starting time.

14. Advance time realistically according to the player's action.
    Walking, traveling, conversations, waiting, eating, working,
    and other activities should consume plausible amounts of time.

15. If an action takes only a short amount of time, advance the clock
    only by a few minutes.

16. Always return the updated in-world date and time in the "time" field.

17. Preserve continuity.

18. Do not reset the world.

19. Remember people, locations, relationships, events,
    unresolved threads, and consequences from the current world state.

20. Do not force drama when an ordinary response is more believable.

21. Natural language actions are always allowed.

22. Interpret the player's action reasonably while preserving
    what the player actually chose.

23. Do not narrate thoughts, feelings, or intentions for the player
    unless the player explicitly stated them.

24. Do not make every moment special.
    Ordinary moments are important too.

25. The world should contain small unexpected details,
    but avoid artificial twists.

26. Generate the next meaningful moment, not an entire chapter.

--------------------------------------------------
VISUAL / READING STYLE
--------------------------------------------------

The response will be displayed as a structured interactive scene.

Keep each section short and visually clear.

ENVIRONMENT:
1–2 short sentences.
Describe only the physical surroundings, atmosphere, weather,
sounds, movement, or sensory details that matter now.

EVENT:
1–2 short sentences.
Describe what has changed or what is happening now.

PEOPLE:
When a person is relevant, describe them briefly.
Their description should be visually useful:
clothing, approximate age, expression, posture, or another
distinctive detail.

DIALOGUE:
Use short, natural dialogue.
Usually one or two sentences.

Do NOT write long paragraphs.

Do NOT repeat information already obvious from the world state.

Do NOT turn every response into a dramatic scene.

--------------------------------------------------
PEOPLE AND VISUAL MEMORY
--------------------------------------------------

The world should distinguish between ordinary moments
and moments worth remembering.

Set shouldGenerateImage = true when:

- an important person is being introduced for the first time, OR
- a genuinely memorable visual moment occurs, OR
- a visually distinctive person is introduced and their appearance
  is relevant to the current scene.

Do not generate images for ordinary movement,
routine conversation, or every scene.

For the first meaningful person the player encounters,
prefer imageType = "character" if the person is visually describable.

Otherwise:

shouldGenerateImage = false
imageType = "none"

If an important new person is introduced:

imageType = "character"

If a genuinely memorable visual moment should be preserved:

imageType = "memory"

IMAGE PROMPT:

If imageType = "none":
    imagePrompt = ""

If imageType = "character":
    Write a concise visual description for an image-generation model.
    Describe the person's approximate age, appearance, hair, clothing,
    posture, expression, and relevant surroundings.
    Focus on visually observable details.
    Do not describe their thoughts or personality abstractly.

If imageType = "memory":
    Write a concise visual description of the memorable moment.
    Describe the setting, people, composition, lighting, atmosphere,
    and important visual details.

The imagePrompt should be concise and visually specific.
Do not write a story or dialogue inside imagePrompt.

Do not generate images for ordinary movement,
routine conversation, or every scene.

The principle is:

"The world doesn't need to be illustrated.
People and memories do."

--------------------------------------------------
WORLD STATE
--------------------------------------------------

Update the world state whenever something meaningful changes.

Preserve:

- current time
- current location
- people
- relationships
- events
- unresolved threads
- important consequences
- player information
- journey settings

Do not erase existing information merely because it is not
mentioned in the current scene.

--------------------------------------------------
CHOICES
--------------------------------------------------

Provide 2–4 plausible choices.

Choices should represent genuinely different actions.

Do not make one choice obviously correct.

Do not guarantee outcomes.

The player may always ignore these choices and type
their own action in natural language.

--------------------------------------------------
MEMORY
--------------------------------------------------

Set memoryMoment = true only when this moment could reasonably
become a meaningful memory of the journey.

Most ordinary moments should have memoryMoment = false.

--------------------------------------------------
OUTPUT
--------------------------------------------------

Return ONLY the structured JSON requested by the schema.
`;

    // =====================================================
    // USER PROMPT
    // =====================================================

    const userPrompt = `
PLAYER ACTION:

${playerAction}


CURRENT WORLD STATE:

${JSON.stringify(worldState || {}, null, 2)}


Generate the next meaningful moment.

Preserve continuity with the existing world.

Do not restart the journey.

Return a concise, visually structured moment.
`;

    // =====================================================
    // OPENAI REQUEST
    // =====================================================

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

                  // -------------------------------------
                  // SCENE TITLE
                  // -------------------------------------

                  sceneTitle: {
                    type: "string"
                  },

                  // -------------------------------------
                  // TIME
                  // -------------------------------------

                  time: {
                    type: "string"
                  },

                  // -------------------------------------
                  // LOCATION
                  // -------------------------------------

                  location: {
                    type: "string"
                  },

                  // -------------------------------------
                  // ENVIRONMENT
                  // -------------------------------------

                  environment: {
                    type: "string"
                  },

                  // -------------------------------------
                  // EVENT
                  // -------------------------------------

                  event: {
                    type: "string"
                  },

                  // -------------------------------------
                  // PEOPLE
                  // -------------------------------------

                  people: {
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
                        },

                        dialogue: {
                          type: "string"
                        }

                      },

                      required: [
                        "name",
                        "description",
                        "dialogue"
                      ]
                    }
                  },

                  // -------------------------------------
                  // GENERAL DIALOGUE FALLBACK
                  // -------------------------------------

                  dialogue: {
                    type: "object",

                    additionalProperties: false,

                    properties: {

                      speaker: {
                        type: "string"
                      },

                      text: {
                        type: "string"
                      }

                    },

                    required: [
                      "speaker",
                      "text"
                    ]
                  },

                  // -------------------------------------
                  // PLAYER CHOICES
                  // -------------------------------------

                  choices: {
                    type: "array",

                    items: {
                      type: "string"
                    }
                  },

                  // -------------------------------------
                  // WORLD STATE
                  // -------------------------------------

                  worldState: {
                    type: "string"
                  },

                  // -------------------------------------
                  // IMAGE SIGNAL
                  // -------------------------------------

                  shouldGenerateImage: {
                    type: "boolean"
                  },

                 imageType: {
                    type: "string",
                  
                    enum: [
                      "none",
                      "character",
                      "memory"
                    ]
                  },
                  
                  imagePrompt: {
                    type: "string"
                  },

                  // -------------------------------------
                  // MEMORY
                  // -------------------------------------

                  memoryMoment: {
                    type: "boolean"
                  }

                },

                required: [
                  "sceneTitle",
                  "time",
                  "location",
                  "environment",
                  "event",
                  "people",
                  "dialogue",
                  "choices",
                  "worldState",
                  "shouldGenerateImage",
                  "imageType",
                  "imagePrompt",
                  "memoryMoment"
                ]
              }
            }
          },

          max_output_tokens: 1200
        })
      }
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    const data = await response.json();

    // -----------------------------------------------------
    // OPENAI ERROR
    // -----------------------------------------------------

    if (!response.ok) {

      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        ok: false,
        error: data
      });
    }

    // =====================================================
    // GET MODEL OUTPUT
    // =====================================================

    let text = data.output_text || "";

    // Fallback extraction
    if (!text && Array.isArray(data.output)) {

      for (const item of data.output) {

        if (!Array.isArray(item.content)) {
          continue;
        }

        for (const content of item.content) {

          if (
            content.type === "output_text" &&
            content.text
          ) {

            text += content.text;

          }
        }
      }
    }

    // =====================================================
    // NO OUTPUT
    // =====================================================

    if (!text) {

      console.error("No model output:", data);

      return res.status(500).json({
        ok: false,
        error: "The World Engine returned no text."
      });
    }

    // =====================================================
    // PARSE JSON
    // =====================================================

    let result;

    try {

      result = JSON.parse(text);

    } catch (error) {

      console.error("Invalid JSON:", text);

      return res.status(500).json({
        ok: false,
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    // =====================================================
    // CONVERT WORLD STATE BACK INTO OBJECT
    // =====================================================

    if (typeof result.worldState === "string") {

      try {

        result.worldState =
          JSON.parse(result.worldState);

      } catch (error) {

        console.error(
          "worldState parsing failed:",
          result.worldState
        );

        result.worldState = {};
      }
    }

    // =====================================================
    // SAFETY DEFAULTS
    // =====================================================

    if (!Array.isArray(result.people)) {
      result.people = [];
    }

    if (!Array.isArray(result.choices)) {
      result.choices = [];
    }

    if (!result.dialogue) {
      result.dialogue = {
        speaker: "",
        text: ""
      };
    }

    if (
      result.imageType !== "character" &&
      result.imageType !== "memory" &&
      result.imageType !== "none"
    ) {
      result.imageType = "none";
    }

    if (result.imageType === "none") {
      result.shouldGenerateImage = false;
      result.imagePrompt = "";
    }

    // =====================================================
    // IMAGE GENERATION
    // =====================================================

    let imageData = null;

    if (
      result.shouldGenerateImage === true &&
      result.imageType === "character" &&
      result.imagePrompt
    ) {
      console.log("Generating character image...");

      try {
        const imageResponse = await fetch(
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

              input: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text:
                        `Generate an image based on this visual description:\n\n${result.imagePrompt}`
                    }
                  ]
                }
              ],

              tools: [
                {
                  type: "image_generation",
                  model: "gpt-image-2",
                  size: "1024x1024",
                  quality: "medium"
                }
              ]
            })
          }
        );

        const imageResult =
          await imageResponse.json();

        if (!imageResponse.ok) {

          console.error(
            "Image generation failed:",
            imageResult
          );

        } else {

          const imageCall =
            imageResult.output?.find(
              item =>
                item.type ===
                "image_generation_call"
            );

          if (imageCall?.result) {

            imageData =
              `data:image/png;base64,${imageCall.result}`;

            console.log(
              "Character image generated successfully."
            );

          } else {

            console.error(
              "No image result returned:",
              imageResult
            );
          }
        }

      } catch (error) {

        console.error(
          "Image generation error:",
          error
        );
      }
    }
    
    // =====================================================
    // RETURN
    // =====================================================
    
    return res.status(200).json({
      ok: true,
      ...result,
      imageData,
      responseId: data.id
    });

  } catch (error) {

    console.error(
      "World Engine error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        error.message ||
        "Unknown server error"
    });
  }
}
