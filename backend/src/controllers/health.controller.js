
export const getHealth = (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
};

