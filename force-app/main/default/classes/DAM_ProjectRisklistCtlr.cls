// プロジェクトのリスク一覧コントローラ
public with sharing class DAM_ProjectRisklistCtlr {
    private static final Integer QURETY_LIMIT = 1000; // クエリーのリミット値

    // リスク表示項目名選択リストの取得
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getRiskDisplayFieldNameSels() {
        List<Map<String, Object>> ret = new List<Map<String, Object>>();
        SObjectType sObjType = ermt__Risk__c.getSObjectType();
        DescribeSObjectResult sObjDesc = sObjType.getDescribe();
        for (SObjectField field : sObjDesc.fields.getMap().values()) {
            DescribeFieldResult fieldDesc = field.getDescribe();
            ret.add(new Map<String, Object>{
                'label' => fieldDesc.getLabel() + ':' + fieldDesc.getName()
                , 'value' => fieldDesc.getName()
            });
        }
        return ret;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getRiskAssessmentDisplayFieldNameSels(
        Id projectId
    ) {
        List<Map<String, Object>> ret = new List<Map<String, Object>>();

        SObjectType classiSObjType = ermt__M_Classification__c.getSObjectType();
        DescribeSObjectResult classiSObjDesc = classiSObjType.getDescribe();
        Map<String, RecordTypeInfo> classiRecTypeInfoByRecTypeDevName = classiSObjDesc.getRecordTypeInfosByDeveloperName();

        Map<String, String> labelByRecTypeDevName = new Map<String, String>();
        for (ermt__Project_Classification_Junc__c pcj : [
            SELECT toLabel(ermt__M_Classification__r.ermt__Label_Pick__c)
            , ermt__M_Classification__r.ermt__Label__c
            , ermt__M_Classification__r.RecordType.DeveloperName
            FROM ermt__Project_Classification_Junc__c
            WHERE ermt__Project__c = :projectId
            AND ermt__M_Classification__r.ermt__invalid__c = false
            ORDER BY ermt__M_Classification__r.ermt__ViewNo__c
        ]) {
            String recTypeDevName = pcj.ermt__M_Classification__r.RecordType.DeveloperName;
            if (!labelByRecTypeDevName.containsKey(recTypeDevName)) {
                String label = pcj.ermt__M_Classification__r.ermt__Label_Pick__c;
                label = (String.isNotEmpty(label) ? label : pcj.ermt__M_Classification__r.ermt__Label__c);
                labelByRecTypeDevName.put(recTypeDevName, label);
            }
        }

        List<String> classiRecTypeDevNames = new List<String>{
            System.Label.ClassiRecordType_AnalyseTiming
            , System.Label.ClassiRecordType_Probability
            , System.Label.ClassiRecordType_ResultImpact
            , System.Label.ClassiRecordType_ThirdEvaluation
        };
        for (String recTypeDevName : classiRecTypeDevNames) {
            String label = labelByRecTypeDevName.get(recTypeDevName);
            if (String.isEmpty(label)) {
                RecordTypeInfo classiRecTypeInfo = classiRecTypeInfoByRecTypeDevName.get(recTypeDevName);
                label = (classiRecTypeInfo == null ? System.Label.Select_NotSet : classiRecTypeInfo.getName());
            }
            ret.add(new Map<String, Object>{
                'label' => label + ':' + recTypeDevName
                , 'value' => recTypeDevName
            });
        }
        SObjectType riskAssSObjType = ermt__RiskAssessment__c.getSObjectType();
        DescribeSObjectResult riskAssSObjDesc = riskAssSObjType.getDescribe();
        for (SObjectField field : riskAssSObjDesc.fields.getMap().values()) {
            DescribeFieldResult fieldDesc = field.getDescribe();
            ret.add(new Map<String, Object>{
                'label' => fieldDesc.getLabel() + ':' + fieldDesc.getName()
                , 'value' => fieldDesc.getName()
            });
        }
        return ret;
    }

    // 対応策表示項目名選択リストの取得
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getControlDisplayFieldNameSels() {
        List<Map<String, Object>> ret = new List<Map<String, Object>>();
        SObjectType sObjType = ermt__Control__c.getSObjectType();
        DescribeSObjectResult sObjDesc = sObjType.getDescribe();
        for (SObjectField field : sObjDesc.fields.getMap().values()) {
            DescribeFieldResult fieldDesc = field.getDescribe();
            ret.add(new Map<String, Object>{
                'label' => fieldDesc.getLabel() + ':' + fieldDesc.getName()
                , 'value' => fieldDesc.getName()
            });
        }
        return ret;
    }

    // リスク一覧表示項目名の取得
    @AuraEnabled
	public static String getRisklistDisplayFieldName(
        Id projectId // プロジェクトID
    ) {
        String ret = null;
        for (ermt__Project__c p : [
            SELECT ermt__RisklistDisplayFieldName__c
            FROM ermt__Project__c
            WHERE Id = :projectId
            LIMIT 1
        ]) {
            ret = p.ermt__RisklistDisplayFieldName__c;
        }
        return ret;
    }

    // リスク一覧表示項目名の保存
    @AuraEnabled
	public static Boolean saveRisklistDisplayFieldName(
        Id projectId // プロジェクトID
        , String fieldName // 項目名
    ) {
        ermt__Project__c prj = new ermt__Project__c(
            Id = projectId
            , ermt__RisklistDisplayFieldName__c = fieldName
        );
        update prj;
        return true;
    }

    // リスク項目説明マップの取得
    @AuraEnabled
	public static Map<String, FieldDescribe> getRiskFieldDescByName(
        List<String> dispFieldNames // 表示項目名リスト
    ) {
        Map<String, FieldDescribe> ret = new Map<String, FieldDescribe>();
        SObjectType sObjType = ermt__Risk__c.getSObjectType();
        for (String fieldName : dispFieldNames) {
            DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(sObjType, fieldName);
            if (fieldDesc != null && fieldDesc.isAccessible()) {
                ret.put(fieldName, new FieldDescribe(
                    fieldName
                    , fieldDesc.getLabel()
                    , String.valueOf(fieldDesc.getType())
                    , fieldDesc.isNillable()
                    , fieldDesc.isUpdateable()
                    , fieldDesc.getInlineHelpText()
                ));
            }
        }
        return ret;
    }

    // 対応策項目説明マップの取得
    @AuraEnabled
	public static Map<String, FieldDescribe> getControlFieldDescByName(
        List<String> dispFieldNames // 表示項目名リスト
    ) {
        Map<String, FieldDescribe> ret = new Map<String, FieldDescribe>();
        SObjectType sObjType = ermt__Control__c.getSObjectType();
        for (String fieldName : dispFieldNames) {
            DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(sObjType, fieldName);
            if (fieldDesc != null && fieldDesc.isAccessible()) {
                ret.put(fieldName, new FieldDescribe(
                    fieldName
                    , fieldDesc.getLabel()
                    , String.valueOf(fieldDesc.getType())
                    , fieldDesc.isNillable()
                    , fieldDesc.isUpdateable()
                    , fieldDesc.getInlineHelpText()
                ));
            }
        }
        return ret;
    }

    // リスクリストの取得
    @AuraEnabled
    public static Map<String, Object> getRisks(
        Id projectId // プロジェクトID
        , List<String> dispFieldNames // リスク項目名リスト
        , List<Map<String, Object>> searchConds // 検索条件リスト
        , String searchCondLogic // 検索条件ロジック
        , Id previousLastId // 前の最終ID
        , Decimal previousLastRiskNo // 前の最終名
    ) {
        // 検索条件式の作成
        String searchCondExp = null;
        if (searchConds != null && !searchConds.isEmpty()) {
            searchCondExp = DAM_RecordSearchConditionCtlr.createSearchConditionExpression(
                'ermt__Risk__c'
                , searchConds
                , searchCondLogic
            );
            if (String.isNotEmpty(searchCondExp)) {
                searchCondExp = ' AND (' + searchCondExp + ')';
            }
        }

        // リスクの取得
        Map<String, String> fieldNameMap = new Map<String, String>();
        SObjectType riskSObjType = ermt__Risk__c.getSObjectType();
        String query = '';
        query += 'SELECT Id, Name, Risk_No__c, RecordType.DeveloperName, RecordTypeId, UserRecordAccess.HasEditAccess';
        fieldNameMap.put('Id', 'Id');
        fieldNameMap.put('Name', 'Name');
        fieldNameMap.put('RecordType.DeveloperName', 'RecordType.DeveloperName');
        fieldNameMap.put('RecordTypeId', 'RecordTypeId');
        fieldNameMap.put('Risk_No__c', 'Risk_No__c');
        for (String fieldName : dispFieldNames) {
            if (fieldName == 'Id' || fieldName == 'Name' || fieldName == 'Risk_No__c'|| fieldName == 'RecordTypeId') {
            } else {
                DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(riskSObjType, fieldName);
                if (fieldDesc.isAccessible()) {
                    String type = String.valueOf(fieldDesc.getType());
                    query += ', ' + fieldName;
                    fieldNameMap.put(fieldName, fieldName);
                    if (
                        type == String.valueOf(Schema.DisplayType.PICKLIST) ||
                        type == String.valueOf(Schema.DisplayType.MULTIPICKLIST)
                    ) {
                        query += ', toLabel(' + fieldName + ') ' + fieldName + '_Label';
                        fieldNameMap.put(fieldName + '_Label', fieldName + '_Label');
                    } else if (
                        type == String.valueOf(Schema.DisplayType.REFERENCE)
                    ) {
                        String fieldName2 = fieldDesc.getRelationshipName() + '.Name';
                        DescribeFieldResult fieldDesc2 = DAM_CommonUtil.getFieldDescribe(riskSObjType, fieldName2);
                        if (fieldDesc2 != null && fieldDesc2.isAccessible()) {
                            query += ', ' + fieldName2;
                            fieldNameMap.put(fieldName2, fieldName + '_Label');
                        }
                    }
                }
            }
        }
        query += ' FROM ermt__Risk__c';
        query += ' WHERE ermt__Project__c = :projectId'; System.debug(query);
        if (String.isNotEmpty(previousLastId) && previousLastRiskNo != null) {
            query += ' AND (Risk_No__c > :previousLastRiskNo';
            query += ' OR (Risk_No__c = :previousLastRiskNo AND Id > :previousLastId))';
        }
        if (String.isNotEmpty(searchCondExp)) {
            query += searchCondExp;
        }
        query += ' ORDER BY Risk_No__c, Id';
        query += ' LIMIT :QURETY_LIMIT';
        List<Map<String, Object>> data = new List<Map<String, Object>>();
        Id lastId = null;
        Decimal lastRiskNo = null;
        Integer cnt = 0;
        for (ermt__Risk__c r : Database.query(query)) {
            if(r.UserRecordAccess.HasEditAccess == true){
                Map<String, Object> rec = new Map<String, Object>();
                for (String fieldName : fieldNameMap.keySet()) {
                    String name = fieldNameMap.get(fieldName);
                    Object value = DAM_CommonUtil.getFieldValue(r, fieldName);
                    rec.put(name, value);
                }
                rec.put('HasEditAccess', r.UserRecordAccess.HasEditAccess);
                data.add(rec);
                lastId = r.Id;
                lastRiskNo = r.Risk_No__c;
                cnt++;
            }

        }
        Boolean isContinue = (cnt >= QURETY_LIMIT);
        return new Map<String, Object>{
            'data' => data
            , 'lastId' => lastId
            , 'lastRiskNo' => lastRiskNo
            , 'isContinue' => isContinue
        };
    }

    // 対応策リストマップの取得
    @AuraEnabled
    public static Map<String, Object> getControlsByRiskId(
        Id projectId // プロジェクトID
        , List<String> dispFieldNames // 表示項目名リスト
        , List<Map<String, Object>> searchConds // 検索条件リスト
        , String searchCondLogic // 検索条件ロジック
        , Id previousLastId // 前の最終ID
        , String previousLastName // 前の最終名
    ) {
        // 検索条件式の作成
        String searchCondExp = null;
        if (searchConds != null && !searchConds.isEmpty()) {
            searchCondExp = DAM_RecordSearchConditionCtlr.createSearchConditionExpression(
                'ermt__Control__c'
                , searchConds
                , searchCondLogic
            );
            if (String.isNotEmpty(searchCondExp)) {
                searchCondExp = ' AND (' + searchCondExp + ')';
            }
        }

        // リスク対応策の取得
        String query = '';
        query += 'SELECT Id, Name, ermt__Risk__c, ermt__Control__c';
        query += ' FROM ermt__Risk_Control_Junc__c';
        query += ' WHERE ermt__Risk__r.ermt__Project__c = :projectId';
        if (String.isNotEmpty(previousLastId) && String.isNotEmpty(previousLastName)) {
            query += ' AND (Name > :previousLastName';
            query += ' OR (Name = :previousLastName AND Id > :previousLastId))';
        }
        query += ' ORDER BY Name, Id';
        query += ' LIMIT :QURETY_LIMIT';
        Map<Id, List<ermt__Risk_Control_Junc__c>> riskCtlsByControlId = new Map<Id, List<ermt__Risk_Control_Junc__c>>();
        Set<Id> controlIdSet = new Set<Id>();
        Id lastId = null;
        String lastName = null;
        Integer cnt = 0;
        for (ermt__Risk_Control_Junc__c rcj : Database.query(query)) {
            List<ermt__Risk_Control_Junc__c> riskCtls = riskCtlsByControlId.get(rcj.ermt__Control__c);
            if (riskCtls == null) {
                riskCtls = new List<ermt__Risk_Control_Junc__c>();
                riskCtlsByControlId.put(rcj.ermt__Control__c, riskCtls);
            }
            riskCtls.add(rcj);
            controlIdSet.add(rcj.ermt__Control__c);
            lastId = rcj.Id;
            lastName = rcj.Name;
            cnt++;
        }
        Boolean isContinue = (cnt >= QURETY_LIMIT);

        // 対応策の取得
        Map<String, String> fieldNameMap = new Map<String, String>();
        SObjectType sObjType = ermt__Control__c.getSObjectType();
        query = '';
        query += 'SELECT Id, (SELECT ermt__Risk__r.ermt__ApprovalStatus__c FROM ermt__Risk_Control__r)';
        fieldNameMap.put('Id', 'Id');
        for (String fieldName : dispFieldNames) {
            if (fieldName == 'Id') {
            } else {
                DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(sObjType, fieldName);
                if (fieldDesc.isAccessible()) {
                    String type = String.valueOf(fieldDesc.getType());
                    query += ', ' + fieldName;
                    fieldNameMap.put(fieldName, fieldName);
                    if (
                        type == String.valueOf(Schema.DisplayType.PICKLIST) ||
                        type == String.valueOf(Schema.DisplayType.MULTIPICKLIST)
                    ) {
                        query += ', toLabel(' + fieldName + ') ' + fieldName + '_Label';
                        fieldNameMap.put(fieldName + '_Label', fieldName + '_Label');
                    } else if (
                        type == String.valueOf(Schema.DisplayType.REFERENCE)
                    ) {
                        String fieldName2 = fieldDesc.getRelationshipName() + '.Name';
                        DescribeFieldResult fieldDesc2 = DAM_CommonUtil.getFieldDescribe(sObjType, fieldName2);
                        if (fieldDesc2 != null && fieldDesc2.isAccessible()) {
                            query += ', ' + fieldName2;
                            fieldNameMap.put(fieldName2, fieldName + '_Label');
                        }
                    }
                }
            }
        }
        query += ' FROM ermt__Control__c';
        query += ' WHERE Id IN :controlIdSet';
        if (String.isNotEmpty(searchCondExp)) {
            query += searchCondExp;
        }
        query += ' ORDER BY Name';
        Map<Id, List<Map<String, Object>>> data = new Map<Id, List<Map<String, Object>>>();
        for (ermt__Control__c c : Database.query(query)) {
            Id controlId = c.Id;
            Map<String, Object> rec = new Map<String, Object>();
            rec.put('RiskControlJuncs', c.ermt__Risk_Control__r);
            for (String fieldName : fieldNameMap.keySet()) {
                String name = fieldNameMap.get(fieldName);
                Object value = DAM_CommonUtil.getFieldValue(c, fieldName);
                rec.put(name, value);
            }
            List<ermt__Risk_Control_Junc__c> riskCtls = riskCtlsByControlId.get(controlId);
            if (riskCtls != null) {
                for (ermt__Risk_Control_Junc__c riskCtl : riskCtls) {
                    Map<String, Object> rec2 = rec.clone();
                    rec2.put('riskControlId', riskCtl.Id);
                    List<Map<String, Object>> recs = data.get(riskCtl.ermt__Risk__c);
                    if (recs == null) {
                        recs = new List<Map<String, Object>>();
                        data.put(riskCtl.ermt__Risk__c, recs);
                    }
                    recs.add(rec2);
                }
            }
        }
        return new Map<String, Object>{
            'data' => data
            , 'lastId' => lastId
            , 'lastName' => lastName
            , 'isContinue' => isContinue
        };
    }

    // 項目説明クラス
    public class FieldDescribe {
        @AuraEnabled public String name; // 項目名
        @AuraEnabled public String label; // 表示ラベル
        @AuraEnabled public String type; // データ型
        @AuraEnabled public Boolean isNillable; // 必須
        @AuraEnabled public Boolean isUpdateable; // 編集可
        @AuraEnabled public String helpText;

        public FieldDescribe(
            String name
            , String label
            , String type
            , Boolean isNillable
            , Boolean isUpdateable
            , String helpText
        ) {
            this.name = name;
            this.label = label;
            this.type = type;
            this.isNillable = isNillable;
            this.isUpdateable = isUpdateable;
            this.helpText = helpText;
        }
    }
}
