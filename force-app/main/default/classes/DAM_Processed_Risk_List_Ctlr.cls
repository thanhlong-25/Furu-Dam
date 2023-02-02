public with sharing class DAM_Processed_Risk_List_Ctlr {
    private static final Integer QUERY_LIMIT = 1000;
    // リスクリストの取得
    @AuraEnabled
    public static Map<String, Object> getRisks(
        Id approvalAssignId
        , Id approvalAssignProjectId // プロジェクトID
        , Id approvalAssignOrgId
        , List<String> dispFieldNames // リスク項目名リスト
        , List<Map<String, Object>> searchConds // 検索条件リスト
        , String searchCondLogic // 検索条件ロジック
        , Id previousLastId // 前の最終ID
        , Decimal previousLastRiskNo // 前の最終名
        , String displayType
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
        query += 'SELECT Id, Name, Risk_No__c, RecordType.DeveloperName, RecordTypeId, (SELECT Id, Status FROM ProcessInstances WHERE Status =: displayType LIMIT 1)';
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
        query += ' WHERE ermt__Project__c =: approvalAssignProjectId';
        query += ' AND ermt__Organization__c =: approvalAssignOrgId';
        query += ' AND Id IN (SELECT TargetObjectId FROM ProcessInstance WHERE Status =: displayType)';
        query += ' AND Id IN (SELECT Risk__c FROM ApprovalAssign_Risk_Junc__c WHERE ApprovalAssign__c =: approvalAssignId)';
        if (String.isNotEmpty(previousLastId) && previousLastRiskNo != null) {
            query += ' AND (Risk_No__c > :previousLastRiskNo';
            query += ' OR (Risk_No__c = :previousLastRiskNo AND Id > :previousLastId))';
        }
        if (String.isNotEmpty(searchCondExp)) {
            query += searchCondExp;
        }
        query += ' ORDER BY Risk_No__c, Id';
        query += ' LIMIT :QUERY_LIMIT';
        List<Map<String, Object>> data = new List<Map<String, Object>>();
        Id lastId = null;
        Decimal lastRiskNo = null;
        Integer cnt = 0;
        for (ermt__Risk__c r : Database.query(query)) {
            Map<String, Object> rec = new Map<String, Object>();
            for (String fieldName : fieldNameMap.keySet()) {
                String name = fieldNameMap.get(fieldName);
                Object value = DAM_CommonUtil.getFieldValue(r, fieldName);
                rec.put(name, value);
            }
            data.add(rec);
            lastId = r.Id;
            lastRiskNo = r.Risk_No__c;
            cnt++;
        }
        Boolean isContinue = (cnt >= QUERY_LIMIT);
        return new Map<String, Object>{
            'data' => data
            , 'lastId' => lastId
            , 'lastRiskNo' => lastRiskNo
            , 'isContinue' => isContinue
        };
    }
}
