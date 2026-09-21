// ============================================================
// WORLD ENGINE
// The Lives We Didn't Live
// Persistent World + Persistent NPCs + Persistent Locations
// + Player Avatar Transformation + Environment Images
// ============================================================

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {

    // ============================================================
    // INPUT
    // ============================================================

    const {
      playerAction,
      worldState = {},
      initialScene = false,
      generatePlayerAvatar = false,
      playerPhoto = ""
    } = req.body || {};

    if (!playerAction) {
      return res.status(400).json({
        ok: false,
        error: "Missing playerAction"
      });
    }


    // ============================================================
    // WORLD PHILOSOPHY
    // ============================================================

    const systemPrompt = `
You are the World Engine for an interactive life simulation called
"The Lives We Didn't Live."

You are NOT a narrator who forces a story.

You simulate a persistent world.

The player controls only their own actions.

NPCs have:
- their own goals
- motivations
- emotions
- routines
- relationships
- memories
- incomplete information
- personal boundaries
- changing circumstances

Locations have:
- persistent identities
- stable names
- stable addresses
- stable physical descriptions
- consistent visual identity

The world follows realistic:
- physical rules
- social rules
- cultural rules
- legal rules
- financial rules
- geographic rules
- temporal rules

Do not manufacture drama merely to make the story interesting.

Do not force:
- romance
- conflict
- danger
- friendship
- success
- failure
- emotional breakthroughs

unless they naturally follow from the player's actions and the world state.

Small ordinary events are valid.

The world should sometimes feel uneventful.

NPCs should not know information they could not reasonably know.

The player should not automatically be the center of attention.

Maintain continuity with previous world state.

If a location already exists in worldState,
reuse that location instead of inventing a duplicate.

If an NPC already exists in worldState,
reuse that NPC instead of inventing a duplicate.

Names, addresses, relationships, memories and physical appearance
should remain consistent.

Time must progress naturally.

Weather and environment should be plausible for Boston
and the current date/time.

The world should feel like a believable alternate life
rather than a scripted video game.
`;


    // ============================================================
    // INITIAL SCENE
    // ============================================================

    const initialSceneInstruction = initialScene
      ? `
THIS IS THE VERY FIRST SCENE OF THE JOURNEY.

Create the player's first believable moment in Boston.

IMPORTANT:

1. Choose ONE specific real-world-feeling location in Boston.

Do NOT simply say:
- Boston
- Downtown Boston
- a street in Boston

Instead choose a specific place such as:
- a particular public square
- a specific neighborhood street
- a specific park
- a specific MBTA station
- a specific library
- a specific waterfront area
- a specific café
- a specific market
- a specific community space
- another plausible specific Boston location

The place should make sense at the current time.

2. The first scene should be visually distinctive.

3. environmentImagePrompt MUST describe the actual location.

Include:
- specific location
- architecture
- street/interior layout
- nearby recognizable physical features
- time of day
- weather
- lighting
- atmosphere
- surrounding objects
- realistic Boston details

4. The environment image should primarily depict the LOCATION,
not a close-up portrait of the player.

5. The environment should feel like a real Boston place
interpreted through the game's illustrated graphic-novel visual style.

6. Do not invent a fantasy location.

7. imageTypes MUST contain "environment".

8. The first scene should not automatically introduce an NPC
unless there is a natural reason for one to be present.

9. Do not force an important event.

The first scene can simply establish:
- where the player is
- what time it is
- what the environment feels like
- what is happening around them
- what they can reasonably choose to do next
`
      : "";


    // ============================================================
    // WORLD STATE CONTEXT
    // ============================================================

    const worldStateContext =
      JSON.stringify(
        worldState || {},
        null,
        2
      );


    // ============================================================
    // USER PROMPT
    // ============================================================

    const userPrompt = `
PLAYER ACTION:
${playerAction}

CURRENT WORLD STATE:
${worldStateContext}

${initialSceneInstruction}

Return the next state of the world.

Remember:

- Do not rewrite existing NPC identities.
- Do not duplicate existing locations.
- Do not randomly move NPCs without a reason.
- Do not force an event.
- Do not make everyone react to the player.
- Keep the world grounded and continuous.
- The player can fail.
- The player can be ignored.
- The player can change their mind.
- NPC relationships should change gradually.
- Memories should only be created when something meaningfully memorable happens.
`;


    // ============================================================
    // JSON SCHEMA
    // ============================================================

    const schema = {

      type: "object",

      additionalProperties: false,

      properties: {

        sceneTitle: {
          type: "string"
        },

        time: {
          type: "string"
        },

        location: {
          type: "string"
        },

        locationIsNew: {
          type: "boolean"
        },

        locationDescription: {
          type: "string"
        },

        locationAddress: {
          type: "string"
        },

        environment: {
          type: "string"
        },

        event: {
          type: "string"
        },

        people: {

          type: "array",

          items: {

            type: "object",

            additionalProperties: false,

            properties: {

              name: {
                type: "string"
              },

              isNew: {
                type: "boolean"
              },

              description: {
                type: "string"
              },

              dialogue: {
                type: "string"
              },

              currentState: {
                type: "string"
              },

              relationshipChange: {
                type: "string"
              },

              memoryToAdd: {
                type: "string"
              },

              characterImagePrompt: {
                type: "string"
              }

            },

            required: [
              "name",
              "isNew",
              "description",
              "dialogue",
              "currentState",
              "relationshipChange",
              "memoryToAdd",
              "characterImagePrompt"
            ]

          }

        },

        dialogue: {
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

        shouldGenerateImage: {
          type: "boolean"
        },

        imageTypes: {

          type: "array",

          items: {

            type: "string",

            enum: [
              "environment",
              "npc",
              "memory"
            ]

          }

        },

        imagePrompt: {
          type: "string"
        },

        environmentImagePrompt: {
          type: "string"
        },

        memoryMoment: {
          type: "string"
        },

        memoryCaption: {
          type: "string"
        }

      },

      required: [

        "sceneTitle",
        "time",
        "location",
        "locationIsNew",
        "locationDescription",
        "locationAddress",
        "environment",
        "event",
        "people",
        "dialogue",
        "choices",
        "worldState",
        "shouldGenerateImage",
        "imageTypes",
        "imagePrompt",
        "environmentImagePrompt",
        "memoryMoment",
        "memoryCaption"

      ]

    };


    // ============================================================
    // OPENAI WORLD ENGINE
    // ============================================================

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

          input: [

            {
              role: "system",

              content: [
                {
                  type: "input_text",
                  text: systemPrompt
                }
              ]
            },

            {
              role: "user",

              content: [
                {
                  type: "input_text",
                  text: userPrompt
                }
              ]
            }

          ],

          text: {

            format: {

              type: "json_schema",

              name: "world_engine_response",

              strict: true,

              schema

            }

          }

        })

      }
    );


    // ============================================================
    // HANDLE WORLD ENGINE ERROR
    // ============================================================

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "OpenAI World Engine error:",
        errorText
      );

      return res.status(response.status).json({
        ok: false,
        error: errorText
      });

    }


    // ============================================================
    // PARSE RESPONSE
    // ============================================================

    const data =
      await response.json();

    const outputText =
      data.output_text ||
      data.output
        ?.map(item =>
          item.type === "message"
            ? item.content
                ?.map(c => c.text || "")
                .join("")
            : ""
        )
        .join("") ||
      "";

    if (!outputText) {

      throw new Error(
        "World Engine returned no structured output."
      );

    }


    let result;

    try {

      result =
        JSON.parse(outputText);

    } catch (parseError) {

      console.error(
        "World Engine JSON parse error:",
        outputText
      );

      throw new Error(
        "World Engine returned invalid JSON."
      );

    }


    // ============================================================
    // NORMALIZE WORLD STATE
    // ============================================================

    if (
      !result.worldState ||
      typeof result.worldState !== "object"
    ) {

      result.worldState = {};

    }

    if (
      !Array.isArray(
        result.worldState.locations
      )
    ) {

      result.worldState.locations = [];

    }

    if (
      !Array.isArray(
        result.worldState.people
      )
    ) {

      result.worldState.people = [];

    }


    // ============================================================
    // LOCATION RECONCILIATION
    // ============================================================

    if (result.location) {

      const normalizedLocationName =
        String(result.location)
          .trim()
          .toLowerCase();

      let existingLocation =
        result.worldState.locations.find(
          location => {

            const name =
              String(location.name || "")
                .trim()
                .toLowerCase();

            const address =
              String(location.address || "")
                .trim()
                .toLowerCase();

            const incomingAddress =
              String(result.locationAddress || "")
                .trim()
                .toLowerCase();

            return (
              name === normalizedLocationName ||
              (
                incomingAddress &&
                address &&
                address === incomingAddress
              )
            );

          }
        );


      // ----------------------------------------------------------
      // NEW LOCATION
      // ----------------------------------------------------------

      if (!existingLocation) {

        const slug =
          normalizedLocationName
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 80);

        existingLocation = {

          entityId:
            `loc_${slug || "unknown"}`,

          name:
            result.location,

          address:
            result.locationAddress || "",

          description:
            result.locationDescription || "",

          visualIdentity:
            result.locationDescription || "",

          firstSeen:
            result.time || "",

          lastSeen:
            result.time || ""

        };

        result.worldState.locations.push(
          existingLocation
        );

        result.locationIsNew = true;

      }


      // ----------------------------------------------------------
      // EXISTING LOCATION
      // ----------------------------------------------------------

      else {

        existingLocation.lastSeen =
          result.time ||
          existingLocation.lastSeen ||
          "";

        if (
          result.locationDescription &&
          !existingLocation.description
        ) {

          existingLocation.description =
            result.locationDescription;

        }

        if (
          result.locationAddress &&
          !existingLocation.address
        ) {

          existingLocation.address =
            result.locationAddress;

        }

        result.locationIsNew = false;

      }


      result.locationEntityId =
        existingLocation.entityId;

    }


    // ============================================================
    // NPC RECONCILIATION
    // ============================================================

    const normalizedPeople =
      Array.isArray(result.people)
        ? result.people
        : [];


    for (
      const person
      of normalizedPeople
    ) {

      if (
        !person ||
        !person.name
      ) {
        continue;
      }


      const normalizedPersonName =
        String(person.name)
          .trim()
          .toLowerCase();


      let existingPerson =
        result.worldState.people.find(
          npc =>
            String(npc.name || "")
              .trim()
              .toLowerCase() ===
            normalizedPersonName
        );


      // ----------------------------------------------------------
      // NEW NPC
      // ----------------------------------------------------------

      if (!existingPerson) {

        const slug =
          normalizedPersonName
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 80);


        existingPerson = {

          entityId:
            `npc_${slug || "unknown"}`,

          name:
            person.name,

          description:
            person.description || "",

          visualIdentity:
            person.characterImagePrompt || "",

          currentState:
            person.currentState || "",

          relationship:
            person.relationshipChange || "",

          memories: [],

          firstSeen:
            result.time || "",

          lastSeen:
            result.time || ""

        };


        result.worldState.people.push(
          existingPerson
        );


        person.isNew = true;

      }


      // ----------------------------------------------------------
      // EXISTING NPC
      // ----------------------------------------------------------

      else {

        existingPerson.lastSeen =
          result.time ||
          existingPerson.lastSeen ||
          "";


        if (
          person.currentState
        ) {

          existingPerson.currentState =
            person.currentState;

        }


        if (
          person.description &&
          !existingPerson.description
        ) {

          existingPerson.description =
            person.description;

        }


        person.isNew = false;

      }


      person.entityId =
        existingPerson.entityId;


      // ----------------------------------------------------------
      // NPC MEMORY
      // ----------------------------------------------------------

      if (
        person.memoryToAdd &&
        person.memoryToAdd.trim()
      ) {

        if (
          !Array.isArray(
            existingPerson.memories
          )
        ) {

          existingPerson.memories = [];

        }


        existingPerson.memories.push({

          text:
            person.memoryToAdd,

          time:
            result.time || ""

        });

      }

    }


    // ============================================================
    // IMAGE TYPES
    // ============================================================

    const imageTypes =
      Array.isArray(result.imageTypes)
        ? result.imageTypes
        : [];


    // The first scene ALWAYS gets an environment image.

    if (
      initialScene &&
      !imageTypes.includes("environment")
    ) {

      imageTypes.push("environment");

    }


    result.imageTypes =
      imageTypes;


    // ============================================================
    // FALLBACK ENVIRONMENT PROMPT
    // ============================================================

    if (
      initialScene &&
      !result.environmentImagePrompt
    ) {

      result.environmentImagePrompt = [

        result.location ||
          "Boston",

        result.locationAddress ||
          "",

        result.locationDescription ||
          "",

        result.environment ||
          "",

        "Realistic Boston establishing shot.",

        "Specific real-world location.",

        "Illustrated graphic-novel visual style."

      ]
        .filter(Boolean)
        .join("\n");

    }


    // ============================================================
    // IMAGE JOBS
    // ============================================================

    const imageJobs = [];


    // ============================================================
    // ENVIRONMENT IMAGE
    // ============================================================

    if (
      imageTypes.includes("environment") &&
      result.location
    ) {

      imageJobs.push({

        type: "environment",

        id:
          result.locationEntityId ||
          `loc_${Date.now()}`,

        prompt: `

Create a persistent environment illustration for an
interactive life simulation.

LOCATION:
${result.location}

ADDRESS:
${result.locationAddress || ""}

LOCATION DESCRIPTION:
${result.locationDescription || ""}

ENVIRONMENT:
${result.environment || ""}

SPECIFIC ENVIRONMENT DESCRIPTION:
${result.environmentImagePrompt || ""}

VISUAL STYLE:

- hand-drawn graphic novel illustration
- clean expressive linework
- painterly shading
- soft cinematic lighting
- realistic but slightly stylized proportions
- atmospheric storytelling
- natural colors
- believable architecture
- believable Boston streets and surroundings
- detailed environmental objects
- realistic spatial composition

The image should establish the LOCATION as a persistent place.

It should NOT primarily be a portrait.

It should feel like a real place that could be revisited later.

No:
- text
- captions
- speech bubbles
- logos
- watermarks
- fantasy architecture
- photorealistic skin texture
- 3D-rendered appearance

`,

        size: "1536x1024"

      });

    }


    // ============================================================
    // NPC IMAGES
    // ============================================================

    for (
      const person
      of normalizedPeople
    ) {

      if (
        person.isNew &&
        person.entityId
      ) {

        imageJobs.push({

          type: "npc",

          id:
            person.entityId,

          prompt: `

Create a persistent character identity illustration.

CHARACTER:
${person.name}

DESCRIPTION:
${person.description || ""}

CURRENT STATE:
${person.currentState || ""}

CHARACTER VISUAL PROMPT:
${person.characterImagePrompt || ""}

STYLE:

- hand-drawn graphic novel
- clean expressive linework
- painterly shading
- soft cinematic lighting
- realistic but slightly stylized human proportions
- natural clothing
- believable everyday human appearance
- consistent facial structure

This image establishes the character's
persistent visual identity.

Do not make the character look like a celebrity.

Do not make them glamorous unless
their description requires it.

No:
- text
- captions
- speech bubbles
- logos
- watermarks
- photorealistic skin texture
- 3D-rendered appearance

`,

          size:
            "1024x1536"

        });

      }

    }


    // ============================================================
    // MEMORY IMAGE
    // ============================================================

    if (
      result.memoryMoment &&
      result.memoryMoment.trim()
    ) {

      imageJobs.push({

        type: "memory",

        id:
          `memory_${Date.now()}`,

        prompt: `

Create a memory illustration for the player's life.

MEMORY:
${result.memoryMoment}

CAPTION:
${result.memoryCaption || ""}

This is NOT a portrait.

It should visually capture the specific moment.

STYLE:

- hand-drawn graphic novel
- expressive composition
- painterly shading
- soft cinematic lighting
- realistic but slightly stylized proportions
- emotional but understated
- atmospheric
- grounded in everyday life

No:
- text
- captions
- speech bubbles
- logos
- watermarks

`,

        size:
          "1536x1024"

      });

    }


    // ============================================================
    // PLAYER AVATAR
    // ============================================================

    let playerAvatarJob = null;


    if (
      initialScene &&
      generatePlayerAvatar &&
      playerPhoto
    ) {

      playerAvatarJob = {

        type: "player",

        id:
          "player_avatar",

        inputImage:
          playerPhoto,

        prompt: `

Transform the supplied reference photograph into a
persistent illustrated character identity for an
interactive graphic-novel life simulation.

IMPORTANT:

The supplied photograph is a REFERENCE for the player's identity.

Preserve:

- recognizable facial identity
- face shape
- major facial features
- hairstyle
- hair color
- approximate age
- overall appearance
- natural proportions

Do NOT:

- beautify the person
- make them younger
- make them older
- change their identity
- dramatically change facial structure
- turn them into a celebrity
- sexualize the appearance

Convert the photographic reference into:

- hand-drawn graphic-novel character
- clean expressive linework
- painterly shading
- soft cinematic lighting
- realistic but slightly stylized proportions
- warm atmospheric storytelling
- natural human appearance

The result should look like a character from the SAME visual world
as the Boston environment illustrations.

This image will appear in the LEFT CHARACTER panel.

Create a vertically oriented character portrait.

No:

- photorealistic skin texture
- 3D-rendered appearance
- text
- captions
- speech bubbles
- logos
- watermarks

`,

        size:
          "1024x1536"

      };

    }


    // ============================================================
    // GENERATE IMAGES
    // ============================================================

    const jobsToGenerate = [
      ...imageJobs
    ];


    if (playerAvatarJob) {

      jobsToGenerate.push(
        playerAvatarJob
      );

    }


    const generatedImages = [];


    for (
      const job
      of jobsToGenerate
    ) {

      try {

        const content = [];


        // --------------------------------------------------------
        // INPUT IMAGE
        // --------------------------------------------------------

        if (job.inputImage) {

          content.push({

            type:
              "input_image",

            image_url:
              job.inputImage,

            detail:
              "high"

          });

        }


        // --------------------------------------------------------
        // IMAGE PROMPT
        // --------------------------------------------------------

        content.push({

          type:
            "input_text",

          text:
            job.prompt

        });


        // --------------------------------------------------------
        // IMAGE GENERATION
        // --------------------------------------------------------

        const imageResponse =
          await fetch(
            "https://api.openai.com/v1/responses",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${process.env.OPENAI_API_KEY}`

              },

              body:
                JSON.stringify({

                  model:
                    "gpt-5.6-luna",

                  input: [

                    {

                      role:
                        "user",

                      content

                    }

                  ],

                  tools: [

                    {

                      type:
                        "image_generation",

                      model:
                        "gpt-image-2",

                      action:
                        job.inputImage
                          ? "auto"
                          : "generate",

                      size:
                        job.size ||
                        "1024x1024",

                      quality:
                        "medium"

                    }

                  ]

                })

            }

          );


        if (!imageResponse.ok) {

          const imageError =
            await imageResponse.text();

          console.error(
            "Image generation failed:",
            imageError
          );

          continue;

        }


        const imageData =
          await imageResponse.json();


        // --------------------------------------------------------
        // EXTRACT GENERATED IMAGE
        // --------------------------------------------------------

        let imageBase64 = null;


        if (
          Array.isArray(
            imageData.output
          )
        ) {

          for (
            const outputItem
            of imageData.output
          ) {

            if (
              outputItem.type ===
              "image_generation_call"
            ) {

              if (
                outputItem.result
              ) {

                imageBase64 =
                  outputItem.result;

              }

            }

          }

        }


        if (!imageBase64) {

          console.warn(
            "No generated image found for:",
            job.type,
            job.id
          );

          continue;

        }


        generatedImages.push({

          type:
            job.type,

          id:
            job.id,

          data:
            `data:image/png;base64,${imageBase64}`

        });


      } catch (imageError) {

        console.error(
          "Image generation exception:",
          imageError
        );

      }

    }


    // ============================================================
    // SPLIT IMAGE RESULTS
    // ============================================================

    const assetUpdates = [];

    let playerAvatarData = null;


    for (
      const generated
      of generatedImages
    ) {

      if (
        generated.type === "player"
      ) {

        playerAvatarData =
          generated.data;

        continue;

      }


      assetUpdates.push({

        type:
          generated.type,

        id:
          generated.id,

        data:
          generated.data

      });

    }


    // ============================================================
    // RETURN
    // ============================================================

    return res.status(200).json({

      ok: true,

      ...result,

      assetUpdates,

      playerAvatarData,

      initialScene,

      responseId:
        data.id

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
