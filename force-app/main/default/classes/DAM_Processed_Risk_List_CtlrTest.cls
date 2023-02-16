@isTest
private class DAM_Processed_Risk_List_CtlrTest {
    // Initialize data
    static Map<String, Object> initData(){
        Map<String, Object> ret = new Map<String, Object>();
        // ユーザ
        List<User> usrs = new List<User>();
        for (Integer i = 1; i < 2; i++) {
            User usr = DAM_TestDataFactory.createUser(i);
            usrs.add(usr);
        }
        insert usrs;
        ret.put('User', usrs);

        // 組織・部門
        List<Account> accs = new List<Account>();
        for (Integer i = 1; i < 2; i++) {
            Account acc = DAM_TestDataFactory.createAccount(i);
            accs.add(acc);
        }
        insert accs;
        ret.put('Account', accs);

        // プロジェクト
        List<ermt__Project__c> prjs = new List<ermt__Project__c>();
            for (Integer i = 1; i < 3; i++) {
                ermt__Project__c prj = DAM_TestDataFactory.createProject(i);
                prjs.add(prj);
            }
        insert prjs;
        ret.put('ermt__Project__c', prjs);

        // リスク
        List<ermt__Risk__c> rsks = new List<ermt__Risk__c>();
        for (Integer i = 1; i < 4; i++) {
            ermt__Risk__c rsk = DAM_TestDataFactory.createRisk(i, accs[0]);
            rsk.ermt__Project__c = prjs[0].Id;
            rsk.ermt__Organization__c = accs[0].Id;
            rsks.add(rsk);
        }
        insert rsks;
        ret.put('ermt__Risk__c', rsks);

        // 対応策
        List<ermt__Control__c> ctls = new List<ermt__Control__c>();
        for (Integer i = 1; i < 2; i++) {
            ermt__Control__c ctl = DAM_TestDataFactory.createControl(i, accs[0]);
            ctls.add(ctl);
        }
        insert ctls;
        ret.put('ermt__Control__c', ctls);

        // リスク対応策
        List<ermt__Risk_Control_Junc__c> rskCtls = new List<ermt__Risk_Control_Junc__c>();
        for (Integer i = 0; i < 1; i++) {
            ermt__Risk_Control_Junc__c rskCtl = DAM_TestDataFactory.createRiskControl(
                rsks[0]
                , ctls[0]
            );
            rskCtls.add(rskCtl);
        }
        insert rskCtls;
        ret.put('ermt__Risk_Control_Junc__c', rskCtls);

        // リスク対応策
        List<ApprovalAssign__c> approvalAssigns = new List<ApprovalAssign__c>();
        for (Integer i = 1; i <= 2; i++) {
            ApprovalAssign__c approvalAssign = new ApprovalAssign__c(
                Applicant__c = usrs[0].Id,
                Application_Comment__c = 'Comment ' + i,
                Application_Type__c = '一覧',
                No_Of_Applications__c = 1,
                Project__c = prjs[0].Id,
                Organization__c = accs[0].Id
            );
            approvalAssigns.add(approvalAssign);
        }
        insert approvalAssigns;
        ret.put('ApprovalAssign__c', approvalAssigns);

        return ret;
    }

    // @Method: DAM_Prosessed_Risk_List_Ctlr.getRisks()
    // @Case: Happy case.
    @isTest static void getApprovalAssignRiskDatat_1() {
        // データ作成
        Map<String, Object> data = initData();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns[0]);
        submitApprovalRequest(risks, 'Approve');
        System.runAs(usrs[0]) {
            List<ApprovalAssign_Risk_Junc__c> result = DAM_Processed_Risk_List_Ctlr.getApprovalAssignRiskData(
                approvalAssigns[0].Id
                , 'Approved'
            );

            // 検証
            System.assert(!result.isEmpty());
        }
    }

    // @Method: DAM_Prosessed_Risk_List_Ctlr.getRisks()
    // @Case: Happy case.
    @isTest static void getApprovalAssignRiskDatat_2() {
        // データ作成
        Map<String, Object> data = initData();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns[1]);
        submitApprovalRequest(risks, 'Reject');
        System.runAs(usrs[0]) {

            // リスクリストの取得
            List<ApprovalAssign_Risk_Junc__c> result = DAM_Processed_Risk_List_Ctlr.getApprovalAssignRiskData(
                approvalAssigns[1].Id
                , 'Rejected'
            );

            // 検証
            System.assert(!result.isEmpty());
        }
    }

    // @Method: DAM_Prosessed_Risk_List_Ctlr.getRisks()
    // @Case: Happy case.
    @isTest static void getApprovalAssignRiskDatat_3() {
        // データ作成
        Map<String, Object> data = initData();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns[0]);
        System.runAs(usrs[0]) {
            // リスクリストの取得
            List<ApprovalAssign_Risk_Junc__c> result = DAM_Processed_Risk_List_Ctlr.getApprovalAssignRiskData(
                approvalAssigns[0].Id
                , 'Rejected'
            );

            // 検証
            System.assert(result.isEmpty());
        }
    }

    // @UTIL METHOD: Create approval request
    static void createApprovalRequest(List<ermt__Risk__c> risks, ApprovalAssign__c approvalAssigns){
        List<Approval.ProcessSubmitRequest> apps = new List<Approval.ProcessSubmitRequest>();
        List<ApprovalAssign_Risk_Junc__c> arjs = new List<ApprovalAssign_Risk_Junc__c>();
            for(ermt__Risk__c risk: risks){
                // Create List ProcessSubmitRequest
                Approval.ProcessSubmitRequest approvalRequest = new Approval.ProcessSubmitRequest();
                approvalRequest.setObjectId(risk.Id);
                approvalRequest.setComments('Comment ' + risk.Id);
                apps.add(approvalRequest);

                // Create List ApprovalAssign_Risk_Junc
                arjs.add(new ApprovalAssign_Risk_Junc__c(
                    Risk__c = risk.Id,
                    ApprovalAssign__c = approvalAssigns.Id
                ));
            }

        insert arjs;
        Approval.process(apps);
    }

    // @UTIL METHOD: Approve/Reject approval request
    static void submitApprovalRequest(List<ermt__Risk__c> risks, String action){
        List<ProcessInstanceWorkitem> workItems = [
            SELECT Id, ProcessInstanceId
            FROM ProcessInstanceWorkitem
            WHERE ProcessInstance.TargetObjectId IN :risks
          ];
        List<Approval.ProcessWorkitemRequest> requests = new List<Approval.ProcessWorkitemRequest>();
        for(ProcessInstanceWorkitem workItem : workItems){
          Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
          req.setWorkitemId(workItem.Id);
          //Valid values are: Approve, Reject, or Removed.
          //Only system administrators can specify Removed.
          req.setAction(action);
          req.setComments('Approved');
          requests.add(req);
        }
        Approval.process(requests);
    }
}
