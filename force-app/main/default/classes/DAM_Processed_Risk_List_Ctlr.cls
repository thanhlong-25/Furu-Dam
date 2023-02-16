public with sharing class DAM_Processed_Risk_List_Ctlr {
    @AuraEnabled
    public static List<ApprovalAssign_Risk_Junc__c> getApprovalAssignRiskData(String approvalAssignId, String displayType){
        return new List<ApprovalAssign_Risk_Junc__c>([SELECT ID, DataAtTheTimeOfApproval__c
                                                    FROM ApprovalAssign_Risk_Junc__c
                                                    WHERE ApprovalAssign__c =: approvalAssignId
                                                    AND Risk__c IN (SELECT TargetObjectId FROM ProcessInstance WHERE Status =: displayType)
                                                    ]);
    }
}
