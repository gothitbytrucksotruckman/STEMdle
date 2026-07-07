const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve files from the root directory (where index.html now lives)
app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`STEMdle running on http://localhost:${PORT}`));
