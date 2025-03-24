const cds = require('@sap/cds');
const { BOLD } = require('@sap/cds/lib/utils/colors');
const { BOOKS, CUSTOMERSREVIEW, BORROWEDBOOKS } = cds.entities;
const {readExcel} = require('./handelers/ExcelReader');

module.exports = cds.service.impl(async function () {

   
    this.before('READ', 'books', async (req) => {
        try {

            if (req.data.ID) {
                console.log(req.data.ID);
                const bookID = req.data.ID;
                const bookDetails = await SELECT.from(BOOKS).where({ ID: bookID });

                if (!bookDetails.length) return;

                const avgRating = bookDetails[0].ISBN ?
                    await cds.run(`SELECT AVG(Rating) as avgRating FROM ${CUSTOMERSREVIEW} WHERE BOOK_ISBN = '${bookDetails[0].ISBN}'`)
                    : false;

                // console.log(avgRating, 'Rating');
                if (avgRating && avgRating[0].AVGRATING) {
                    await UPDATE(BOOKS).set({ RATING: parseFloat(avgRating[0].AVGRATING)  }).where({ ID: bookID });
                    // console.log(typeof parseFloat(avgRating[0].AVGRATING) )
                }
            }
        } catch (error) {
            console.error('Error in before READ books:', error);
        }
    });

    this.before('CREATE', 'borrowedBooks', async (req) => {
        try {
            const result = await cds.run(SELECT.from(BOOKS).where({ ISBN: req.data.BOOK_ISBN }));

            if (!result.length || result[0].STOCK < req.data.QUANTITY) {
                let error = new Error('Out of stock');
                error.code = 400; // Use 400 for client errors
                if(result[0].STOCK !== 0){
                    error = new Error(`Quantity limit Exceded, only ${result[0].STOCK} left`)
                    throw error;
                } 
                throw error;
            }

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 4);
            req.data.DUE_DATE = dueDate.toISOString().split('T')[0]; // Store in YYYY-MM-DD format
    
            // Update the stock count
            const newStock = result[0].STOCK - req.data.QUANTITY;
            await cds.run(UPDATE(BOOKS).set({ STOCK: newStock }).where({ ISBN: req.data.BOOK_ISBN }));
    
        } catch (error) {
            console.error('Error in CREATE borrowedBooks:', error);
            req.error(error.code || 500, error.message || 'Internal Server Error');
        }
    });
    



    this.after('UPDATE', 'borrowedBooks', async (req) => {
        try {
            const result = await cds.run(SELECT.from(BORROWEDBOOKS).where({ ID: req.ID }));
            if(!result[0].IS_RETURNED){
                if (result.length && result[0].ACTUAL_RETURN_DATE) {
                    let returnQuantity = result[0].QUANTITY;
                    // console.log(result[0])
                    const oldStock = await cds.run(SELECT.columns('STOCK').from(BOOKS).where({ ISBN: result[0].BOOK_ISBN }))
                    // console.log(oldStock)
                    await UPDATE(BOOKS).set({ STOCK: oldStock[0].STOCK + returnQuantity }).where({ ISBN: result[0].BOOK_ISBN });
                }
               await UPDATE(BORROWEDBOOKS).set({IS_RETURNED:true}).where({ ID: req.ID })
            }
        } catch (error) {
            console.error('Error in after UPDATE borrowedBooks:', error);
        }
    });

    this.before('CREATE', 'customersReviews', async (req) => {
        try {
            await UPDATE(BORROWEDBOOKS).set({ IS_REVIEWED: true }).where({ BookISBN: req.data.BOOK_ISBN });
            console.log(req.data);
        } catch (error) {
            console.error('Error in before CREATE customersReviews:', error);
        }
    });


    function addDays(days) {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    this.on('uploadExcel', async (req, next) => {
        
        let resp = await readExcel(BOOKS,req.data.file)
        return resp.msg
        
    });


});
