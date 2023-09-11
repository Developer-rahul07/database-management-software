const express = require('express');
const dotenv = require('dotenv')
const router = require('./Routes/Route');
dotenv.config();
const app = express();
//view engine
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
const cookieParser = require("cookie-parser");
const cors = require("cors")
app.use(cors(
    {
        origin: "http://localhost:4000"

    }
));

const port = process.env.PORT || 4000;

app.use(cookieParser());


//Middleare
app.use('/', router)

app.listen(port, () => console.log(`server is running at http://localhost:${port}`));

