// プロジェクトのリスク一覧コントローラのテスト
@isTest
private class DAM_ProjectRisklistCtlrTest {
    // データ作成
    static Map<String, Object> makeData_1() {
        Map<String, Object> ret = new Map<String, Object>();

        // ユーザ
        List<User> usrs = new List<User>();
        for (Integer i = 0; i < 1; i++) {
            User usr = DAM_TestDataFactory.createUser(i + 1);
            usrs.add(usr);
        }
        insert usrs;
        ret.put('User', usrs);

        System.runAs(usrs[0]) {
            // 組織・部門
            List<Account> accs = new List<Account>();
            for (Integer i = 0; i < 1; i++) {
                Account acc = DAM_TestDataFactory.createAccount(i + 1);
                accs.add(acc);
            }
            insert accs;
            ret.put('Account', accs);

            // 分類・評価軸設定（グループ）
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

            // 分類・評価軸設定（選択肢）
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

            // プロジェクト
            List<ermt__Project__c> prjs = new List<ermt__Project__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Project__c prj = DAM_TestDataFactory.createProject(i + 1);
                prjs.add(prj);
            }
            insert prjs;
            ret.put('ermt__Project__c', prjs);

            // プロジェクト分類
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

            // リスク
            List<ermt__Risk__c> rsks = new List<ermt__Risk__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Risk__c rsk = DAM_TestDataFactory.createRisk(i + 1, accs[0]);
                rsk.ermt__Project__c = prjs[0].Id;
                rsks.add(rsk);
            }
            insert rsks;
            ret.put('ermt__Risk__c', rsks);

            // リスクアセスメント
            List<ermt__RiskAssessment__c> rskAsss = new List<ermt__RiskAssessment__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__RiskAssessment__c rskAss = DAM_TestDataFactory.createRiskAssessment(rsks[0]);
                rskAsss.add(rskAss);
            }
            insert rskAsss;
            ret.put('ermt__RiskAssessment__c', rskAsss);

            // リスクアセスメント分類
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

            // 対応策
            List<ermt__Control__c> ctls = new List<ermt__Control__c>();
            for (Integer i = 0; i < 1; i++) {
                ermt__Control__c ctl = DAM_TestDataFactory.createControl(i + 1, accs[0]);
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
        }
        return ret;
    }

    // リスク表示項目名選択リストの取得のテスト
    @isTest static void getRiskDisplayFieldNameSelsTest_1() {
        // リスク表示項目名選択リストの取得
        List<Map<String, Object>> sels = DAM_ProjectRisklistCtlr.getRiskDisplayFieldNameSels();

        // 検証
        System.assert(!sels.isEmpty());
    }

    // リスクアセスメント表示項目名選択リストの取得のテスト
    @isTest static void getRiskAssessmentDisplayFieldNameSelsTest_1() {
        // データ作成
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            // リスクアセスメント表示項目名選択リストの取得
            List<Map<String, Object>> sels = DAM_ProjectRisklistCtlr.getRiskAssessmentDisplayFieldNameSels(prjs[0].Id);

            // 検証
            System.assert(!sels.isEmpty());
        }
    }

    // 対応策表示項目名選択リストの取得のテスト
    @isTest static void getControlDisplayFieldSelsTest_1() {
        // 対応策表示項目名選択リストの取得
        List<Map<String, Object>> sels = DAM_ProjectRisklistCtlr.getControlDisplayFieldNameSels();

        // 検証
        System.assert(!sels.isEmpty());
    }

    // リスク一覧表示項目名の取得のテスト
    @isTest static void getRisklistDisplayFieldNameTest_1() {
        // データ作成
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            // リスク一覧表示項目名の取得
            String fieldName = DAM_ProjectRisklistCtlr.getRisklistDisplayFieldName(prjs[0].Id);

            // 検証
            System.assert(String.isEmpty(fieldName));
        }
    }

    // リスク一覧表示項目名の保存のテスト
    @isTest static void saveRisklistDisplayFieldNameTest_1() {
        // データ作成
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            String fieldName = null;

            // リスク一覧表示項目名の保存
            Boolean result = DAM_ProjectRisklistCtlr.saveRisklistDisplayFieldName(prjs[0].Id, fieldName);

            // 検証
            System.assert(result);
        }
    }

    // リスク項目説明マップの取得のテスト
    @isTest static void getRiskFieldDescByNameTest_1() {
        // 表示項目リスト
        List<String> dispFieldNames = new List<String>{
            'Name', 'ermt__Organization__c', 'ermt__AssessmentStatus__c'
        };

        // リスク項目説明マップの取得
        Map<String, DAM_ProjectRisklistCtlr.FieldDescribe> fieldDescMap = DAM_ProjectRisklistCtlr.getRiskFieldDescByName(
            dispFieldNames
        );

        // 検証
        System.assert(!fieldDescMap.isEmpty());
    }

    // 対応策項目説明マップの取得のテスト
    @isTest static void getControlFieldDescByNameTest_1() {
        // 表示項目リスト
        List<String> dispFieldNames = new List<String>{
            'Name', 'ermt__DescriptionContents__c'
        };

        // 対応策項目説明マップの取得
        Map<String, DAM_ProjectRisklistCtlr.FieldDescribe> fieldDescMap = DAM_ProjectRisklistCtlr.getControlFieldDescByName(
            dispFieldNames
        );

        // 検証
        System.assert(!fieldDescMap.isEmpty());
    }

    // リスクリストの取得のテスト
    @isTest static void getRisksTest_1() {
        // データ作成
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            // 表示項目リスト
            List<String> dispFieldNames = new List<String>{
                'Name', 'ermt__Organization__c', 'ermt__AssessmentStatus__c'
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
            Map<String, Object> result = DAM_ProjectRisklistCtlr.getRisks(
                prjs[0].Id
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

    // 対応策リストマップの取得のテスト
    @isTest static void getControlsByRiskIdTest_1() {
        // データ作成
        Map<String, Object> data = makeData_1();
        List<User> usrs = (List<User>)data.get('User');
        List<ermt__Project__c> prjs = (List<ermt__Project__c>)data.get('ermt__Project__c');
        System.runAs(usrs[0]) {
            // 表示項目リスト
            List<String> dispFieldNames = new List<String>{
                'Name', 'ermt__DescriptionContents__c'
                , 'ermt__ExecutionFrequency__c'
                , 'CreatedById'
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

            // 対応策リストマップの取得
            Map<String, Object> result = DAM_ProjectRisklistCtlr.getControlsByRiskId(
                prjs[0].Id
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
}