import { LightningElement, api, track } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import copyAccount from '@salesforce/apex/CopyAccountCtlr.copyAccount';
import { NavigationMixin } from 'lightning/navigation';

export default class CopyAccount extends NavigationMixin(LightningElement) {
    @api recordId;
    isProcessing = false;
    @track errorMessage;
    @track isError = false;
    async handleSubmit() {
        this.isProcessing = true;
        await copyAccount({ recordId: this.recordId }).then((recordIdCreate) => {
            // Close the modal window and display a success toast
            this.dispatchEvent(new CloseActionScreenEvent());
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Copy Account successful',
                    variant: 'success'
                })
            );
            this[NavigationMixin.Navigate]({
                type: "standard__recordPage",
                attributes: {
                    recordId: recordIdCreate,
                    objectApiName: "Account",
                    actionName: "view"
                }
            });
        }).catch(error => {
            this.handleShowError(error?.body?.message);
        });
        this.isProcessing = false;
    }


    handleShowError(errorMessage) {
        this.isError = true;
        this.errorMessage = errorMessage;
    }

    handleCancel() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    
}