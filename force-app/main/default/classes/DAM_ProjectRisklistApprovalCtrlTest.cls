@isTest
private class DAM_ProjectRisklistApprovalCtrlTest {
    static Map<String, Object> makeData_1() {
        Map<String, Object> ret = new Map<String, Object>();

        List<User> usrs = new List<User>();
        for (Integer i = 0; i < 3; i++) {
            User usr = DAM_TestDataFactory.createUser(i + 1);
            usrs.add(usr);
        }
        insert usrs;
        ret.put('User', usrs);

        List<UserRole> usrRoles = new List<UserRole>();
        for (Integer i = 0; i < 1; i++) {
            UserRole usrRole = DAM_TestDataFactory.createRole(i + 1, null);
            usrRoles.add(usrRole);
        }
        insert usrRoles;
        ret.put('UserRole', usrRoles);

        // insert Sub User Role
        List<UserRole> usrSubRoles = new List<UserRole>();
        for (Integer i = 0; i < 1; i++) {
            UserRole usrSubRole = DAM_TestDataFactory.createRole(2, usrRoles[0].Id);
            usrSubRoles.add(usrSubRole);
        }
        insert usrSubRoles;

        List<Group> grps = new List<Group>();
            for (Integer i = 0; i < 1; i++) {
                Group grp = DAM_TestDataFactory.createGroup(i + 1);
                grps.add(grp);
            }
        insert grps;
        ret.put('Group', grps);

        List<GroupMember> grpMembers = new List<GroupMember>();
        GroupMember grpMember = DAM_TestDataFactory.createGroupMember(grps[0].Id, usrs[0].Id);
        grpMembers.add(grpMember);
        insert grpMembers;
        ret.put('GroupMember', grpMembers);

        System.runAs(usrs[0]) {
            List<Account> accs = new List<Account>();
            for (Integer i = 0; i < 1; i++) {
                Account acc = DAM_TestDataFactory.createAccount(i + 1);
                accs.add(acc);
            }
            insert accs;
            ret.put('Account', accs);

            List<ermt__M_Classification__c> clsGrps = new List<ermt__M_Classification__c>();
            for (Integer i = 0; i < 4; i++) {
                String recordTypeDevName;
                if (i == 0) {
                    recordTypeDevName = System.Label.ClassiRecordType_AnalyseTiming;
                } else if (i == 1) {
                    recordTypeDevName = System.Label.ClassiRecordType_Probability;
                } else if (i == 2) {
                    recordTypeDevName = System.Label.ClassiRecordType_ResultImpact;
                } else if (i == 3) {
                    recordTypeDevName = System.Label.ClassiRecordType_ThirdEvaluation;
                }
                ermt__M_Classification__c clsGrp = DAM_TestDataFactory.createClassification(
                    i + 1
                    , recordTypeDevName
                    , null
                );
                clsGrps.add(clsGrp);
            }
            insert clsGrps;
            ret.put('ermt__M_Classification__c', clsGrps);

            List<ermt__M_Classification__c> clss = new List<ermt__M_Classification__c>();
            for (Integer i = 0; i < 4; i++) {
                ermt__M_Classification__c cls = DAM_TestDataFactory.createClassification(
                    i + clsGrps.size()
                    , System.Label.ClassiRecordType_Choice
                    , clsGrps[i]
                );
                clss.add(cls);
            }
            insert clss;
            ret.put('ermt__M_Classification__c_2', clss);

            List<ermt__Project__c> prjs = new List<ermt__Project__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Project__c prj = DAM_TestDataFactory.createProject(i + 1);
                prj.ermt__AnalyseTimingDefault__c = clss[0].id;
                prj.Assigned_Approver_01__c = usrs[0].Id;
                prjs.add(prj);
            }
            insert prjs;
            ret.put('ermt__Project__c', prjs);

            List<ermt__Project_Classification_Junc__c> prjClss = new List<ermt__Project_Classification_Junc__c>();
            for (Integer i = 0; i < 4; i++) {
                ermt__Project_Classification_Junc__c prjCls = DAM_TestDataFactory.createProjectClassi(
                    prjs[0]
                    , clsGrps[i]
                );
                prjClss.add(prjCls);
            }
            insert prjClss;
            ret.put('ermt__Project_Classification_Junc__c', prjClss);

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

            List<ermt__RiskAssessment__c> rskAsss = new List<ermt__RiskAssessment__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__RiskAssessment__c rskAss = DAM_TestDataFactory.createRiskAssessment(rsks[0]);
                rskAsss.add(rskAss);
            }
            insert rskAsss;
            ret.put('ermt__RiskAssessment__c', rskAsss);

            List<ermt__RiskAssessment_Classification_Junc__c> rskAssClss = new List<ermt__RiskAssessment_Classification_Junc__c>();
            for (Integer i = 0; i < 4; i++) {
                ermt__RiskAssessment_Classification_Junc__c rskAssCls = DAM_TestDataFactory.createRiskAssessmentClassi(
                    rskAsss[0]
                    , clss[i]
                );
                rskAssClss.add(rskAssCls);
            }
            insert rskAssClss;
            ret.put('ermt__RiskAssessment_Classification_Junc__c', rskAssClss);

            List<ermt__Risk_Classification_Junc__c> rskCtls = new List<ermt__Risk_Classification_Junc__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Risk_Classification_Junc__c rskCtl = DAM_TestDataFactory.createRiskClassi(
                    rsks[0]
                    , clss[0]
                );
                rskCtls.add(rskCtl);
            }
            insert rskCtls;
            ret.put('ermt__Risk_Classification_Junc__c', rskCtls);
        }
        return ret;
    }
    @isTest static void getRiskDisplayFieldNameSelsTest_1() {
        List<Map<String, Object>> sels = DAM_ProjectRisklistApprovalCtrl.getRiskDisplayFieldNameSels();
        System.assert(!sels.isEmpty());
    }
    @isTest static void getRiskAssessmentDisplayFieldNameSelsTest_1() {
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            List<Map<String, Object>> sels = DAM_ProjectRisklistApprovalCtrl.getRiskAssessmentDisplayFieldNameSels(prjs[0].Id);
            System.assert(!sels.isEmpty());
        }
    }
    @isTest static void getControlDisplayFieldSelsTest_1() {
        List<Map<String, Object>> sels = DAM_ProjectRisklistApprovalCtrl.getControlDisplayFieldNameSels();
        System.assert(!sels.isEmpty());
    }
    @isTest static void getRisklistDisplayFieldNameTest_1() {
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            String fieldName = DAM_ProjectRisklistApprovalCtrl.getRisklistDisplayFieldName(prjs[0].Id);
            System.assert(String.isEmpty(fieldName));
        }
    }
    @isTest static void getRiskFieldDescByNameTest_1() {
        List<String> dispFieldNames = new List<String>{
            'Name', 'ermt__Organization__c', 'ermt__AssessmentStatus__c'
        };
        Map<String, DAM_ProjectRisklistApprovalCtrl.FieldDescribe> fieldDescMap = DAM_ProjectRisklistApprovalCtrl.getRiskFieldDescByName(
            dispFieldNames
        );
        System.assert(!fieldDescMap.isEmpty());
    }

    @isTest static void getRiskAssessmentFieldDescByNameTest_1() {
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            List<String> dispFieldNames = new List<String>{
                System.Label.ClassiRecordType_AnalyseTiming
                , System.Label.ClassiRecordType_Probability
                , System.Label.ClassiRecordType_ResultImpact
                , System.Label.ClassiRecordType_ThirdEvaluation
                , 'ermt__isActive__c'
            };
            Map<String, DAM_ProjectRisklistApprovalCtrl.FieldDescribe> fieldDescMap = DAM_ProjectRisklistApprovalCtrl.getRiskAssessmentFieldDescByName(
                prjs[0].Id
                , dispFieldNames
            );
            System.assert(!fieldDescMap.isEmpty());
        }
    }

    @isTest static void getClassificationFieldDescByNameTest_1() {
        List<String> dispFieldNames = new List<String>{
            'ermt__Label_Pick__c'
        };
        Map<String, DAM_ProjectRisklistApprovalCtrl.FieldDescribe> fieldDescMap = DAM_ProjectRisklistApprovalCtrl.getClassificationFieldDescByName(
            dispFieldNames
        );
        System.assert(!fieldDescMap.isEmpty());
    }

    @isTest(SeeAllData=true) static void getRisksTest_1() {
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            List<String> dispFieldNames = new List<String>{
                'Name', 'ermt__Organization__c', 'ermt__AssessmentStatus__c'
            };
            Map<String, Object> result = DAM_ProjectRisklistApprovalCtrl.getRisks( prjs[0].Id, dispFieldNames, null, null);
            System.assert(!result.isEmpty());
        }
    }

    @isTest static void getRiskAssessmentsByRiskIdTest_1() {
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ermt__M_Classification__c> clss = (List<ermt__M_Classification__c>)data.get('ermt__M_Classification__c_2');
        System.runAs(usrs[0]) {
            List<String> dispFieldNames = new List<String>{
                System.Label.ClassiRecordType_AnalyseTiming
                , System.Label.ClassiRecordType_Probability
                , System.Label.ClassiRecordType_ResultImpact
                , System.Label.ClassiRecordType_ThirdEvaluation
                , 'ermt__isActive__c'
                , 'ermt__SeverityRiskLevel__c'
                , 'CreatedById'
            };

            Map<String, Object> result = DAM_ProjectRisklistApprovalCtrl.getRiskAssessmentsByRiskId(prjs[0].Id, dispFieldNames, null, null);

            System.assert(!result.isEmpty());
        }
    }

    @isTest static void getClassificationsByRiskIdTest_1() {
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            List<String> dispFieldNames = new List<String>{};
            dispFieldNames.add('ermt__Label_Pick__c');
            String kindRecordType = '種別1: 分類・評価軸設定1';
            Map<String, Object> result = DAM_ProjectRisklistApprovalCtrl.getClassificationsByRiskId(prjs[0].Id, dispFieldNames, kindRecordType, null, null);

            System.assert(!result.isEmpty());
        }
    }

    @isTest static void applyApprovalTest(){
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            List<ermt__Risk__c> risks = [SELECT id FROM ermt__Risk__c];
            ermt__Risk__c riskApplyApproval = risks[0];
            List<String> riskIdApproval = new List<String>();
            riskIdApproval.add(riskApplyApproval.Id);
            DAM_ProjectRisklistApprovalCtrl.ApprovalResult result = DAM_ProjectRisklistApprovalCtrl.applyApproval('please approval',riskIdApproval);
            System.assert(result.isSuccess == true);
        }
    }

    @isTest static void getGroupClassiSelsTest(){
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            List<Map<String,String>> result = DAM_ProjectRisklistApprovalCtrl.getGroupClassiSels(prjs[0].Id, Label.ClassiRecordType_RiskClassiGroup);
            System.assert(result != null);
        }
    }


    @isTest static void saveRisklistDisplayFieldNameTest_1(){
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        Test.startTest();
        System.runAs(usrs[0]) {
            Boolean res = DAM_ProjectRisklistApprovalCtrl.saveRisklistDisplayFieldName(prjs[0].Id, '');
            System.assertEquals(true, res);
        }
        Test.stopTest();
    }

    @isTest static void getApprovalStatusSettingTest_1(){
        ProjectRisklistApprovalStatusSetting__c setting = new ProjectRisklistApprovalStatusSetting__c();
        setting.ApprovalStatusList__c = '1;2;3';
        insert setting;

        List<String> res = DAM_ProjectRisklistApprovalCtrl.getApprovalStatusSetting();
        System.assertEquals(3, res.size());
    }

    @isTest static void getApprovalStatusSettingTest_2(){
        ProjectRisklistApprovalStatusSetting__c setting = new ProjectRisklistApprovalStatusSetting__c();
        setting.ApprovalStatusList__c = null;
        insert setting;

        List<String> res = DAM_ProjectRisklistApprovalCtrl.getApprovalStatusSetting();
        System.assertEquals(0, res.size());
    }

    // @Method: DAM_ProjectRisklistApprovalCtrl.multiApplyApproval()
    // @Case: Happy case
    @isTest static void multiApplyApprovalTest_1(){
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ermt__Risk__c> rsks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        System.runAs(usrs[0]) {
            DAM_ProjectRisklistApprovalCtrl.ApprovalResult result = DAM_ProjectRisklistApprovalCtrl.multiApplyApproval('please approval', new List<String>{rsks[0].Id}, prjs[0].Id);
            System.assertEquals(true, result.isSuccess);
            System.assertEquals(1, result.successCount);
        }
    }

    // @Method: DAM_ProjectRisklistApprovalCtrl.multiApplyApproval()
    // @Case: Invalid riskId
    @isTest static void multiApplyApprovalTest_2(){
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ermt__Risk__c> rsks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        System.runAs(usrs[0]) {
            DAM_ProjectRisklistApprovalCtrl.ApprovalResult result = DAM_ProjectRisklistApprovalCtrl.multiApplyApproval('please approval', new List<String>{rsks[0].Id, 'invalid_risk_id'}, prjs[0].Id);
            System.assertEquals(false, result.isSuccess);
            System.assertEquals(0, result.successCount);
            System.assertEquals(0, result.failCount);
        }
    }

    // @Method: DAM_ProjectRisklistApprovalCtrl.multiApplyApproval()
    // @Case: happy Case with send mail to user
    @isTest static void multiApplyApprovalTest_3(){
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        List<ermt__Risk__c> rsks = (List<ermt__Risk__c>)data.get('ermt__Risk__c');
        System.runAs(usrs[0]) {
            DAM_ProjectRisklistApprovalCtrl.ApprovalResult result = DAM_ProjectRisklistApprovalCtrl.multiApplyApproval('please approval', new List<String>{rsks[0].Id}, prjs[0].Id);
            System.assertEquals(true, result.isSuccess);
            System.assertEquals(1, result.successCount);
            System.assertEquals(0, result.failCount);
        }
    }

    // @Method: DAM_ProjectRisklistApprovalCtrl.recursiveGetUserIds()
    // @Case: Happy Case
    // @Param: userOrGroupIds -> group id
    @isTest static void recursiveGetUserIdsTest_1(){
        Map<String, Object> data = makeData_1();
        List<User> users = (List<User>)data.get('User');
        List<UserRole> userRoles = (List<UserRole>)data.get('UserRole');

        Test.startTest();
        //Create Parent Group
        Group grp = new Group();
        grp.name = 'Test Group1';
        grp.Type = 'Regular';
        Insert grp;

        //Create Group Member
        GroupMember grpMem1 = new GroupMember();
        grpMem1.UserOrGroupId = UserInfo.getUserId();
        grpMem1.GroupId = grp.Id;
        Insert grpMem1;

        //Create Sub group
        Group subGrp  = new Group();
        subGrp.name = 'Test Group2';
        subGrp.Type = 'Regular';
        Insert subGrp;

        //Assign Role To Parent Group
        GroupMember grpMem2 = new GroupMember();
        grpMem2.UserOrGroupId = subGrp.Id;
        grpMem2.GroupId = grp.Id;
        Insert grpMem2;

        //Create Group Map Data
        Map<String,Id> groupNameRoleIdMap = new Map<String,Id>();
        for(Group gp: [SELECT Id, Name FROM Group WHERE Type = 'Role' AND DeveloperName =: userRoles[0].DeveloperName LIMIT 1]){
            groupNameRoleIdMap.put('SuperAdmin', gp.Id);
        }

        //Assign role to parent group
        GroupMember grpMem3 = new GroupMember();
        grpMem3.UserOrGroupId = groupNameRoleIdMap.get('SuperAdmin');
        grpMem3.GroupId = grp.Id;
        Insert grpMem3;

        //Create Group And Sub Group Map Data
        List<Group> userSubRoleGrp = [SELECT Id, Name, DeveloperName, Type, relatedId FROM Group WHERE Type = 'RoleAndSubordinates' AND DeveloperName =: userRoles[0].DeveloperName LIMIT 1];
        Map<String,Id> groupNameRoleAndSubordinatesIdMap = new Map<String,Id>();
        for(Group gp: userSubRoleGrp){
            groupNameRoleAndSubordinatesIdMap.put('Admin', gp.Id);
        }

        // Assign Role To Parent Group
        GroupMember grpMem4 = new GroupMember();
        grpMem4.UserOrGroupId = groupNameRoleAndSubordinatesIdMap.get('Admin');
        grpMem4.GroupId = grp.Id;
        Insert grpMem4;

        // update user
        users[1].UserRoleId = userRoles[0].Id;
        List<UserRole> userSubRole = [SELECT Id, Name FROM UserRole WHERE parentRoleId =: userRoles[0].Id LIMIT 1];
        users[2].UserRoleId = userSubRole[0].Id;
        update users;

        Set<Id> result = DAM_ProjectRisklistApprovalCtrl.recursiveGetUserIds(new Set<Id>{grp.Id});
        System.assertEquals(3, result.size());

        Test.stopTest();
    }
}