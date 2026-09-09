export default async function handler(request) {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "The World Engine is alive.",
      method: request.method
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
