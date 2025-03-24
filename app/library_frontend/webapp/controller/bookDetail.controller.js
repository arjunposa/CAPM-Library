sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("libraryfrontend.controller.bookDetail", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();

            // Initialize edit mode model
            var oViewModel = new JSONModel({
                bEditMode: false
            });
            this.getView().setModel(oViewModel, "view");

            // Initialize rating model
            let ratingModel = new JSONModel({});
            this.getView().setModel(ratingModel, "RatingData");

            // Attach pattern matched handler
            this.oRouter.getRoute("RouteBookdetail").attachPatternMatched(this._onBookMatched, this);
        },

        _onBookMatched: function (oEvent) {
            let _bookID = oEvent.getParameter("arguments").bookId;
            let _bookISBN = oEvent.getParameter("arguments").ISBN;

            if (_bookISBN) {
                console.log("Fetching rating for ISBN:", _bookISBN);
                this.getRating(_bookISBN);
            }

            if (_bookID) {
                this.getView().bindElement({
                    path: `/books('${_bookID}')`,
                    model: "LibraryData",
                    parameters: {
                        expand: "AUTHOR, REVIEWS"
                    }
                });
            }
        },

        onNavBack: function () {
            const oViewModel = this.getView().getModel("view");

            // Navigate back to the previous page (or another route)
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo('RouteHome');

            // Reset the edit mode state to initial (false)
            oViewModel.setProperty("/bEditMode", false);

            // Clear stock value field if it exists
            const stockInput = this.getView().byId("nStock");
            if (stockInput) {
                stockInput.setValue("");
            }
        },

        onEditToggleButtonPress: function () {
            var oViewModel = this.getView().getModel("view");
            var bEditMode = oViewModel.getProperty("/bEditMode");
            oViewModel.setProperty("/bEditMode", !bEditMode);
        },

        onSavePress: function () {
            // Save changes logic
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/bEditMode", false);
            // Additional save logic can be added here
        },

        onCancelPress: function () {
            // Cancel changes logic
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/bEditMode", false);
            // Additional cancel logic can be added here
        },

        formatter: {
            statusState: function (iStock) {
                return iStock > 0 ? "Success" : "Error";
            },
            stockWarning: function (sCount) {
                return sCount <= 0 ? "Out of Stock" : sCount;
            }
        },

        onNewStockLiveChange: function (oEvent) {
            // Retrieve the stock input field
            var oStock = this.getView().byId("stock");

            if (!oStock) {
                console.error("Stock input field not found.");
                return;
            }

            // Get the current stock value
            var nCurrentStock = parseFloat(oStock.getValue()) || 0;

            // Get the new value of nStock
            var sNewStockValue = oEvent.getParameter("newValue") || "0";

            // Get the previous value of nStock stored in data
            var sPrevStockValue = oEvent.getSource().data("prevValue") || "0";

            // Calculate the numeric values
            var nPrevStock = parseFloat(sPrevStockValue);
            var nNewStock = parseFloat(sNewStockValue);

            // Calculate the difference between previous and new nStock
            var delta = nNewStock - nPrevStock;

            // Update the total stock based on the delta
            var finalStock = nCurrentStock + delta;

            // Set the updated stock value
            oStock.setValue(finalStock.toString());

            // Store the new value of nStock in data for the next calculation
            oEvent.getSource().data("prevValue", sNewStockValue);
        },

        getRating: function (_bookISBN) {
            let RatingData = this.getView().getModel("RatingData");
            let sUrl = `${this.getOwnerComponent().getModel('LibraryData').getServiceUrl()}getAverageRating`;
            console.log("Fetching rating from:", sUrl);

            $.ajax({
                url: sUrl,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ "bookISBN": _bookISBN }),
                success: function (res) {
                    console.log("Rating response:", res.value);
                    RatingData.setData(res.value);
                },
                error: function (error) {
                    console.error("Error fetching rating:", error);
                }
            });
        }
    });
});