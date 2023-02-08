@isTest
public with sharing class DAM_SubmitApprovalButtonCustomCtlrTest {
    static Map<String, Object> makeData() {
        Map<String, Object> ret = new Map<String, Object>();
        List<User> usrs = new List<User>();
        for (Integer i = 0; i < 3; i++) {
            User usr = DAM_TestDataFactory.createUser(i + 1);
            usrs.add(usr);
        }
        insert usrs;
        ret.put('User', usrs);

        System.runAs(usrs[0]) {
            List<Account> accs = new List<Account>();
            for (Integer i = 0; i < 1; i++) {
                Account acc = DAM_TestDataFactory.createAccount(i + 1);
                accs.add(acc);
            }
            insert accs;
            ret.put('Account', accs);

            List<ermt__Project__c> prjs = new List<ermt__Project__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Project__c prj = DAM_TestDataFactory.createProject(i + 1);
                prj.Assigned_Approver_01__c = usrs[0].Id;
                prjs.add(prj);
            }
            insert prjs;
            ret.put('ermt__Project__c', prjs);

            List<ermt__Risk__c> rsks = new List<ermt__Risk__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Risk__c rsk = DAM_TestDataFactory.createRisk(i + 1, accs[0]);
                rsk.ermt__Project__c = prjs[0].Id;
                rsk.ermt__Organization__c = accs[0].Id;
                rsk.ermt__ApprovalStatus__c = '編集中';
                rsks.add(rsk);
            }
            insert rsks;
            ret.put('ermt__Risk__c', rsks);
        }
        return ret;
    }
    // @Method: DAM_ProjectRisklistApprovalCtrl.multiApplyApproval()
    // @Case: Happy case
    @isTest static void multiApplyApprovalTest_1(){
        Map<String, Object> data = makeData();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ermt__Risk__c> rsks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        System.runAs(usrs[0]) {
            Boolean result = DAM_SubmitApprovalButtonCustomCtlr.applyApproval('please approval', rsks[0].Id, prjs[0].Id);
            System.assertEquals(true, result);
        }
    }

    // @Method: DAM_ProjectRisklistApprovalCtrl.multiApplyApproval()
    // @Case: Resend approval request to take "false" result
    @isTest static void multiApplyApprovalTest_2(){
        Map<String, Object> data = makeData();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ermt__Risk__c> rsks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        System.runAs(usrs[0]) {
            Boolean result = DAM_SubmitApprovalButtonCustomCtlr.applyApproval('please approval', rsks[0].Id, prjs[0].Id);
            Boolean result2 = DAM_SubmitApprovalButtonCustomCtlr.applyApproval('please approval', rsks[0].Id, prjs[0].Id);
            System.assertEquals(false, result2);
        }
    }
}