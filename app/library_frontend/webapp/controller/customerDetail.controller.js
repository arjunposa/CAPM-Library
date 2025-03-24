sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/date/UI5Date",
    'sap/ui/integration/Host'
], function (Controller, JSONModel, UI5Date, Host) {
    "use strict";

    return Controller.extend("libraryfrontend.controller.customerDetail", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteCustomerDetail").attachPatternMatched(this._onCustomerMatched, this);

            // Initialize edit mode model
            var oViewModel = new JSONModel({
                bEditMode: false,
                bReview: false
            });
            this.getView().setModel(oViewModel, "view");

            let cardManifests = new JSONModel()
            cardManifests.loadData(sap.ui.require.toUrl("libraryfrontend/model/cardManifests.json"));
            this.getView().setModel(cardManifests, "manifests");

            let wReviewData = new JSONModel({
                BookName: '',
                BookISBN: '',
                BorrowID: '',
                CustomerID: '',
                Review: '',
                Rating: 0,
                ReviewDate: '',
                CustomerEmail: ''
            })
            this.getView().setModel(wReviewData, "wReviewModel");


        },

        _onCustomerMatched: function (oEvent) {
            this._customerID = oEvent.getParameter("arguments").id;
            this._customerEmail = oEvent.getParameter("arguments").email

            if (this._customerID) {
                this.getView().bindElement({
                    path: `/customers(${this._customerID})`,
                    model: "LibraryData",
                    parameters: {
                        expand: "BOOKS, REVIEWS"
                    }
                });
            }

            this._getCustomerDetails(this._customerID)

        },
        onNavBack: function () {
            // Navigate back to the previous page (or another route)
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo('RouteHome');
        },



        formatter: {
            Initials: function (iName) {
                iName = iName.split(' ')
                let Initials = ''
                iName.map(initial => {
                    Initials = Initials + initial[0]
                })
                console.log(Initials)
                return Initials
            },
            cType: function (sType) {
                switch (sType) {
                    case 'buyer':
                        return 'Buyer'
                        break;
                    case 'reader':
                        return 'Reader'
                        break;
                    case 'borrower':
                        return 'Borrower'
                        break;

                    default:
                        return "N/A"
                        break;
                }
            },
            Quantity: function (sQuantity) {
                console.log(Number(sQuantity))
            },
            BtnEnable: function (sFlag) {
                if (sFlag === false) {
                    return true
                }
                return false
            }



        },

        _getCustomerDetails: async function (customerID) {
            let oCardManifestModel = this.getView().getModel("manifests");
            let url = `${this.getOwnerComponent().getModel("LibraryData").getServiceUrl()}customers(${customerID})`

            let objectCard = this.getView().byId('objectCard')
            let tableCard = this.getView().byId('tableCard')
            let reviewCard = this.getView().byId('reviewCard1')

            setTimeout(() => {
                oCardManifestModel.setProperty('/object/sap.card/data/request/url', url)
                oCardManifestModel.setProperty('/tableCard/sap.card/data/request/url', `${url}/BOOKS?$orderby=BORROWED_DATE%20desc`)
                oCardManifestModel.setProperty('/reviewCard/sap.card/content/data/request/url', `${url}/REVIEWS?$orderby=REVIEW_DATE%20desc`)

                objectCard.refresh()
                tableCard.refresh()
                reviewCard.refresh()
                // console.log(objectCard.getProperty('manifest')['sap.card'].content.groups[0].items[1].value)
            }, 500);

        },
        onCardReady: function (oCard) {
            console.log(oCard)
        },
        onWriteReview: function (oEvent) {
            var oRowContext = oEvent.getSource().getBindingContext("LibraryData");
            if (oRowContext) {
                var oRowData = oRowContext.getObject();
                console.log(oRowData)
                if (oRowData.ACTUAL_RETURN_DATE) {
                    var oRowData = oRowContext.getObject();
                    console.log(oRowData);


                    this.getView().getModel("wReviewModel").setData({
                        BOOK_NAME: oRowData.BOOK_NAME,
                        BOOK_ISBN: oRowData.BOOK_ISBN,
                        BORROWED_ID: oRowData.ID,
                        CUSTOMER_EMAIL: this._customerEmail,
                        REVIEW: oRowData.
                            REVIEW || "",
                        RATING: oRowData.RATING || 0
                    });


                    this.byId('wReviewCard').setVisible(true);


                    console.log(this.getView().getModel("wReviewModel").getData());
                }
                else {
                    console.error('error')

                }

            }
        },
        onReviewCancel: function () {
            this.byId('wReviewCard').setVisible(false);
        },
        onReviewSubmit: function () {
            let nCustomerReview = this.getView().getModel('wReviewModel')
            let LibraryData = this.getView().getModel('LibraryData')
            let reviewCard = this.getView().byId('reviewCard1')
            let sUrl = `${this.getOwnerComponent().getModel("LibraryData").getServiceUrl()}customersReviews`
            let that = this
            console.log(nCustomerReview)
            $.ajax({
                url: sUrl,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(nCustomerReview.getData()),
                success: function (oData) {
                    console.log(oData)
                    LibraryData.refresh()
                    that.onReviewCancel()
                    reviewCard.refresh()
                },
                error: function (error) {
                    console.log(error)
                }
            })
        }



    });
});