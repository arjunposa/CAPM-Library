sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
], (Controller, MessageToast, MessageBox, Column, ColumnListItem, Text, Filter, Sorter, FilterOperator, Fragment) => {
    "use strict";

    return Controller.extend("libraryfrontend.controller.Home", {
        onInit() {
            this.oModel = this.getOwnerComponent().getModel("LibraryData");
            this.oTitleSearch = this.byId('genreTitleSearch')
            this.oInitialSearch = this.byId('allTitleSearch')

            var oUIModel = new sap.ui.model.json.JSONModel({
                editMode: true,
                saveMode: false,
                tableEdit: false

            });
            this.getView().setModel(oUIModel, "ui");

            let nBorrowBook = new sap.ui.model.json.JSONModel({
                BOOK_NAME: "",
                BOOK_ISBN: "",
                CUSTOMER_NAME: "",
                CUSTOMER_EMAIL: "",
                QUANTITY: ""
            })

            this.getView().setModel(nBorrowBook, "nBorrow");

            let nCustomer = new sap.ui.model.json.JSONModel({
                NAME:"",
                EMAIL:"",
                PHONE:"",
                ADDRESS:"",
                GENDER:"",
                TYPE:""
            })
            this.getView().setModel(nCustomer, "nCustomer");

            let oAutoRefreshModel = new sap.ui.model.json.JSONModel({
                autoRefreshOptions: [
                    { text: "Off", time: null },
                    { text: "Every 10 seconds", time: 10 },
                    { text: "Every 20 seconds", time: 20 },
                    { text: "Every 30 seconds", time: 30 },
                    { text: "Every Minute", time: 60 },
                    { text: "Every 5 Minutes", time: 300 }
                ]
            });
            this.getView().setModel(oAutoRefreshModel, "oAutoRfsh");

            let oNotificationModel = new sap.ui.model.json.JSONModel({
                length: 0,
                notifications: []
            });
            this.getView().setModel(oNotificationModel, "oNotification");

        },
        formatter: {
            statusState: function (iStock) {

                if (iStock > 0) {
                    return "Success";
                }
                return "Error";
            },
            stockWarning: function (sCount) {
                if (sCount <= 0) {
                    return "Out of Stock"
                }
                return sCount
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
            }

        },
        onRefresh: function () {
            this.getOwnerComponent().getModel('LibraryData').refresh()
            MessageToast.show('Data Refreshed')
        },
        onSearchBookTitle: function (oEvent) {
            this._FilterHandler("TITLE", oEvent.getSource().getValue(), 'bookTable')
            // this._FilterHandler("ISBN", oEvent.getSource().getValue(), 'bookTable')

        },

        onTitleSearch: function (oEvent) {
            const searchValue = oEvent.getSource().getValue();
            const oBinding = this.byId("bookTable").getBinding("items");

            console.log(oBinding.getModel())

        },
        onSearchBorrowCustomer: function (oEvent) {
            this._FilterHandler("CUSTOMER_NAME", oEvent.getSource().getValue(), 'borrowedTable')
        },

        onSearchCustomer: function (oEvent) {
            this._FilterHandler("NAME", oEvent.getSource().getValue(), 'customerTable')
        },

        _FilterHandler: function (field, query, tableName) {
            let aFilter = [];
            let sQuery = query
            if (sQuery && sQuery.length > 0) {

                let oUniversalFilter = new Filter(
                    field, FilterOperator.Contains, sQuery
                );
                aFilter.push(oUniversalFilter);

            }
            let oListItems = this.byId(tableName)
            let oBinding = oListItems.getBinding("items");
            oBinding.filter(aFilter);
        },
        onEditBorrowedBook: function () {
            var oUIModel = this.getView().getModel("ui");
            oUIModel.setProperty("/editMode", false); // Hide Edit button
            oUIModel.setProperty("/saveMode", true); // Show Save/Cancel buttons
            oUIModel.setProperty("/tableEdit", true);

            // Set the selected row as editable
            var oModel = this.getView().getModel("LibraryData");
            var oSelectedRow = oUIModel.getProperty("/selectedRow");
            console.log(oSelectedRow
            )




            oModel.refresh();
        },
        onSaveBorrowedBook: function () {
            var oUIModel = this.getView().getModel("ui");
            oUIModel.setProperty("/editMode", true);  // Show Edit button
            oUIModel.setProperty("/saveMode", false); // Hide Save/Cancel buttons
            oUIModel.setProperty("/tableEdit", false);

            // Save the data to the backend (optional)
            var oModel = this.getView().getModel("LibraryData");
            oModel.refresh();
        },

        onCancelEditBorrowedBook: function () {
            var oUIModel = this.getView().getModel("ui");
            oUIModel.setProperty("/editMode", true);  // Show Edit button
            oUIModel.setProperty("/saveMode", false); // Hide Save/Cancel buttons
            oUIModel.setProperty("/tableEdit", false);

            // Reset the editable state of the selected row
            var oModel = this.getView().getModel("LibraryData");
            var oSelectedRow = oUIModel.getProperty("/selectedRow");
            // oSelectedRow.editable = false;
            oModel.refresh();
        },
        handleGroupButtonPressed: function () {
            if (!this.cDialog) {
                this.cDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "libraryfrontend.fragments.groupDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.cDialog.then(oDialog => oDialog.open());

        },
        handleGroupDialogConfirm: function (oEvent) {
            MessageToast.show('We are in work')
            let oGroupItems = oEvent.getParameter('groupItem')
            let sColumnPath = 'ID'
            let bDecending = oEvent.getParameter('groupDescending')
            let oGroups = []
            let bGroupEnable = false

            if (oGroupItems) {
                sColumnPath = oGroupItems.getKey()
                bGroupEnable = true
            }
            oGroups.push(new Sorter(sColumnPath, bDecending, bGroupEnable))

            let oTable = this.byId('borrowedTable')
            let oBinding = oTable.getBinding('items')

            oBinding.sort(oGroups)

        },
        handleSelectionChange: function (oEvent) {
            let oTable = oEvent.getSource();
            let oSelectedItem = oTable.getSelectedItem();
            console.log(oSelectedItem)
            if (oSelectedItem) {
                let sPath = oSelectedItem.getBindingContext("LibraryData").getPath();
                this.getView().getModel("ui").setProperty("/selectedRow", sPath);
            }
        },






        // Navigation
        onBookListItemPress: function (oEvent) {

            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext("LibraryData");
            console.log(oContext)
            console.log(oContext.getObject())
            const sId = oContext.getObject().BookID;
            console.log(sId)
            // let oRouter = this.getOwnerComponent().getRouter();
            // oRouter.navTo("RouteBookdetail", { entityName2: "book", entityId2: sId });

        },

        onListItemPress: function (oEvent) {
            // Get the selected list item and its binding context
            var oListItem = oEvent.getSource();
            var oBindingContext = oListItem.getBindingContext("LibraryData");

            // Determine the selected IconTabFilter
            var sSelectedTab = this.getView().byId("idIconTabBarStretchContent").getSelectedKey();
            console.log(sSelectedTab)
            // Navigate to the appropriate detail page
            if (sSelectedTab === "Book") {
                // Extract book ID and navigate to BookDetail
                var sBookId = oBindingContext.getProperty("ID");
                var sBookISBN = oBindingContext.getProperty("ISBN");
                console.log(oBindingContext.getProperty("ID"))
                this.getOwnerComponent().getRouter().navTo("RouteBookdetail", {
                    bookId: sBookId, ISBN: sBookISBN
                });
            } else if (sSelectedTab === "Customer") {
                // Extract customer ID and navigate to CustomerDetail
                console.log(oBindingContext.getProperty("ID"))
                var sCustomerId = oBindingContext.getProperty("ID");
                var sCustomeEmail = oBindingContext.getProperty("EMAIL");
                console.log(sCustomerId)
                this.getOwnerComponent().getRouter().navTo("RouteCustomerDetail", {
                    id: sCustomerId, email: sCustomeEmail
                });
            }
        },


        // Fragments
        onNewBorrow: function () {
            console.log("onNewBorroe")
            if (!this.rDialog) {
                this.rDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "libraryfrontend.fragments.newBorrow",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.rDialog.then(oDialog => oDialog.open());

        },
        onCancelBorrowBook: function () {
            this.byId('newBorrowDialog').close();
            this.getView().getModel("nBorrow").setData({
                BOOK_NAME: "",
                BOOK_ISBN: "",
                CUSTOMER_NAME: "",
                CUSTOMER_EMAIL: "",
                QUANTITY: ""
            });


        },
        handleValueHelp: function (oEvent) {
            console.log("handleValueHelp");
            if (!this.bDialog) {
                Fragment.load({
                    id: this.createId("valueHelpDialog"),
                    name: "libraryfrontend.fragments.booksDialog",
                    controller: this
                }).then(oDialog => {
                    this.bDialog = oDialog;
                    this.getView().addDependent(this.bDialog);
                    this.bDialog.open();
                });
            } else {
                this.bDialog.open();
            }
        },
        onAutoRefresh: function (oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();

            // create popover
            if (!this._pAutoRefresh) {
                this._pAutoRefresh = Fragment.load({
                    id: oView.getId(),
                    name: "libraryfrontend.fragments.autoRefresh",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pAutoRefresh.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },
        onTimepress: function (oEvent) {
            let oSelectedItem = oEvent.getParameter("selectedItem");
            let oNotificationModel = this.getView().getModel("oNotification");
            if (oSelectedItem) {
                let sSelectedKey = oSelectedItem.getKey();
                if (Number(sSelectedKey)) {
                    this.getView().byId('autoRefresh').setProperty('icon', 'sap-icon://stop')
                    this.getView().byId('autoRefresh').setProperty('type', 'Reject')
                    this.getView().byId('autoRefresh').mAggregations.tooltip = 'Refresh in Shedule'
                    this._autoRefreshTime(sSelectedKey)
                    this.byId('myPopover').close()

                    // // Get existing notifications
                    let aNotifications = oNotificationModel.getProperty("/notifications");

                    // Add new notification
                    aNotifications.unshift({
                        title: "Auto Refresh",
                        description: `Auto refresh schedule is on for ${sSelectedKey == 60
                                ? "every minute"
                                : sSelectedKey == 300
                                    ? "every 5 minutes"
                                    : sSelectedKey + " seconds"
                            }.`,
                        showClose: true,
                        isRead: false,
                        authorName: "Arjun",
                    });
                    // Update the model properly
                    oNotificationModel.setProperty("/notifications", aNotifications);
                    console.log(aNotifications.length);
                    oNotificationModel.setProperty("/length", aNotifications.length)

                } else {
                    this.getView().byId('autoRefresh').setProperty('icon', 'sap-icon://restart')
                    this.getView().byId('autoRefresh').setProperty('type', 'Transparent')
                    this._autoRefreshTime(sSelectedKey)
                    this.byId('myPopover').close()
                    this.getView().byId("messageContainer").removeAllItems();

                }

            }
        },

        _autoRefreshTime: function (time) {
            if (this._refreshInterval) {
                clearInterval(this._refreshInterval);
            }
            if (this._countdownInterval) {
                clearInterval(this._countdownInterval);
            }

            let remainingTime = time; 
            let oMessageContainer = this.getView().byId("messageContainer");
            oMessageContainer.removeAllItems();

            // Create the MessageStrip dynamically
            let oMessageStrip = new sap.m.MessageStrip({
                text: `Auto refresh is scheduled. Next refresh in ${this._formatTime(remainingTime)}`,
                showIcon: true,
                showCloseButton: true
            });
            oMessageContainer.addItem(oMessageStrip);

            if (time > 0) {
                // Start the refresh interval
                this._refreshInterval = setInterval(() => {
                    var oModel = this.getView().getModel("LibraryData");
                    oModel.refresh();
                    MessageToast.show("Data refreshed");
                    remainingTime = time; // Reset countdown after refresh
                }, time * 1000);

                // Start the countdown interval (updates MessageStrip text)
                this._countdownInterval = setInterval(() => {
                    if (remainingTime > 0) {
                        oMessageStrip.setText(`Auto refresh is scheduled. Next refresh in ${this._formatTime(remainingTime)}`);
                        remainingTime--;
                    } else {
                        remainingTime = time; // Reset countdown
                    }
                }, 1000);
            }
        },

        _formatTime: function (seconds) {
            let mins = Math.floor((seconds % 3600) / 60);
            let secs = seconds % 60;

            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        ,
        onNotificationBtnPress: function (oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();

            // create popover
            if (!this._pNotification) {
                this._pNotification = Fragment.load({
                    id: oView.getId(),
                    name: "libraryfrontend.fragments.notificationDialog",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pNotification.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },
        onCloseNotificationBtn: function (oEvent) {
            var oItem = oEvent.getSource();
            var oList = oItem.getParent();
            var oNotificationModel = this.getView().getModel("oNotification");


            var aNotifications = oNotificationModel.getProperty("/notifications");

            var iIndex = oList.indexOfItem(oItem);
            if (iIndex !== -1) {
                aNotifications.splice(iIndex, 1);
                oNotificationModel.setProperty("/notifications", aNotifications);

                MessageToast.show("Notification Closed: " + oItem.getTitle());
            }
            oNotificationModel.setProperty("/length", aNotifications.length)
        },
        handleCloseNotificationPop: function () {
            this.byId("myNotificationPopover").close();
        },


        _handleValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            console.log(oSelectedItem.getProperty('title'))
            let oInputId = this.byId('bookNameInput')
            let bISBNInput = this.byId('bookISBNInput')

            oInputId.setValue(oSelectedItem.getProperty('title'))
            bISBNInput.setValue(oSelectedItem.getProperty('description'))
        },
        _handleValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter(
                "Title",
                FilterOperator.Contains, sValue
            );
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },
        handleCustValueHelp: function (oEvent) {

            // // create value help dialog
            if (!this.cusDialog) {
                this.cusDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "libraryfrontend.fragments.customerDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.cusDialog.then(oDialog => oDialog.open());

            console.log('handleCValueHelp')

        },
        _handleCustValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            console.log(oSelectedItem.getProperty('title'))
            let cNameInput = this.byId('customerNameInput')
            let cEmailInput = this.byId('customerEmailInput')

            cNameInput.setValue(oSelectedItem.getProperty('title'))
            cEmailInput.setValue(oSelectedItem.getProperty('description'))
        },
        onSaveBorrowBook: function () {
            let nBorrow = this.getView().getModel('nBorrow')
            let LibraryData = this.getView().getModel('LibraryData')
            let sUrl = `${this.getOwnerComponent().getModel("LibraryData").getServiceUrl()}borrowedBooks`
            var oNotificationModel = this.getView().getModel("oNotification");
            var aNotifications = oNotificationModel.getProperty("/notifications");
            let that = this
            $.ajax({
                url: sUrl,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(nBorrow.getData()),
                success: function (oData) {
                    console.log(oData)
                    // Add new notification
                    aNotifications.unshift({
                        title: "📚 New Borrowing Entry Added",
                        description: `
                        ${oData.BOOK_NAME} 
                        borrowed by ${oData.CUSTOMER_NAME} 
                        on ${oData.BORROWED_DATE}. 
                        Due by ${oData.DUE_DATE}.`,
                        showClose: true,
                        isRead: false
                    });
                    oNotificationModel.setProperty("/length", aNotifications.length)
                    LibraryData.refresh()
                    that.onCancelBorrowBook()
                },
                error: function (error) {
                    MessageBox.error(error.responseJSON.
                        error.message
                    )
                }
            })
        },
        onCreateCustomer: function (oEvent) {
            if (!this.custDialog) {
                this.custDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "libraryfrontend.fragments.customerForm",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.custDialog.then(oDialog => oDialog.open());

        },
        onCloseDialog : function() {
            this.byId('customerFormDialog').close()
        },
        onGenderSelect: function(oEvent){
            var oRadioButtonGroup = this.byId("rbg3");
    var selectedIndex = oRadioButtonGroup.getSelectedIndex(); 

    if (selectedIndex !== -1) {
        var selectedButton = oRadioButtonGroup.getButtons()[selectedIndex];
        var selectedText = selectedButton.getText();
        sap.m.MessageToast.show("Selected Gender: " + selectedText);
        return selectedText;
    } else {
        sap.m.MessageToast.show("No gender selected");
        return null;

    }
},
        onSubmitCustomer : function () {
            let nCustomer = this.getView().getModel('nCustomer')
            console.log(nCustomer.getData())
        }


    });
});