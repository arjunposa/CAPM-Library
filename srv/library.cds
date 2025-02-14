using { BOOKS, AUTHORS, BORROWEDBOOKS, CUSTOMERS, CUSTOMERSREVIEW } from '../db/data-model';


// @path: '/library'
service library {

    entity books as projection on BOOKS;
    entity authors as projection on AUTHORS;
    entity borrowedBooks as projection on BORROWEDBOOKS;
    entity customers as projection on CUSTOMERS;
    entity customersReviews as projection on CUSTOMERSREVIEW;

   

}
