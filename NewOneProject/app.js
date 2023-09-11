const express = require('express');
const app = express();
const port = 2000;

// Set up EJS as your view engine
app.set('view engine', 'ejs');

app.use(express.static('public')); // Serve static files (CSS, JS, etc.) from a 'public' folder

// Mock database for demonstration
const mockDatabase = ['result1', 'result2', 'result3', "naaau"];

// Route to serve the search page
app.get('/search', (req, res) => {
    res.render('search'); // Render the EJS template
});

// Route to handle AJAX requests for real-time search
app.get('/search/query', (req, res) => {
    const searchTerm = req.query.q;

    // Perform a database query using the searchTerm
    // Example using a mock database:
    const searchResults = mockDatabase.filter(item => item.includes(searchTerm));

    res.json(searchResults);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
