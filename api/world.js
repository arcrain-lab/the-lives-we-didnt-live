export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: "The World Engine is alive.",
    method: req.method
  });
}
