
const ExcelJS = require('exceljs');

async function readExcel(BOOKS,file){
    let existCount = 0;
    let newCount = 0;
    const msg = {};

    const buffer = Buffer.from(file, "base64");
    // console.log(buffer)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0]; // First sheet
    let booksData = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
            booksData.push({
                ISBN: row.getCell(1).value,
                TITLE: row.getCell(2).value,
                GENRE: row.getCell(3).value,
                PUBLISHED_YEAR: row.getCell(4).value,
                PRICE: parseFloat(row.getCell(5).value),
                STOCK: parseInt(row.getCell(6).value),
                AUTHOR_LICENCE : row.getCell(7).value
            });
        }
    });
    console.log(booksData)
    for (const book of booksData) {
        let existData = await SELECT.from(BOOKS).where({ ISBN: `${book.ISBN}` });

        if (existData.length !== 0) {
            existCount++;
            let newStock = existData[0].STOCK + book.STOCK;
            await UPDATE(BOOKS).set({ STOCK: newStock }).where({ ISBN: `${book.ISBN}` });
            
        } else {
            newCount++;
            await INSERT.into(BOOKS).entries(book);
        }
    }
    msg.Update = `${existCount} details are updated`;
    msg.Insert = `${newCount} entries are inserted`;
    return {msg}
}


module.exports = {readExcel}