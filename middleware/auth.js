var jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {

    try {
        const token = req.cookies.jwt;
        // console.log("mera Token" +  token);
        var decode = jwt.verify(token, 'secret');
        req.userData = decode;
        next();
    } catch (error) {
        // res.status(401).json({
        //     error: "Invalid Token"
        // });
        res.render('login');
    }

}