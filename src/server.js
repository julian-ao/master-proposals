const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3001;

app.get('/api/projects', async (req, res) => {
    try {
        const { program, sort } = req.query;
        const url = `https://www.idi.ntnu.no/education/fordypningsprosjekt.php?${program}=1&s=${sort || 2}`;

        const response = await axios.get(url);
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Error fetching projects');
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});