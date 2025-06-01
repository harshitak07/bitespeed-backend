const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const identifyRoutes = require('./routes/identifyRoute');

const app = express();
app.use(bodyParser.json());

app.use('/', identifyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
