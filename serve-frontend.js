const express = require('express');
const path = require('path');
const app = express();
const port = 5173;

// Serve public static assets
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend serving at http://localhost:${port}`);
});
