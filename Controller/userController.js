var sqlite3 = require('sqlite3').verbose();
const { PDFDocument } = require("pdf-lib");
const { writeFileSync, readFileSync } = require("fs");
var jwt = require('jsonwebtoken');
var address = require('address');
var alert = require('alert');
const dotenv = require('dotenv')
dotenv.config();


let db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err && err.code == "SQLITE_CANTOPEN") {
        return;
    } else if (err) {
        console.log("Getting error " + err);
        exit(1);
    }
});


// const allSearchPost = async (req, res) => {
//     let searchResultsData = req.body.searchResultsData;
//     console.log("searchResultsData from client: route.js", searchResultsData.length);

//     res.render("allSearch", { searchResultsData });
// }

const newSearch = async (req, res) => {
    const filename = req.query.filename;
    const year = req.query.year;
    const code = req.query.code;
    const taluk = req.query.taluk;
    const hobli = req.query.hobli;
    const village = req.query.village;
    const survey = req.query.survey;
    const page = req.query.page || 1;
    const resultsPerPage = 50; // Number of results per page

    // Calculate the offset based on the current page
    const offset = (page - 1) * resultsPerPage;

    // Modify your database query to include both filename and year
    const query = `
    SELECT * 
    FROM alldata 
    WHERE FILENAME LIKE '%${filename}%' 
      AND YEAR LIKE '%${year}%' AND CODE LIKE '%${code}%' AND TALUK LIKE '%${taluk}%' AND HOBLI LIKE '%${hobli}%' AND VILLAGE LIKE '%${village}%' AND SURVEYNUMBER LIKE '%${survey}%' LIMIT ${resultsPerPage}
    OFFSET ${offset}
  `;

    // Fetch the total count of matching records without LIMIT/OFFSET
    const totalCountQuery = `
    SELECT COUNT(*) as totalCount
    FROM alldata
    WHERE FILENAME LIKE '%${filename}%' 
      AND YEAR LIKE '%${year}%' AND CODE LIKE '%${code}%' AND TALUK LIKE '%${taluk}%' AND HOBLI LIKE '%${hobli}%' AND VILLAGE LIKE '%${village}%' AND SURVEYNUMBER LIKE '%${survey}%'
  `;

    db.all(query, (err, results) => {
        if (err) {
            console.error('Error executing SQLite query:', err);
            res.status(500).json([]);
            return;
        }

        // Fetch total count of matching records
        db.get(totalCountQuery, (err, row) => {
            if (err) {
                console.error('Error fetching total count:', err);
                res.status(500).json([]);
                return;
            }

            const totalResults = row.totalCount;
            res.json({ results, totalResults });
        });
    });
}


// working fine with commeted code of ejs too
// const newSearch = async (req, res) => {
//     const searchTerm = req.query.q;

//     const query = `SELECT * FROM alldata WHERE FILENAME LIKE '%${searchTerm}%'`;
//     db.all(query, (err, results) => {
//         if (err) {
//             console.error('Error executing SQLite query:', err);
//             res.status(500).json([]);
//             return;
//         }

//         // Pagination
//         const currentPage = parseInt(req.query.page) || 1;
//         const resultsPerPage = 10; // Number of results per page
//         const startIndex = (currentPage - 1) * resultsPerPage;
//         const endIndex = startIndex + resultsPerPage;
//         const pageResults = results.slice(startIndex, endIndex);
//         console.log("serasdsdaatafdtad", pageResults);

//         res.json(pageResults);
//     });
//     // Example using a mock database:


// }

const multiSearch = async (req, res) => {
    const indexName = req.body.indexName;

    const {
        inputFileName,
        inputYear,
        inputCode,
        inputTaluk,
        inputHobli,
        inputVillage,
        inputSurveyNumber
    } = req.body;

    try {
        // Get list of tables
        const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM List`, (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });

        // Collect rows from all tables
        const tableRows = await Promise.all(rows.map((row) => {
            const tableName = row.name;
            let query = `SELECT * FROM ${tableName}`;
            let params = [];

            // Build the WHERE clause dynamically based on available fields
            const whereConditions = [];

            if (inputFileName) {
                whereConditions.push('FILENAME = ?');
                params.push(inputFileName);
            }
            if (inputYear) {
                whereConditions.push('YEAR = ?');
                params.push(inputYear);
            }
            if (inputCode) {
                whereConditions.push('CODE = ?');
                params.push(inputCode);
            }
            if (inputTaluk) {
                whereConditions.push('TALUK = ?');
                params.push(inputTaluk);
            }
            if (inputHobli) {
                whereConditions.push('HOBLI = ?');
                params.push(inputHobli);
            }
            if (inputVillage) {
                whereConditions.push('VILLAGE = ?');
                params.push(inputVillage);
            }
            if (inputSurveyNumber) {
                whereConditions.push('SURVEYNUMBER = ?');
                params.push(inputSurveyNumber);
            }

            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            return new Promise((resolve, reject) => {
                db.all(query, params, (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }));

        // Combine all rows and render template
        const listviewpage = [].concat(...tableRows);

        res.render('multiSearch', { multiSearch: listviewpage, indexName });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};



// const allsearch = async (req, res, next) => {
//     db.all("SELECT * FROM alldata", function (err, rows) {
//         if (err) {
//             console.log(err);
//         }
//         // console.log(rows);
//         res.render('allSearch', { data: rows })
//         // res.status(200).json(rows);
//     });
// }


const allsearch = async (req, res) => {

    if (req.query.searchTerm) {

        const searchTerm = req.query.searchTerm;
        // const searchTerm = "A2CR2/60-61";
        console.log("searchTerm=========", searchTerm);

        // Perform the database query for search
        db.all('SELECT * FROM alldata WHERE FILENAME LIKE ?', [`%${searchTerm}%`], (err, rows) => {
            console.log("rowasssss----", rows.length)
            // console.log("rowasssss----", rows)
            if (err) {
                console.log("Error:", err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.render('allsearch', { data: rows, page: 10, iterator: 10, endingLink: 10, numberOfPages: 10 }, (err, html) => {
                console.log("html--------", html);
                if (err) {
                    console.log("Error:", err);
                    return res.status(500).json({ error: 'Internal server error at allsearch' });
                }
                res.send(html);
            });

            console.log("insdie iffffffffffffffffffffff");


        });
    } else {
        console.log("insdie elseeeeeeeeeeeeeeeeeeeeeeeeeee");
        // Pagination without search
        const resultsPerPage = 100;
        db.all('SELECT * FROM alldata', (error, rows) => {
            if (error) {
                console.log("Error:", error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const numOfResults = rows.length;
            const numberOfPages = Math.ceil(numOfResults / resultsPerPage);
            let page = req.query.page ? Number(req.query.page) : 1;

            // Ensure valid page number
            if (page > numberOfPages) {
                return res.redirect('/?page=' + encodeURIComponent(numberOfPages));
            } else if (page < 1) {
                return res.redirect('/?page=' + encodeURIComponent('1'));
            }

            // Determine SQL LIMIT starting number
            const startingLimit = (page - 1) * resultsPerPage;

            // Get relevant records for the current page
            const sql = `SELECT * FROM alldata LIMIT ${startingLimit},${resultsPerPage}`;
            db.all(sql, (err, result) => {
                if (err) {
                    console.log("Error:", err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const iterator = Math.max(1, page - 5);
                const endingLink = Math.min(iterator + 9, numberOfPages);

                console.log(numberOfPages);
                res.render('allsearch', { data: result, page, iterator, endingLink, numberOfPages });
            });
        });
    }






    // const indexName = req.body.indexName;
    // console.log("allsearch indemane-===================", indexName);

    // try {
    //     // Get list of tables
    //     const rows = await new Promise((resolve, reject) => {
    //         db.all(`SELECT * FROM List`, (error, rows) => {
    //             if (error) {
    //                 reject(error);
    //             } else {
    //                 resolve(rows);
    //             }
    //         });
    //     });

    // console.log("allsearch rows-===================", rows);


    // // Collect rows from all tables
    // const tableRows = await Promise.all(rows.map((row) => {
    //     const tableName = row.name;
    //     return new Promise((resolve, reject) => {
    //         db.all(`SELECT * FROM ${tableName}`, (error, rows) => {
    //             if (error) {
    //                 reject(error);
    //             } else {
    //                 resolve(rows);
    //             }
    //         });
    //     });
    // }));
    // // console.log("allsearch tableRows-===================", tableRows);

    // // Combine all rows and render template
    // const listviewpage = [].concat(...tableRows);

    // if (req.query.searchTerm) {

    //     const searchTerm = req.query.searchTerm; // Get the search term from the client
    //     console.log("searchTerm insiisiisisi========", searchTerm);

    //     // Perform the database query
    //     db.all('SELECT * FROM alldata WHERE FILENAME LIKE ?', [`%${searchTerm}%`], (err, row) => {
    //         if (err) {
    //             console.log("Error:", err);
    //             res.status(500).json({ error: 'Internal server error' });
    //         }

    //         const resultsPerPage = 100;
    //         const numOfResults = row.length;
    //         const numberOfPages = Math.ceil(numOfResults / resultsPerPage);
    //         let page = req.query.page ? Number(req.query.page) : 1;
    //         if (page > numberOfPages) {
    //             res.redirect('/?page=' + encodeURIComponent(numberOfPages));
    //         } else if (page < 1) {
    //             res.redirect('/?page=' + encodeURIComponent('1'));
    //         }
    //         //Determine the SQL LIMIT starting number
    //         const startingLimit = (page - 1) * resultsPerPage;
    //         //Get the relevant number of POSTS for this starting page
    //         sql = `SELECT * FROM alldata LIMIT ${startingLimit},${resultsPerPage}`;
    //         db.all(sql, (err, result) => {
    //             if (err) throw err;
    //             let iterator = (page - 5) < 1 ? 1 : page - 5;
    //             let endingLink = (iterator + 9) <= numberOfPages ? (iterator + 9) : page + (numberOfPages - page);
    //             if (endingLink < (page + 4)) {
    //                 iterator -= (page + 4) - numberOfPages;
    //             }
    //             console.log(numberOfPages);
    //             res.render('allsearch', { data: result, page, iterator, endingLink, numberOfPages });
    //         });

    //     });
    //     return;
    // }


    // // /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // const resultsPerPage = 100;
    // db.all(`SELECT * FROM alldata`, (error, row) => {
    //     // console.log("listview page row-----", row);


    //     if (error) {
    //         console.log("erorrrr in table--userController----", error);
    //     }
    //     const numOfResults = row.length;
    //     const numberOfPages = Math.ceil(numOfResults / resultsPerPage);
    //     let page = req.query.page ? Number(req.query.page) : 1;
    //     if (page > numberOfPages) {
    //         res.redirect('/?page=' + encodeURIComponent(numberOfPages));
    //     } else if (page < 1) {
    //         res.redirect('/?page=' + encodeURIComponent('1'));
    //     }
    //     //Determine the SQL LIMIT starting number
    //     const startingLimit = (page - 1) * resultsPerPage;
    //     //Get the relevant number of POSTS for this starting page
    //     sql = `SELECT * FROM alldata LIMIT ${startingLimit},${resultsPerPage}`;
    //     db.all(sql, (err, result) => {
    //         if (err) throw err;
    //         let iterator = (page - 5) < 1 ? 1 : page - 5;
    //         let endingLink = (iterator + 9) <= numberOfPages ? (iterator + 9) : page + (numberOfPages - page);
    //         if (endingLink < (page + 4)) {
    //             iterator -= (page + 4) - numberOfPages;
    //         }
    //         console.log(numberOfPages);
    //         res.render('allsearch', { data: result, page, iterator, endingLink, numberOfPages });
    //     });
    // });
};
// //////////////////////////////////////////////////////////////////////////////////////////////////


//         res.render('allSearch', { listviewpage, indexName });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal server error');
//     }
// };




const getupdateallsearch = async (req, res) => {
    try {

        let id = req.params.sn
        // Get list of tables
        const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM List`, (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });

        // Collect rows from all tables
        const tableRows = await Promise.all(rows.map((row) => {
            const tableName = row.name;
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${tableName} WHERE SRNO = ?`, id, (error, rows) => {
                    console.log("row inside getupdateallsearch ------------", rows);
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }));

        // Combine all rows and render template
        const values = [].concat(...tableRows);
        console.log("getupdateallsearch-----------values are-------", values);
        res.render('UpdateExcel', { values });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};


const addUser = (req, res) => {
    var name = req.body.username;
    var empid = req.body.empid;
    var userid = req.body.userid;
    var password = req.body.password;
    var cUser = req.body.cUser;
    var updateUser = req.body.updateUser;
    var delUser = req.body.delUser;
    var addList = req.body.addList;
    var delList = req.body.delList;
    var addEntry = req.body.addEntry;
    var updateEntry = req.body.updateEntry;
    var mergePdf = req.body.mergepdf;
    var deleteEntry = req.body.deletentry;

    if (cUser != '1') {
        cUser = "0";
    }
    if (updateUser != '1') {
        updateUser = "0";
    }
    if (delUser != '1') {
        delUser = "0";
    }
    if (addList != '1') {
        addList = "0";
    }
    if (delList != '1') {
        delList = "0";
    }
    if (addEntry != '1') {
        addEntry = "0";
    }
    if (updateEntry != '1') {
        updateEntry = "0";
    }
    if (mergePdf != '1') {
        mergePdf = "0";
    }
    if (deleteEntry != '1') {
        deleteEntry = "0";
    }

    db.run(`INSERT INTO mytable(name,empid,userid,password,cUser,updateUser,delUser,addList,delList,addEntry,updateEntry,mergePdf,deleteEntry) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, [name, empid, userid, password, cUser, updateUser, delUser, addList, delList, addEntry, updateEntry, mergePdf, deleteEntry], function (err) {
        if (err) {
            return console.log(err.message);
        }
        // console.log(`A row has been inserted `);
    });
    res.redirect('/alluser');
}

const searchUser = (req, res) => {

    //getting data from List table
    db.all(`SELECT * FROM List`, (error, rows) => {
        if (error) {
            console.log("erorrrr in table--userController----", error);
        }
        // console.log("list row is-------",rows);
        res.render('Search', { homes: rows })
    });
}

const listviewpage = (req, res) => {

    const indexName = req.query.name;
    console.log("listview page indexname-----", indexName);

    var data = req.userData;

    console.log(data);
    //getting data from List table
    db.all(`SELECT * FROM ${indexName}`, (error, row) => {
        // console.log("listview page row-----", row);


        if (error) {
            console.log("erorrrr in table--userController----", error);
        }
        // console.log("listviewpage row is-------",row);
        res.render('listviewpage', { listviewpage: row, permission: data, indexName })

    });
}


const pdfView = (req, res) => {
    // var name = req.params.PDFNAME;
    var SRNO = req.query.SRNO;
    var FILENAME = req.query.FILENAME;
    var YEAR = req.query.YEAR;
    var CODE = req.query.CODE;
    var TALUK = req.query.TALUK;
    var HOBLI = req.query.HOBLI;
    var VILLAGE = req.query.VILLAGE;
    var SURVEYNUMBER = req.query.SURVEYNUMBER;
    var pdfname = req.query.pdfname;
    var comment = req.query.comment;
    var msg = req.query.msg;
    // var indexName = req.query.indexName;
    var indexName = req.query.listName;
    console.log("----------------", 'indexName=====', indexName, "TALUK", TALUK, "pdfname-----", pdfname, "comment-----", comment, "=========", SRNO);
    if (msg && indexName) {

        db.run(
            `UPDATE ${indexName} SET COMMENT = ? WHERE SRNO = ? `,
            [msg, SRNO],
            function (error) {
                if (error) {
                    console.error(error.message);
                }
            }
        );
    } else {
        console.log("Comment is not updated at addCommnet!");
    }

    db.all(`SELECT * FROM ${indexName} WHERE SRNO = ?`, [SRNO], (err, row) => {
        // console.log("row is---------------", row);

        res.render('pdfView', { SRNO, FILENAME, YEAR, CODE, TALUK, HOBLI, VILLAGE, SURVEYNUMBER, pdfname, comment, indexName, row });
    })
}



const pdfViewListview = (req, res) => {
    // var name = req.params.PDFNAME;
    var SRNO = req.query.SRNO;
    var FILENAME = req.query.FILENAME;
    var YEAR = req.query.YEAR;
    var CODE = req.query.CODE;
    var TALUK = req.query.TALUK;
    var HOBLI = req.query.HOBLI;
    var VILLAGE = req.query.VILLAGE;
    var SURVEYNUMBER = req.query.SURVEYNUMBER;
    var pdfname = req.query.pdfname;
    var comment = req.query.comment;
    var msg = req.query.msg;
    // var indexName = req.query.indexName;
    var listName = req.query.listName;
    console.log("----------------", 'indexName=====', listName, "TALUK", TALUK, "pdfname-----", pdfname, "comment-----", comment, "=========", SRNO);
    if (msg && listName) {

        db.run(
            `UPDATE ${listName} SET COMMENT = ? WHERE SRNO = ? `,
            [msg, SRNO],
            function (error) {
                if (error) {
                    console.error(error.message);
                }
            }
        );
    } else {
        console.log("Comment is not updated at addCommnet!");
    }

    db.all(`SELECT * FROM ${listName} WHERE SRNO = ?`, [SRNO], (err, row) => {
        console.log("row is---------------", row);

        res.render('pdfViewListview', { SRNO, FILENAME, YEAR, CODE, TALUK, HOBLI, VILLAGE, SURVEYNUMBER, pdfname, comment, listName, row });
    })
}


const deleteUser = (req, res) => {

    const id = req.params.sn;

    db.run(`DELETE FROM mytable WHERE sn = ?`, [id], function (error) {
        if (error) {
            console.error(error.message);
        }
        res.redirect('/alluser')
    });

}


const getAlluser = async (req, res, next) => {
    db.all("SELECT * FROM mytable", function (err, rows) {
        if (err) {
            console.log(err);
        }
        // console.log(rows);
        res.render('Alluser', { data: rows })
        // res.status(200).json(rows);
    });
}


const allList = async (req, res, next) => {
    db.all("SELECT * FROM List", function (err, rows) {
        if (err) {
            console.log(err);
        }
        // console.log(rows);
        res.render('allList', { listData: rows })
    });
}


const deleteList = (req, res) => {

    const id = req.params.sn;

    db.run(`DELETE FROM List WHERE sn = ?`, [id], function (error) {
        if (error) {
            console.error(error.message);
        }
        res.redirect('/admin');
    });

}


// code for list 

const addList = (req, res) => {
    var name = req.body.username;

    let errors = [];

    if (!name) {
        errors.push({ msg: 'please fill the field' });
    }

    if (errors.length > 0) {
        res.render('List', {
            errors, name
        })
    }
    else {

        db.run("CREATE TABLE IF NOT EXISTS List (sn INTEGER PRIMARY KEY, name TEXT)");
        db.all(`SELECT * FROM List WHERE name = ?`, name, (error, row,) => {

            let object = Object.assign({}, ...row)

            if (object.name == name) {
                res.redirect('/list')
            }
            else {
                db.run(
                    `INSERT INTO List (name) VALUES (?)`,
                    [name],
                    function (error) {
                        if (error) {
                            console.error(error.message);
                        }
                        // console.log(`Inserted a row with the ID: ${this.lastID}`);
                    }
                );
                db.exec(`
            CREATE TABLE ${name}
            (
              SRNO INTEGER PRIMARY KEY AUTOINCREMENT,
              FILENAME TEXT,
              YEAR TEXT,
              CODE TEXT,
              TALUK TEXT,
              HOBLI TEXT,
              VILLAGE TEXT,
              SURVEYNUMBER TEXT,
              PDFNAME TEXT, 
              COMMENT TEXT,
              listName TEXT
            );`
                );
                res.redirect('/admin');
            }
        });
    }
}



const pdfPath = (req, res) => {
    var name = req.body.username;

    let errors = [];

    if (!name) {
        errors.push({ msg: 'please fill the field' });
    }

    if (errors.length > 0) {
        res.render('addIndex', {
            errors, name
        })
    }
    else {

        db.run("CREATE TABLE IF NOT EXISTS addPath (sn INTEGER PRIMARY KEY, path TEXT)");
        db.run(
            `UPDATE addPath SET path = ? WHERE sn = ?`,
            [name, 1],
            function (error) {
                if (error) {
                    console.error(error.message);
                }
                console.log(`Row has been updated`);
            }
        );
    }
}

const updateUser = (req, res) => {
    const sn = req.params.sn;
    var name = req.body.username;
    var empid = req.body.empid;
    var userid = req.body.userid;
    var password = req.body.password;
    var cUser = req.body.cUser;
    var updateUser = req.body.updateUser;
    var delUser = req.body.delUser;
    var addList = req.body.addList;
    var delList = req.body.delList;
    var addEntry = req.body.addEntry;
    var updateEntry = req.body.updateEntry;
    var mergePdf = req.body.mergepdf;
    var deleteEntry = req.body.deletentry;

    if (cUser != '1') {
        cUser = "0";
    }
    if (updateUser != '1') {
        updateUser = "0";
    }
    if (delUser != '1') {
        delUser = "0";
    }
    if (addList != '1') {
        addList = "0";
    }
    if (delList != '1') {
        delList = "0";
    }
    if (addEntry != '1') {
        addEntry = "0";
    }
    if (updateEntry != '1') {
        updateEntry = "0";
    }
    if (mergePdf != '1') {
        mergePdf = "0";
    }
    if (deleteEntry != '1') {
        deleteEntry = "0";
    }

    db.run(
        `UPDATE mytable SET name = ?, empid = ?, userid = ?, password = ?, cUser = ?, updateUser = ?,delUser = ?,addList = ?,delList = ?,addEntry = ?,updateEntry = ?,mergePdf = ?,deleteEntry = ? WHERE sn = ?`,
        [name, empid, userid, password, cUser, updateUser, delUser, addList, delList, addEntry, updateEntry, mergePdf, deleteEntry, sn],
        function (error) {
            if (error) {
                console.error(error.message);
            }
        }
    );
    res.redirect('/alluser');
}


const getupdateUser = (req, res) => {

    var id = req.params.sn;

    db.all(`SELECT * FROM mytable WHERE sn = ?`, id, (error, row,) => {
        if (error) {
            console.log("erorrrr in getupdateUser--userController----", error);
        }
        // console.log(row);
        res.render('Edit', { values: row });
    });
}

const getLogin = (req, res) => {

    let ip;

    address.mac(function (err, address) {
        ip = address;
        console.log(ip);
    })

    var myip = process.env.CHECKIP;
    var myip1 = process.env.CHECKIP1;
    var myip2 = process.env.CHECKIP2;
    var myip3 = process.env.CHECKIP3;
    var myip4 = process.env.CHECKIP4;
    var myip5 = process.env.CHECKIP5;
    var myip6 = process.env.CHECKIP6;


    if (ip == myip || ip == myip1 || ip == myip2 || ip == myip3 || ip == myip4 || ip == myip5 || ip == myip6) {
        res.render('Login');
    }
    else {
        // res.send("<script>window.close();</script >")
        // alert("System Not Supported Or Please Connect to Internet");
        res.render('Login');
    }
}


const loginUser = (req, res) => {

    var empid = req.body.empid;
    var password = req.body.password;

    let errors = [];

    if (!empid || !password) {
        errors.push({ msg: 'please fill the all fields' });
    }


    if (errors.length > 0) {
        res.render('Login', {
            errors, empid, password
        })
    }
    else {
        db.each(`SELECT * FROM mytable WHERE empid = ? `, empid, (err, row) => {

            if (row.password === password && row.empid === empid) {
                console.log("user Logged in");
                var token = jwt.sign(
                    {
                        name: row.name,
                        empid: row.empid,
                        cUser: row.cUser,
                        updateUser: row.updateUser,
                        delUser: row.delUser,
                        addList: row.addList,
                        delList: row.delList,
                        addEntry: row.addEntry,
                        updateEntry: row.updateEntry,
                        mergePdf: row.mergePdf,
                        deleteEntry: row.deleteEntry
                    },
                    'secret',
                    {
                        expiresIn: "1h"
                    })

                // console.log(token);
                res.cookie('jwt', token, { httpOnly: true, secure: true, maxAge: 3600000 })
                res.redirect('/welcome');
                // res.status(200).json({message:"ok",token:token})
            }
            else {
                errors.push({ msg: 'Invalid Credentials!' })
                res.render('Login', {
                    errors, empid
                })
            }
        })
    }
}


const getExceldata = (req, res) => {

    var table = req.body.tablename;
    var index = req.body.index;

    db.all(`SELECT * FROM ${table} WHERE SRNO = ?`, index, (error, row,) => {
        if (error) {
            console.log(error);
        }
        // console.log(row);
        res.render('UpdateExcel', { values: row, tableName: table, entryNumber: index });
    });
}

const editExceldata = (req, res) => {

    var table = req.body.tablename;
    var index = req.body.index;
    var FILENAME = req.body.FILENAME;
    var YEAR = req.body.YEAR;
    var CODE = req.body.CODE;
    var TALUK = req.body.TALUK;
    var HOBLI = req.body.HOBLI;
    var VILLAGE = req.body.VILLAGE;
    var SURVEYNUMBER = req.body.SURVEYNUMBER;
    var PDFNAME = req.body.PDFNAME;

    db.run(
        `UPDATE ${table} SET FILENAME = ?, YEAR = ?, CODE = ?, TALUK = ?, HOBLI = ?, VILLAGE = ?,SURVEYNUMBER = ?,PDFNAME = ? WHERE SRNO = ?`,
        [FILENAME, YEAR, CODE, TALUK, HOBLI, VILLAGE, SURVEYNUMBER, PDFNAME, index],
        function (error) {
            if (error) {
                console.error(error.message);
            }
        }
    );
    res.redirect('/admin');
}

const addEntrydata = (req, res) => {

    var table = req.body.tablename;
    var FILENAME = req.body.FILENAME;
    var YEAR = req.body.YEAR;
    var CODE = req.body.CODE;
    var TALUK = req.body.TALUK;
    var HOBLI = req.body.HOBLI;
    var VILLAGE = req.body.VILLAGE;
    var SURVEYNUMBER = req.body.SURVEYNUMBER;
    var PDFNAME = req.body.PDFNAME;



    db.run(`INSERT INTO ${table}(FILENAME,YEAR,CODE,TALUK,HOBLI,VILLAGE,SURVEYNUMBER,PDFNAME,COMMENT,listName) VALUES(?,?,?,?,?,?,?,?,'No Comment',?)`, [FILENAME, YEAR, CODE, TALUK, HOBLI, VILLAGE, SURVEYNUMBER, PDFNAME, table], function (err) {
        if (err) {
            console.log(err.message);
        }
        // console.log(`A row has been inserted `);
        res.redirect('/admin');
    });
}

const logout = (req, res) => {
    res.clearCookie('jwt');
    res.redirect('login');
}

const excelInfo = (req, res) => {

    db.all("SELECT * FROM List", function (err, rows) {
        if (err) {
            console.log(err);
        }
        // console.log(rows);
        res.render('ExcelInfo', { values: rows })
    });

}

const addentryData = (req, res) => {

    db.all("SELECT * FROM List", function (err, rows) {
        if (err) {
            console.log(err);
        }
        // console.log(rows);
        res.render('AddentryInfo', { values: rows })
    });
}

const deleteInfo = (req, res) => {
    var id = req.body.SRNO;
    var indexName = req.body.indexName || req.body.listName;
    console.log("indexNameindexNameindexName---", indexName);
    var data = req.userData;
    //  var mergePdf ='1';
    db.run(`DELETE FROM ${indexName} WHERE SRNO = ?`, [id], function (error) {
        if (error) {
            console.error(error.message);
        }
        //getting data from List table
        //     db.all(`SELECT * FROM ${indexName}`, (error, row) => {
        //         // console.log("listview page row-----", row);


        //         if (error) {
        //             console.log("erorrrr in table--userController----", error);
        //         }
        //         // console.log("listviewpage row is-------",row);
        //         // res.render('listviewpage', { listviewpage: row, permission: 1, indexName })
        //         // res.render('allSearch', { listviewpage: row, permission: 1, indexName })

        //     });
    });
    return

}

const uploadPdf = async (req, res) => {
    const p1 = req.body.pdf1;
    const p2 = req.body.pdf2;

    res.render('MergePdf', { path1: p1, path2: p2 });



}

const mergePdf = async (req, res) => {

    const p1 = req.body.pdf2name;
    const p2 = req.body.pdf1name;

    const mypdf1 = await PDFDocument.load(readFileSync(`./assets/pdf/${p1}.pdf`));
    const mypdf2 = await PDFDocument.load(readFileSync(`./assets/pdf/${p2}.pdf`));

    const pagesArray = await mypdf2.copyPages(mypdf1, mypdf1.getPageIndices());

    for (const page of pagesArray) {
        mypdf2.addPage(page);
    }

    writeFileSync(`./assets/pdf/${p2}.pdf`, await mypdf2.save());
    res.redirect('/admin')
}

const
    commentInfo = (req, res) => {

        var index = req.params.SRNO;

        db.all("SELECT * FROM List", function (err, rows) {
            if (err) {
                console.log(err);
            }
            // console.log(rows);
            res.render('AddComment', { values: rows, index: index })
        });
    }

const addcommentInfo = (req, res) => {

    var index = req.body.index;
    var table = req.body.tablename;

    db.all(`SELECT * FROM ${table} WHERE SRNO = ?`, index, (error, row,) => {
        if (error) {
            console.error(error.message);
        }
        console.log(row);
        res.render('ListComment', { item: row, table: table, index: index })
    });
}

const addComment = (req, res) => {
    var index = req.body.index;
    var table = req.body.tablename;
    var msg = req.body.comment;

    db.run(
        `UPDATE ${table} SET COMMENT = ? WHERE SRNO = ?`,
        [msg, index],
        function (error) {
            if (error) {
                console.error(error.message);
            }
        }
    );
    res.redirect('/search');

}

// exports.allSearchPost = allSearchPost;
exports.newSearch = newSearch;
exports.multiSearch = multiSearch;
exports.pdfView = pdfView;
exports.pdfViewListview = pdfViewListview;
exports.allsearch = allsearch;
exports.getupdateallsearch = getupdateallsearch;
exports.addUser = addUser;
exports.searchUser = searchUser;
exports.listviewpage = listviewpage;
// exports.pdfView = pdfView;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
exports.getupdateUser = getupdateUser;
exports.getAlluser = getAlluser;
exports.allList = allList;
exports.deleteList = deleteList;
exports.addList = addList;
exports.pdfPath = pdfPath;
exports.loginUser = loginUser;
exports.logout = logout;
exports.getExceldata = getExceldata;
exports.editExceldata = editExceldata;
exports.addEntrydata = addEntrydata;
exports.excelInfo = excelInfo;
exports.addentryData = addentryData;
exports.deleteInfo = deleteInfo;

exports.getLogin = getLogin;
exports.uploadPdf = uploadPdf
exports.mergePdf = mergePdf;
exports.commentInfo = commentInfo;
exports.addcommentInfo = addcommentInfo;
exports.addComment = addComment;






