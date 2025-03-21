@cds.persistence.exists
entity BOOKS {
  key ID             : UUID;
      TITLE          : String(255);
      ISBN           : String(25);
      GENRE          : String(25);
      PUBLISHED_YEAR : Date;
      AUTHOR_LICENCE : String(36);
      PRICE          : Decimal(10, 2);
      STOCK          : Integer;
      RATING         : Decimal(34);
      AUTHOR         : Association to one AUTHORS
                         on AUTHOR.LICENCE = $self.AUTHOR_LICENCE;
      REVIEWS        : Association to many CUSTOMERSREVIEW
                         on REVIEWS.BOOK_ISBN = $self.ISBN;
}

@cds.persistence.exists
entity AUTHORS {
  key ID      : UUID;
      NAME    : String(255);
      EMAIL   : String(255);
      GENDER  : String(10);
      DOB     : Date;
      COUNTRY : String(10);
      LICENCE : String;
      BOOKS   : Association to many BOOKS
                  on BOOKS.AUTHOR_LICENCE = $self.LICENCE;
}

@cds.persistence.exists
entity BORROWEDBOOKS {
  key ID                 : UUID;
      BOOK_NAME          : String(255);
      BOOK_ISBN          : String(25);
      QUANTITY           : Integer;
      CUSTOMER_NAME      : String(255);
      CUSTOMER_EMAIL     : String(255);
      BORROWED_DATE      : Date @cds.on.insert: $now;
      DUE_DATE           : Date;
      ACTUAL_RETURN_DATE : Date;
      REMARKS            : String(255);
      IS_REVIEWED        : Boolean default false;
      IS_RETURNED        : Boolean default false;
}

@cds.persistence.exists
entity CUSTOMERS {
  key ID      : UUID;
      NAME    : String(255);
      EMAIL   : String(255);
      PHONE   : String(10);
      ADDRESS : String(255);
      GENDER  : String(10);
      TYPE    : String(255);
      BOOKS   : Association to many BORROWEDBOOKS
                  on BOOKS.CUSTOMER_EMAIL = $self.EMAIL;
      REVIEWS : Association to many CUSTOMERSREVIEW
                  on REVIEWS.CUSTOMER_EMAIL = $self.EMAIL;
}

@cds.persistence.exists
entity CUSTOMERSREVIEW {
  key ID             : UUID;
      BORROWED_ID    : String(36);
      REVIEW         : String(255);
      RATING         : Decimal(34);
      REVIEW_DATE    : Date;
      CUSTOMER_EMAIL : String(10);
      BOOK_ISBN      : String(25);
      BOOK_NAME      : String(255);
}

// entity NOTIFICATION {
//   key ID : UUID;
//   type :
// }
