const cds = require('@sap/cds');
const { BOLD } = require('@sap/cds/lib/utils/colors');
const { BOOKS, CUSTOMERSREVIEW, BORROWEDBOOKS, CUSTOMERS } = cds.entities;
const { readExcel } = require('./handelers/ExcelReader');

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
                    await UPDATE(BOOKS).set({ RATING: parseFloat(avgRating[0].AVGRATING) }).where({ ID: bookID });
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
                if (result[0].STOCK !== 0) {
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
            if (!result[0].IS_RETURNED) {
                if (result.length && result[0].ACTUAL_RETURN_DATE) {
                    let returnQuantity = result[0].QUANTITY;
                    // console.log(result[0])
                    const oldStock = await cds.run(SELECT.columns('STOCK').from(BOOKS).where({ ISBN: result[0].BOOK_ISBN }))
                    // console.log(oldStock)
                    await UPDATE(BOOKS).set({ STOCK: oldStock[0].STOCK + returnQuantity }).where({ ISBN: result[0].BOOK_ISBN });
                }
                await UPDATE(BORROWEDBOOKS).set({ IS_RETURNED: true }).where({ ID: req.ID })
            }
        } catch (error) {
            console.error('Error in after UPDATE borrowedBooks:', error);
        }
    });

    this.before('CREATE', 'customersReviews', async (req) => {
        try {
            await UPDATE(BORROWEDBOOKS).set({ IS_REVIEWED: true }).where({ BOOK_ISBN: req.data.BOOK_ISBN });
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

        let resp = await readExcel(BOOKS, req.data.file)
        return resp.msg

    });

    this.before('CREATE', 'customers', async (req) => {
        try {
            console.log(req.data);

            const existCust = await cds.run(
                SELECT.from(CUSTOMERS).where({ EMAIL: req.data.EMAIL })
            );

            if (existCust.length > 0) {
                req.error(400, `${req.data.EMAIL} is already registered. Please enter a new Email.`);
            }

        } catch (error) {
            console.error(error.message);
            req.error(500, 'An unexpected error occurred.');
        }
    });

    this.on('createInnvoice', async (req) => {
        try {


            // Fetch borrow details using `await`
            let borrow_details = await cds.run(SELECT.from(BORROWEDBOOKS).where({ ID: req.data.borrowId }));
            console.log(borrow_details)
            let customerDeatis = await cds.run(SELECT.from(CUSTOMERS).where({ EMAIL: borrow_details[0].CUSTOMER_EMAIL }))
            console.log(customerDeatis);
            let bookDetails = await cds.run(SELECT.from(BOOKS).where({ ISBN: borrow_details[0].BOOK_ISBN }))
            console.log(bookDetails);
            let invoiceNumber = borrow_details[0].ID.split('-')[0]
            console.log(invoiceNumber)
            let invoice = {
                invoice_number: invoiceNumber,
                date: new Date(),
                customer: customerDeatis[0].NAME,
                email : customerDeatis[0].EMAIL,
                address: customerDeatis[0].ADDRESS,
                items: [
                    {
                        book_isbn: borrow_details[0].BOOK_ISBN,
                        book_name: borrow_details[0].BOOK_NAME,
                        borrowed_date: borrow_details[0].BORROWED_DATE,
                        quantity: borrow_details[0].QUANTITY
                    }
                ],
                subtotal: borrow_details[0].QUANTITY * bookDetails[0].PRICE,
            };
            let tax = invoice.subtotal * 0.18;  // 18% tax calculation
            let total = invoice.subtotal + tax;

            invoice.tax = tax;
            invoice.total = total;
            console.log(invoice)
            return invoice;

        } catch (error) {
            console.error("Error fetching invoice details:", error);
        }


    })
    this.on('sendEmail', async (req) => {
        console.log(req.data)
        const buffer = Buffer.from(req.data.content, "base64");
        console.log(buffer.toString())
    })



});
