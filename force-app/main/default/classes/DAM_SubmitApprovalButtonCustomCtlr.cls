public with sharing class DAM_SubmitApprovalButtonCustomCtlr {
    @AuraEnabled
	public static Boolean applyApproval(String comment, String riskId, String projectId) {
        Savepoint sp = Database.setSavepoint();
        try {
            ApprovalAssign__c approvalAssign = insertApprovalAssign(comment, projectId, riskId);
            List<Approval.ProcessSubmitRequest> apps = new List<Approval.ProcessSubmitRequest>();
            Approval.ProcessSubmitRequest approvalRequest = new Approval.ProcessSubmitRequest();
            approvalRequest.setObjectId(riskId);
            approvalRequest.setComments(comment);
            apps.add(approvalRequest);

            List<Approval.ProcessResult> proResult = Approval.process(apps);
            if(proResult[0].isSuccess()){
                approvalAssign.No_Of_Applications__c = 1;
                approvalAssign.OwnerId = proResult[0].ActorIds[0];
                update approvalAssign;

                List<ermt__Project__c> projects = [SELECT ID, Name, Assigned_Approver_01__c FROM ermt__Project__c WHERE ID =: projectId LIMIT 1];
                if(!projects.isEmpty()) DAM_ProjectRisklistApprovalCtrl.sendApprovalRiskRequestMail(projects[0].Assigned_Approver_01__c, approvalAssign.Id);
            }

            return true;
        } catch (Exception e) {
            Database.rollback(sp);
            return false;
        }
    }

    private static ApprovalAssign__c insertApprovalAssign(String comment, String projectId, String riskId){
        Id contextUserId = UserInfo.getUserId();
        List<User> contextUsers = [SELECT ID, Name, AccountNumber__c FROM User WHERE ID =: contextUserId LIMIT 1];
        List<Account> accounts;
        if(!contextUsers.isEmpty()) accounts = [SELECT ID FROM Account WHERE AccountNumber =: contextUsers[0].AccountNumber__c LIMIT 1];

        ApprovalAssign__c appAss = new ApprovalAssign__c(
            Project__c = projectId,
            Organization__c = !accounts.isEmpty() ? accounts[0].Id : null,
            Applicant__c = contextUserId,
            Application_Comment__c = comment,
            Application_Type__c = '個別'
        );

        insert appAss;
        insertApprovalAssignRiskJuncs(appAss, riskId);

        return appAss;
    }

    private static void insertApprovalAssignRiskJuncs(ApprovalAssign__c appAss, String riskId){
        List<ApprovalAssign_Risk_Junc__c> arjs = new List<ApprovalAssign_Risk_Junc__c>();
        arjs.add(new ApprovalAssign_Risk_Junc__c(
            Risk__c = riskId,
            ApprovalAssign__c = appAss.Id
        ));
        insert arjs;
    }
}