import { LightningElement,wire,api } from 'lwc';
import getAccountRecords from '@salesforce/apex/AccountDetails.getAccounts';
import { refreshApex } from '@salesforce/apex';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import REVENUE_FIELD from '@salesforce/schema/Account.AnnualRevenue';
import { NavigationMixin } from 'lightning/navigation';

export default class DemoApp extends NavigationMixin(LightningElement) {
    //Datatable cloumns
    columns = [
        { label: 'Account Name', 
            fieldName: 'NameURL', 
            type: 'url' ,
            sortable: true, 
            typeAttributes: { 
                label: {
                    fieldName: NAME_FIELD.fieldApiName
                },
                target: '_blank'
            },
        },
        { label: 'Owner Name', fieldName: 'OwnerName', type: 'text' ,sortable: true},
        { label: 'Phone', fieldName: PHONE_FIELD.fieldApiName, type: 'Phone' , editable: true},
        { label: 'Website', fieldName: WEBSITE_FIELD.fieldApiName, type: 'url' , editable: true},
        { label: 'AnnualRevenue', fieldName: REVENUE_FIELD.fieldApiName, type: 'number' }
    ];
    draftValues = [];
    accountList = [];
    accountListFilter = [];

    //Function to perform save operation
    async handleSave(event) {
        console.log(this.accountList);
        // Convert datatable draft values into record objects
        const records = event.detail.draftValues.slice().map((draftValue) => {
            const fields = Object.assign({}, draftValue);
            return { fields };
        });

        // Clear all datatable draft values
        this.draftValues = [];

        try {
            // Update all records in parallel thanks to the UI API
            const recordUpdatePromises = records.map((record) =>
                updateRecord(record)
            );

            await Promise.all(recordUpdatePromises).then(results => {
                //results.forEach(result => console.log(result));
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or reloading contacts',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });

            // Report success with a toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account updated',
                    variant: 'success'
                })
            );

            // Display fresh data in the datatable
            this.getAccountDetails();
            refreshApex(this.apex);
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating or reloading contacts',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        }
    }
    //Apex call to get all the required accounts
    getAccountDetails(){
        getAccountRecords()
        .then((result) => {
            this.accountList = result;
            this.accountList = JSON.parse(JSON.stringify(result));
            this.accountList.forEach(acc =>{
                acc.OwnerName = acc.Owner.Name;
                acc.NameURL = '/lightning/r/'+acc.Id+'/view';
            });
            this.accountListFilter = this.accountList;
        })
        .catch((error) => {
            this.error = error;
            console.log('Error is', this.error); 
        });
    }

    connectedCallback() {
        this.getAccountDetails();
    }
    //Search by Account Name
    updateSearch(event) {
        var regex = new RegExp(event.target.value,'gi')
        this.accountList = this.accountListFilter.filter(
            row => regex.test(row.Name)
        );
    }
    //Datatable Column sorting method
    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };

        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.accountList];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.accountList = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }
}