@isTest
private class DAM_BulkApprovalTest {

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
        for (Integer i = 1; i < 2; i++) {
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

    // @Method: DAM_BulkApproval.getApprovalAssignById()
    // @Case: Happy case
    @isTest static void getApprovalAssignByIdTest_1(){
        Map<String, Object> data = initData();
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        List<ermt__Project__c> projects = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<Account> accounts = (List<Account>)data.get('Account');
        ApprovalAssign__c aa = DAM_BulkApproval.getApprovalAssignById(approvalAssigns[0].Id);

        System.assertEquals(accounts[0].Id, aa.Organization__c);
        System.assertEquals(projects[0].Id, aa.Project__c);
    }

    // @Method: DAM_BulkApproval.getApprovalAssignById()
    // @Case: Invalid params
    // @param: recordId -> Invalid
    @isTest static void getApprovalAssignByIdTest_2(){
        Map<String, Object> data = initData();
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        List<ermt__Project__c> projects = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<Account> accounts = (List<Account>)data.get('Account');
        ApprovalAssign__c aa = DAM_BulkApproval.getApprovalAssignById('Invalid Id');

        System.assertEquals(null, aa);
    }

    // @Method: DAM_BulkApproval.multiApprovalProcess()
    // Case: Happy case with action = 'Approve'
    @IsTest static void multiApprovalProcessTest_1(){
        Map<String, Object> data = initData();
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);

        // Before Run Process
        List<ProcessInstance> proInsBefore = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Pending', proInsBefore[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsBefore = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.PENDING, arjsBefore[0].Approval_Status__c);

        DAM_BulkApproval.multiApprovalProcess('Approve', 'Comment', new List<String>{risks[0].Id}, approvalAssigns[0].Id);

        // After Run Process
        List<ProcessInstance> proInsAfter = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Approved', proInsAfter[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsAfter = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.APPROVE, arjsAfter[0].Approval_Status__c);
    }

    // @Method: DAM_BulkApproval.multiApprovalProcess()
    // @Case:: Happy case with action = 'Reject'
    @IsTest static void multiApprovalProcessTest_2(){
        Map<String, Object> data = initData();
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);

        // Before Run Process
        List<ProcessInstance> proInsBefore = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Pending', proInsBefore[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsBefore = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.PENDING, arjsBefore[0].Approval_Status__c);

        DAM_BulkApproval.multiApprovalProcess('Reject', 'Comment', new List<String>{risks[0].Id}, approvalAssigns[0].Id);

        // After Run Process
        List<ProcessInstance> proInsAfter = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Rejected', proInsAfter[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsAfter = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.REJECT, arjsAfter[0].Approval_Status__c);
    }

    // @Method: DAM_BulkApproval.multiApprovalProcess()
    // @Case: Missing param
    // @param: action -> null
    @IsTest static void multiApprovalProcessTest_3(){
        Map<String, Object> data = initData();
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);

        // Before Run Process
        List<ProcessInstance> proInsBefore = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Pending', proInsBefore[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsBefore = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.PENDING, arjsBefore[0].Approval_Status__c);

        DAM_BulkApproval.multiApprovalProcess(null, 'Comment', new List<String>{risks[0].Id}, approvalAssigns[0].Id);

        // After Run Process
        List<ProcessInstance> proInsAfter = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Pending', proInsAfter[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsAfter = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.PENDING, arjsAfter[0].Approval_Status__c);
    }

    // @Method: DAM_BulkApproval.multiApprovalProcess()
    // @Case: Missing param
    // @param: comment -> null
    @IsTest static void multiApprovalProcessTest_4(){
        Map<String, Object> data = initData();
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);

        // Before Run Process
        List<ProcessInstance> proInsBefore = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Pending', proInsBefore[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsBefore = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.PENDING, arjsBefore[0].Approval_Status__c);

        DAM_BulkApproval.multiApprovalProcess('Approve', null, new List<String>{risks[0].Id}, approvalAssigns[0].Id);

        // After Run Process
        List<ProcessInstance> proInsAfter = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE TargetObjectId =: risks[0].Id];
        System.assertEquals('Approved', proInsAfter[0].Status);
        List<ApprovalAssign_Risk_Junc__c> arjsAfter = [SELECT ID, Approval_Status__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssigns[0].Id];
        System.assertEquals(DAM_BulkApproval.APPROVE, arjsAfter[0].Approval_Status__c);
    }

    // @Method: DAM_BulkApproval.multiApprovalProcess()
    // @Case: Missing param
    // @param: riskIds -> null
    @IsTest static void multiApprovalProcessTest_5(){
        Map<String, Object> data = initData();
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);

        // Before Run Process
        List<ProcessInstance> proInsBefore = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE Status = 'Pending'];
        System.assertEquals(3, proInsBefore.size());

        DAM_BulkApproval.multiApprovalProcess('Approve', 'Comment', new List<String>(), approvalAssigns[0].Id);

        // After Run Process
        List<ProcessInstance> proInsAfter = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE Status = 'Pending'];
        System.assertEquals(3, proInsBefore.size());
    }

    // @Method: DAM_BulkApproval.multiApprovalProcess()
    // @Case: Missing param
    // @param: approvalAssignId -> null
    @IsTest static void multiApprovalProcessTest_6(){
        Map<String, Object> data = initData();
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);

        // Before Run Process
        List<ProcessInstance> proInsBefore = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE Status = 'Pending'];
        System.assertEquals(3, proInsBefore.size());

        DAM_BulkApproval.multiApprovalProcess('Approve', 'Comment', new List<String>{risks[0].Id}, '');

        // After Run Process
        List<ProcessInstance> proInsAfter = [SELECT ID, Status, TargetObjectId FROM ProcessInstance WHERE Status = 'Pending'];
        System.assertEquals(3, proInsBefore.size());
    }

    // @Method: DAM_BulkApproval.getRisks()
    // @Case: Happy case
    @IsTest static void getRisksTest_1() {
        // データ作成
        Map<String, Object> data = initData();
        List<User> usrs = (List<User>)data.get('User');
        List<Account> accounts = (List<Account>)data.get('Account');
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ermt__Project__c> projects = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        System.runAs(usrs[0]) {
            // 表示項目リスト
            List<String> dispFieldNames = new List<String>{
                'Name'
            };
            // 検索条件リスト
            List<Map<String, Object>> searchConds = new List<Map<String, Object>>{
                new Map<String, Object>{
                    'no' => 1
                    , 'fieldName' => 'Id'
                    , 'operator' => DAM_FieldOperatorSelectCtlr.OPERATOR_VALUE_EQUAL
                    , 'value' => ''
                    , 'errMsg' => ''
                }
            };

            // 検索条件ロジック
            String searchCondLogic = '(NOT 1)';

            // リスクリストの取得
            Map<String, Object> result = DAM_BulkApproval.getRisks(
                approvalAssigns[0].Id
                , projects[0].Id
                , accounts[0].Id
                , dispFieldNames
                , searchConds
                , searchCondLogic
                , null
                , null
            );

            // 検証
            System.assert(!result.isEmpty());
        }
    }

    // @Method: DAM_BulkApproval.getRisks()
    // @Case: Happy case
    @isTest static void getRisksTest_2() {
        // データ作成
        Map<String, Object> data = initData();
        List<User> usrs = (List<User>)data.get('User');
        List<Account> accounts = (List<Account>)data.get('Account');
        List<ermt__Risk__c> risks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        List<ermt__Project__c> projects = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ApprovalAssign__c> approvalAssigns = (List<ApprovalAssign__c>)data.get('ApprovalAssign__c');
        createApprovalRequest(risks, approvalAssigns);
        System.runAs(usrs[0]) {
            // 表示項目リスト
            List<String> dispFieldNames = new List<String>{
                'Name', 'ermt__Organization__c', 'ermt__AssessmentStatus__c'
            };
            // 検索条件リスト
            List<Map<String, Object>> searchConds = new List<Map<String, Object>>();

            // 検索条件ロジック
            String searchCondLogic = '';

            // リスクリストの取得
            Map<String, Object> result = DAM_BulkApproval.getRisks(
                approvalAssigns[0].Id
                , projects[0].Id
                , accounts[0].Id
                , dispFieldNames
                , searchConds
                , searchCondLogic
                , null
                , null
            );

            // 検証
            System.assert(!result.isEmpty());
        }
    }

    // @Test Case: Missing param
    // @param: approvalAssignId -> null

    // @UTIL METHOD: Create approval request
    static void createApprovalRequest(List<ermt__Risk__c> risks, List<ApprovalAssign__c> approvalAssigns){
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
                    ApprovalAssign__c = approvalAssigns[0].Id
                ));
            }

        insert arjs;
        Approval.process(apps);
    }
}

