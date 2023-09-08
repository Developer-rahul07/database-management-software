const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
const userController = require('../Controller/userController');
const checkAuth = require('../middleware/auth');
const path = require('path');
const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './assets/pdf');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

const upload = multer({ storage: storage })

router.post('/multiSearch', userController.multiSearch);

// router.post('/pdf/:PDFNAME', userController.pdfcomment);
// router.get('/pdfcomment', (req, res) => {
//     res.render('pdfView', { view: viewdata });
// })


router.get('/allsearch', userController.allsearch);

router.get('/excelinfo', userController.excelInfo)

// update excel from registered user get route
router.post('/excelinfo', userController.getExceldata);

router.get('/updateexcel', (req, res) => {
    res.render('UpdateExcel');
});

router.post('/editexcel', upload.single('myfile'), userController.editExceldata);

// Add entry get
router.get('/addentyInfo', userController.addentryData)

// Add entry post
router.post('/addenty', upload.single('myfile'), userController.addEntrydata);

// delete entry get
router.post('/deleteInfo', userController.deleteInfo);
// delete entry post


// update user from registered user get route
router.get('/allsearch/:sn', userController.getupdateallsearch);


// delete list page post route
router.get('/alllist', checkAuth, userController.allList);

router.get('/deleteList/:sn', userController.deleteList);


router.get('/pdfPath', (req, res) => {
    res.render('pdfPath');
})

router.post('/pdfPath', userController.pdfPath);

// Add list page get route
router.get('/list', (req, res) => {
    res.render('List');
})

// Add list page post route
router.post('/list', userController.addList);

// permission button page
router.get('/admin', checkAuth, (req, res) => {
    var data = req.userData
    // console.log(data)
    res.render('Admin', { permission: data });
})

// About Page
router.get('/about', (req, res) => {
    res.render('About');
})

// Software Details Page
router.get('/software_detail', (req, res) => {
    res.render('Software_detail');
})

// Saerch Page 
router.get('/search', checkAuth, userController.searchUser)

router.get('/listviewpage', checkAuth, userController.listviewpage)

// Route for pdf View
router.get('/pdf/:PDFNAME', userController.pdfView);
router.get('/pdfListview/:PDFNAME', userController.pdfViewListview);

// Route for Upload PDF
router.get('/uploadpdf/:PDFNAME', (req, res) => {
    const data = req.params.PDFNAME;
    res.render('UploadPdf', { mypdf: data });
})

router.post('/uploadpdf', upload.single('myfile'), userController.uploadPdf)

// Route for Merge Pdf
router.get('/mergepdf', (req, res) => {
    res.render('MergePdf');
})

router.post('/mergepdf', userController.mergePdf)

// Welcome page 
router.get('/welcome', checkAuth, (req, res) => {
    res.render('Welcome');
})

// Route for Merge Pdf
router.get('/commentinfo/:SRNO', userController.commentInfo)

router.post('/commentinfo', userController.addcommentInfo)

router.get('/comment', (req, res) => {
    res.render('ListComment');
})

router.post('/comment', userController.addComment)


// login get route
router.get('/', userController.getLogin)

router.get('/logout', userController.logout);


// login post route
router.post('/', userController.loginUser);

// all createuser list page
router.get('/alluser', checkAuth, userController.getAlluser);

// create user form get route
router.get('/createuser', (req, res) => {
    res.render('Createuser');
})

// create user form post route
router.post('/createuser', userController.addUser)

// delete user from registered user route
router.get('/:sn', userController.deleteUser);

// update user from registered user get route
router.get('/edit/:sn', userController.getupdateUser);

// delete user from registered user poat route
router.post('/edit/:sn', userController.updateUser);



module.exports = router;
