const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = err.issues || err.errors || [];
      const messages = issues.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    return res.status(500).json({ success: false, message: 'Validasi gagal' });
  }
};

module.exports = { validate };
