export function notFound(req, res) {
  res.status(404).json({ message: 'API endpoint not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON request body.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body exceeds the 10 MB limit.' });
  console.error(error);
  res.status(500).json({ message: 'Server error. Please try again.' });
}
