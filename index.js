const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let count = 0;

app.get('/hit', (req, res) => {
    count++;
    res.json({ current_users: count });
});

app.get('/', (req, res) => {
    res.send('Counter Server is Online!');
});

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
