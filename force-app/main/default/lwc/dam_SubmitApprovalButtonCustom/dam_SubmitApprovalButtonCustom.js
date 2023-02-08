import { LightningElement, track, wire, api } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import label_approvalSubmit_title from '@salesforce/label/c.ApprovalSubmit_Title';
import label_comment from '@salesforce/label/c.ApprovalApprove_Comments';
import label_approvalCancel from '@salesforce/label/c.ApprovalApprove_Cancel';
import label_approvalSubmitError from '@salesforce/label/c.ApprovalSubmit_Uncompleted';
import label_approvalSubmit_complete from '@salesforce/label/c.ApprovalSubmit_Complete';
import label_approvalSubmit_complete_detail from '@salesforce/label/c.ApprovalSubmit_Complete_Detail';

import { getRecord } from 'lightning/uiRecordApi';
import PROJECT_FIELD from '@salesforce/schema/ermt__Risk__c.ermt__Project__c';
import applyApproval from '@salesforce/apex/DAM_SubmitApprovalButtonCustomCtlr.applyApproval';

export default class Dam_SubmitApprovalButtonCustom extends LightningElement {
    @api recordId;

    label = {
        modal_title: 'Submit for Approval',
        submit: label_approvalSubmit_title,
        comment: label_comment,
        cancel: label_approvalCancel,
        approval_error: label_approvalSubmitError,
        approval_complete: label_approvalSubmit_complete,
        approval_complete_detail: label_approvalSubmit_complete_detail
    }

    @track errorMessage = null;
    @track isProcessing = false;
    projectId = null;
    comment;

    @wire(getRecord, { recordId: '$recordId', fields: [ PROJECT_FIELD ] })
    riskRecord(data, error){
        if(data){
            this.projectId = data.data?.fields?.ermt__Project__c?.value;
        }
    }

    handleCloseModal() {
        this.comment = null;
        this.errorMessage = null;
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    handleChangeComment(event){
        let value = event.target.value;
        this.comment = value;
    }

    async handleSubmitApproval(event){
        try {
            this.isProcessing = true;
            if(!this.projectId) {
                this.errorMessage = this.label.approval_error;
                return;
            }

            let approvalResult = await applyApproval({
                comment: this.comment,
                riskId: this.recordId,
                projectId: this.projectId
            })

            if(!approvalResult){
                this.errorMessage = this.label.approval_error;
                return;
            }

            let evt = new ShowToastEvent({
                title: this.label.approval_complete,
                message: this.label.approval_complete_detail,
                variant: 'success',
            });
            this.dispatchEvent(evt);
            this.dispatchEvent(new CloseActionScreenEvent());

        } catch (error) {
            this.errorMessage = this.label.approval_error;
        } finally {
            this.isProcessing = false;
        }

    }
}