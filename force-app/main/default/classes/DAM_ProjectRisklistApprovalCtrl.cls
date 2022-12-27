public with sharing class DAM_ProjectRisklistApprovalCtrl {
    private static final Integer QURETY_LIMIT = 1000;
    private static final String USER_PREFIX_KEY = User.SObjectType.getDescribe().getKeyPrefix();
    private static final String GROUP_PREFIX_KEY = Group.SObjectType.getDescribe().getKeyPrefix();
    private static final String APPROVAL_RISK_REQUEST_SUBJECT_MAIL = 'リスクの承認申請がなされました。';

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
            SELECT RisklistDisplayFieldNameApproval__c
            FROM ermt__Project__c
            WHERE Id = :projectId
            LIMIT 1
        ]) {
            ret = p.RisklistDisplayFieldNameApproval__c;
        }
        return ret;
    }

    @AuraEnabled
	public static ApprovalResult applyApproval(String comment, List<String> riskIds) {
        Savepoint sp = Database.setSavepoint();
        ApprovalResult approvalResult = new ApprovalResult();
        approvalResult.successCount = 0;
        approvalResult.failCount = 0;
        try {
            List<Approval.ProcessSubmitRequest> apps = new List<Approval.ProcessSubmitRequest>();
            for(String riskId: riskIds){
                Approval.ProcessSubmitRequest approvalRequest = new Approval.ProcessSubmitRequest();
                approvalRequest.setObjectId(riskId);
                approvalRequest.setComments(comment);
                apps.add(approvalRequest);
            }
            Approval.ProcessResult [] proResult = Approval.process(apps);
            for (Approval.ProcessResult re: proResult){
                if (re.isSuccess()){
                    approvalResult.successCount += 1;
                } else {
                    approvalResult.failCount += 1;
                }
            }
            approvalResult.isSuccess = true;
            return approvalResult;
        } catch (Exception e) {
            Database.rollback(sp);
            approvalResult.isSuccess = false;
            approvalResult.errorMessage = e.getMessage() + ': ' + e.getLineNumber() + ': ' + e.getCause();
            return approvalResult;
        }
    }

    @AuraEnabled
	public static ApprovalResult multiApplyApproval(String comment, List<String> riskIds, String projectId) {
        Savepoint sp = Database.setSavepoint();
        ApprovalResult approvalResult = new ApprovalResult();
        List<ID> assignedApproverIds = new List<Id>();
        approvalResult.successCount = 0;
        approvalResult.failCount = 0;
        try {
            ApprovalAssign__c approvalAssign = insertApprovalAssign(comment, projectId, riskIds);
            List<Approval.ProcessSubmitRequest> apps = new List<Approval.ProcessSubmitRequest>();
            for(String riskId: riskIds){
                Approval.ProcessSubmitRequest approvalRequest = new Approval.ProcessSubmitRequest();
                approvalRequest.setObjectId(riskId);
                approvalRequest.setComments(comment);
                apps.add(approvalRequest);
            }
            List<Approval.ProcessResult> proResult = Approval.process(apps);
            for (Approval.ProcessResult re: proResult){
                if (re.isSuccess()){
                    approvalResult.successCount += 1;
                    if(AssignedApproverIds.isEmpty()) assignedApproverIds = re.ActorIds;
                } else {
                    approvalResult.failCount += 1;
                }
            }
            approvalResult.isSuccess = true;

            if(approvalResult.successCount > 0){
                approvalAssign.No_Of_Applications__c = approvalResult.successCount;
                approvalAssign.OwnerId = assignedApproverIds[0];
                update approvalAssign;

                List<ermt__Project__c> projects = [SELECT ID, Name, Assigned_Approver_01__c FROM ermt__Project__c WHERE ID =: projectId LIMIT 1];
                if(!projects.isEmpty()) sendApprovalRiskRequestMail(projects[0].Assigned_Approver_01__c, approvalAssign.Id);
            }

            return approvalResult;
        } catch (Exception e) {
            Database.rollback(sp);
            approvalResult.isSuccess = false;
            approvalResult.errorMessage = e.getMessage() + ' : ' + e.getLineNumber();
            return approvalResult;
        }
    }

    @AuraEnabled
	public static Map<String, FieldDescribe> getRiskFieldDescByName(
        List<String> dispFieldNames
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
                ));
            }
        }
        return ret;
    }

    @AuraEnabled
	public static Map<String, FieldDescribe> getRiskAssessmentFieldDescByName(
        Id projectId
        , List<String> dispFieldNames
    ) {
        Map<String, FieldDescribe> ret = new Map<String, FieldDescribe>();

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
        SObjectType riskAssSObjType = ermt__RiskAssessment__c.getSObjectType();
        SObjectType riskAssClsSObjType = ermt__RiskAssessment_Classification_Junc__c.getSObjectType();
        DescribeSObjectResult riskAssClsSObjDesc = riskAssClsSObjType.getDescribe();
        for (String fieldName : dispFieldNames) {
            if (
                fieldName == System.Label.ClassiRecordType_AnalyseTiming ||
                fieldName == System.Label.ClassiRecordType_Probability ||
                fieldName == System.Label.ClassiRecordType_ResultImpact ||
                fieldName == System.Label.ClassiRecordType_ThirdEvaluation
            ) {
                if (riskAssClsSObjDesc.isAccessible()) {
                    String label = labelByRecTypeDevName.get(fieldName);
                    if (String.isEmpty(label)) {
                        RecordTypeInfo classiRecTypeInfo = classiRecTypeInfoByRecTypeDevName.get(fieldName);
                        label = (classiRecTypeInfo == null ? System.Label.Select_NotSet : classiRecTypeInfo.getName());
                    }
                    ret.put(fieldName, new FieldDescribe(
                        fieldName
                        , label
                        , String.valueOf(Schema.DisplayType.PICKLIST)
                        , true
                        , riskAssClsSObjDesc.isCreateable() && riskAssClsSObjDesc.isDeletable()
                    ));
                }
            } else {
                DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(riskAssSObjType, fieldName);
                if (fieldDesc != null && fieldDesc.isAccessible()) {
                    ret.put(fieldName, new FieldDescribe(
                        fieldName
                        , fieldDesc.getLabel()
                        , String.valueOf(fieldDesc.getType())
                        , fieldDesc.isNillable()
                        , fieldDesc.isUpdateable()
                    ));
                }
            }
        }
        return ret;
    }

    @AuraEnabled
	public static Map<String, FieldDescribe> getClassificationFieldDescByName(
        List<String> dispFieldNames
    ) {
        Map<String, FieldDescribe> ret = new Map<String, FieldDescribe>();
        SObjectType sObjType = ermt__M_Classification__c.getSObjectType();
        for (String fieldName : dispFieldNames) {
            DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(sObjType, fieldName);
            if (fieldDesc != null && fieldDesc.isAccessible()) {
                ret.put(fieldName, new FieldDescribe(
                    fieldName
                    , fieldDesc.getLabel()
                    , String.valueOf(fieldDesc.getType())
                    , fieldDesc.isNillable()
                    , fieldDesc.isUpdateable()
                ));
            }
        }
        return ret;
    }

    @AuraEnabled
    public static Map<String, Object> getRisks(
        Id projectId
        , List<String> dispFieldNames
        , Id previousLastId
        , String previousLastName
    ) {
        List<ermt__Risk__c> risks = [SELECT id, ermt__Project__r.ermt__AnalyseTimingDefault__c, ermt__Project__r.ermt__AnalyseTimingDefault__r.RecordType.DeveloperName from ermt__Risk__c k where ermt__Project__c = :projectId];
        List<String> riskIds = new List<String>();
        for (ermt__Risk__c risk: risks){
            riskIds.add(risk.id);
        }
        List<String> mClassificationId = new List<String>();
        for (ermt__Risk__c risk: risks){
            mClassificationId.add(risk.ermt__Project__r.ermt__AnalyseTimingDefault__c);
        }
        List<ermt__RiskAssessment_Classification_Junc__c> riskAss = [select ermt__RiskAssessment__r.ermt__Risk__r.Id from ermt__RiskAssessment_Classification_Junc__c where ermt__M_Classification__c in: mClassificationId and  ermt__RiskAssessment__r.ermt__Risk__r.Id in :riskIds];
        List<String> riskIdFilters = new List<String>();
        for (ermt__RiskAssessment_Classification_Junc__c riskAs: riskAss){
            riskIdFilters.add(riskAs.ermt__RiskAssessment__r.ermt__Risk__r.Id);
        }

        Map<String, String> fieldNameMap = new Map<String, String>();
        SObjectType riskSObjType = ermt__Risk__c.getSObjectType();
        String query = '';
        query += 'SELECT Id, Name, UserRecordAccess.HasEditAccess';
        fieldNameMap.put('Id', 'Id');
        fieldNameMap.put('Name', 'Name');
        for (String fieldName : dispFieldNames) {
            if (fieldName == 'Id' || fieldName == 'Name') {
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
        query += ' WHERE id in :riskIdFilters';
        if (String.isNotEmpty(previousLastId) && String.isNotEmpty(previousLastName)) {
            query += ' AND (Name > :previousLastName';
            query += ' OR (Name = :previousLastName AND Id > :previousLastId))';
        }
        ProjectRisklistApprovalStatusSetting__c setting = ProjectRisklistApprovalStatusSetting__c.getInstance();
        List<String> ops = new List<String>();
        if (setting.ApprovalStatusList__c != '') {
            ops = setting.ApprovalStatusList__c.split(';');
            query += ' AND (ermt__ApprovalStatus__c = \'\' OR ermt__ApprovalStatus__c IN :ops)';
        }
        // List<String> ops = getApprovalStatusSetting();
        // if (ops.size() > 0) query += ' AND (ermt__ApprovalStatus__c = \'\' OR ermt__ApprovalStatus__c IN :ops)';

        query += ' ORDER BY Name, Id';
        query += ' LIMIT :QURETY_LIMIT';
        List<Map<String, Object>> data = new List<Map<String, Object>>();
        Id lastId = null;
        String lastName = null;
        Integer cnt = 0;
        for (ermt__Risk__c r : Database.query(query)) {
            Map<String, Object> rec = new Map<String, Object>();
            for (String fieldName : fieldNameMap.keySet()) {
                String name = fieldNameMap.get(fieldName);
                Object value = DAM_CommonUtil.getFieldValue(r, fieldName);
                rec.put(name, value);
            }
            rec.put('HasEditAccess', r.UserRecordAccess.HasEditAccess);
            data.add(rec);
            lastId = r.Id;
            lastName = r.Name;
            cnt++;
        }
        Boolean isContinue = (cnt >= QURETY_LIMIT);
        return new Map<String, Object>{
            'data' => data
            , 'lastId' => lastId
            , 'lastName' => lastName
            , 'isContinue' => isContinue
        };
    }

    @AuraEnabled
    public static Map<String, Object> getRiskAssessmentsByRiskId(
        Id projectId
        , List<String> dispFieldNames
        , Id previousLastId
        , String previousLastName
    ) {
        List<ermt__Risk__c> risks = [SELECT id, ermt__Project__r.ermt__AnalyseTimingDefault__c, ermt__Project__r.ermt__AnalyseTimingDefault__r.RecordType.DeveloperName from ermt__Risk__c k where ermt__Project__c = :projectId];
        List<String> riskIds = new List<String>();
        for (ermt__Risk__c risk: risks){
            riskIds.add(risk.id);
        }
        List<String> mClassificationId = new List<String>();
        for (ermt__Risk__c risk: risks){
            mClassificationId.add(risk.ermt__Project__r.ermt__AnalyseTimingDefault__c);
        }
        List<ermt__RiskAssessment_Classification_Junc__c> riskAss = [select ermt__RiskAssessment__r.ermt__Risk__r.Id from ermt__RiskAssessment_Classification_Junc__c where ermt__M_Classification__c in: mClassificationId and  ermt__RiskAssessment__r.ermt__Risk__r.Id in :riskIds];
        List<String> riskIdFilters = new List<String>();
        for (ermt__RiskAssessment_Classification_Junc__c riskAs: riskAss){
            riskIdFilters.add(riskAs.ermt__RiskAssessment__r.ermt__Risk__r.Id);
        }

        Map<String, String> fieldNameMap = new Map<String, String>();
        SObjectType riskAssSObjType = ermt__RiskAssessment__c.getSObjectType();
        SObjectType riskAssClsSObjType = ermt__RiskAssessment_Classification_Junc__c.getSObjectType();
        DescribeSObjectResult riskAssClsSObjDesc = riskAssClsSObjType.getDescribe();
        String query = '';
        query += 'SELECT Id, Name, ermt__Risk__c, RecordType.DeveloperName, UserRecordAccess.HasEditAccess';
        fieldNameMap.put('Id', 'Id');
        fieldNameMap.put('Name', 'Name');
        fieldNameMap.put('ermt__Risk__c', 'ermt__Risk__c');
        fieldNameMap.put('RecordType.DeveloperName', 'RecordType.DeveloperName');
        for (String fieldName : dispFieldNames) {
            if (
                fieldName == 'Id' ||
                fieldName == 'Name' ||
                fieldName == 'ermt__Risk__c' ||
                fieldName == 'RecordType.DeveloperName'
            ) {
            } else if (
                fieldName == System.Label.ClassiRecordType_AnalyseTiming ||
                fieldName == System.Label.ClassiRecordType_Probability ||
                fieldName == System.Label.ClassiRecordType_ResultImpact ||
                fieldName == System.Label.ClassiRecordType_ThirdEvaluation
            ) {
                if(riskAssClsSObjDesc.isAccessible()) {
                    fieldNameMap.put(fieldName, fieldName);
                }
            } else {
                DescribeFieldResult fieldDesc = DAM_CommonUtil.getFieldDescribe(riskAssSObjType, fieldName);
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
                        DescribeFieldResult fieldDesc2 = DAM_CommonUtil.getFieldDescribe(riskAssSObjType, fieldName2);
                        if (fieldDesc2 != null && fieldDesc2.isAccessible()) {
                            query += ', ' + fieldName2;
                            fieldNameMap.put(fieldName2, fieldName + '_Label');
                        }
                    }
                }
            }
        }
        query += ', (SELECT ermt__M_Classification__c';
        query += ', ermt__M_Classification__r.ermt__Label__c';
        query += ', toLabel(ermt__M_Classification__r.ermt__Label_Pick__c)';
        query += ', ermt__M_Classification__r.ermt__ViewNo__c';
        query += ', ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName';
        query += ' FROM ermt__RiskAssessment_Classification_Junc__r';
        query += ' WHERE (ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName = \'' +
            System.Label.ClassiRecordType_AnalyseTiming + '\'';
        query += ')';
        query += ' OR (ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName = \'' +
            System.Label.ClassiRecordType_Probability + '\'';
        query += ')';
        query += ' OR (ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName = \'' +
            System.Label.ClassiRecordType_ResultImpact + '\'';
        query += ')';
        query += ' OR (ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName = \'' +
            System.Label.ClassiRecordType_ThirdEvaluation + '\'';
        query += ')';
        query += ' ORDER BY ermt__M_Classification__r.ermt__ViewNo__c';
        query += ')';
        query += ' FROM ermt__RiskAssessment__c';
        query += ' WHERE ermt__Risk__c in : riskIdFilters';
        if (String.isNotEmpty(previousLastId) && String.isNotEmpty(previousLastName)) {
            query += ' AND (Name > :previousLastName';
            query += ' OR (Name = :previousLastName AND Id > :previousLastId))';
        }
        query += ' ORDER BY Name, Id';
        query += ' LIMIT :QURETY_LIMIT';
        //System.debug('query=' + query);
        Map<Id, List<Map<String, Object>>> data = new Map<Id, List<Map<String, Object>>>();
        Id lastId = null;
        String lastName = null;
        Integer cnt = 0;
        for (ermt__RiskAssessment__c ra : Database.query(query)) {
            Id riskId = ra.ermt__Risk__c;
            Map<String, Object> rec = new Map<String, Object>();

            Boolean isTarget = true;
            if (isTarget) {
                for (String fieldName : fieldNameMap.keySet()) {
                    if (
                        fieldName == System.Label.ClassiRecordType_AnalyseTiming ||
                        fieldName == System.Label.ClassiRecordType_Probability ||
                        fieldName == System.Label.ClassiRecordType_ResultImpact ||
                        fieldName == System.Label.ClassiRecordType_ThirdEvaluation
                    ) {
                        ermt__RiskAssessment_Classification_Junc__c riskAssCls = null;
                        for (ermt__RiskAssessment_Classification_Junc__c rac : ra.ermt__RiskAssessment_Classification_Junc__r) {
                            if (rac.ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName == fieldName) {
                                riskAssCls = rac;
                                break;
                            }
                        }
                        String name = fieldName;
                        rec.put(name, (riskAssCls == null ? null : riskAssCls.ermt__M_Classification__c));
                        name = fieldName + '_Label';
                        rec.put(name, (riskAssCls == null ? null : (String.isEmpty(riskAssCls.ermt__M_Classification__r.ermt__Label_Pick__c) ?
                            riskAssCls.ermt__M_Classification__r.ermt__Label__c : riskAssCls.ermt__M_Classification__r.ermt__Label_Pick__c)));
                        name = fieldName + '_ViewNo';
                        rec.put(name, (riskAssCls == null ? null : riskAssCls.ermt__M_Classification__r.ermt__ViewNo__c));
                    } else {
                        String name = fieldNameMap.get(fieldName);
                        Object value = DAM_CommonUtil.getFieldValue(ra, fieldName);
                        rec.put(name, value);
                    }
                }
                rec.put('HasEditAccess', ra.UserRecordAccess.HasEditAccess);
                List<Map<String, Object>> recs = data.get(riskId);
                if (recs == null) {
                    recs = new List<Map<String, Object>>();
                    data.put(riskId, recs);
                }
                recs.add(rec);
            }
            lastId = ra.Id;
            lastName = ra.Name;
            cnt++;
        }
        Boolean isContinue = (cnt >= QURETY_LIMIT);
        return new Map<String, Object>{
            'data' => data
            , 'lastId' => lastId
            , 'lastName' => lastName
            , 'isContinue' => isContinue
        };
    }

    @AuraEnabled
    public static Map<String, Object> getClassificationsByRiskId(
        Id projectId
        , List<String> dispFieldNames
        , String kindRecordType
        , Id previousLastId
        , String previousLastName
    ) {
        List<ermt__Risk__c> risks = [SELECT id, ermt__Project__r.ermt__AnalyseTimingDefault__c, ermt__Project__r.ermt__AnalyseTimingDefault__r.RecordType.DeveloperName from ermt__Risk__c k where ermt__Project__c = :projectId];
        List<String> riskIds = new List<String>();
        for (ermt__Risk__c risk: risks){
            riskIds.add(risk.id);
        }
        List<String> mClassificationId = new List<String>();
        for (ermt__Risk__c risk: risks){
            mClassificationId.add(risk.ermt__Project__r.ermt__AnalyseTimingDefault__c);
        }
        List<ermt__RiskAssessment_Classification_Junc__c> riskAss = [select ermt__RiskAssessment__r.ermt__Risk__r.Id from ermt__RiskAssessment_Classification_Junc__c where ermt__M_Classification__c in: mClassificationId and  ermt__RiskAssessment__r.ermt__Risk__r.Id in :riskIds];
        List<String> riskIdFilters = new List<String>();
        for (ermt__RiskAssessment_Classification_Junc__c riskAs: riskAss){
            riskIdFilters.add(riskAs.ermt__RiskAssessment__r.ermt__Risk__r.Id);
        }
        String key = kindRecordType.split(':').size() > 1? kindRecordType.split(':')[1].trim(): kindRecordType.trim();
        String query = '';
        query += 'SELECT Id, Name, ermt__Risk__c, ermt__M_Classification__c';
        query += ' FROM ermt__Risk_Classification_Junc__c';
        query += ' WHERE ermt__Risk__c in :riskIdFilters and (ermt__M_Classification__r.ermt__ParentMClassification_del__r.Name =:key ';
        query += ' OR ermt__M_Classification__r.ermt__ParentMClassification_del__r.ermt__Label_Pick__c =:key ';
        query += ' OR toLabel(ermt__M_Classification__r.ermt__ParentMClassification_del__r.ermt__Label_Pick__c) =:key';
        query += ' OR ermt__M_Classification__r.ermt__ParentMClassification_del__r.ermt__Label__c =:key )' ;
        if (String.isNotEmpty(previousLastId) && String.isNotEmpty(previousLastName)) {
            query += ' AND (Name > :previousLastName';
            query += ' OR (Name = :previousLastName AND Id > :previousLastId))';
        }
        query += ' ORDER BY Name, Id';
        query += ' LIMIT :QURETY_LIMIT';
        Map<Id, List<ermt__Risk_Classification_Junc__c>> riskClassiByClassiId = new Map<Id, List<ermt__Risk_Classification_Junc__c>>();
        Set<Id> classiIdSet = new Set<Id>();
        Id lastId = null;
        String lastName = null;
        Integer cnt = 0;
        for (ermt__Risk_Classification_Junc__c rcj : Database.query(query)) {
            List<ermt__Risk_Classification_Junc__c> riskClassification = riskClassiByClassiId.get(rcj.ermt__M_Classification__c);
            if (riskClassification == null) {
                riskClassification = new List<ermt__Risk_Classification_Junc__c>();
                riskClassiByClassiId.put(rcj.ermt__M_Classification__c, riskClassification);
            }
            riskClassification.add(rcj);
            classiIdSet.add(rcj.ermt__M_Classification__c);
            lastId = rcj.Id;
            lastName = rcj.Name;
            cnt++;
        }
        Boolean isContinue = (cnt >= QURETY_LIMIT);

        Map<String, String> fieldNameMap = new Map<String, String>();
        SObjectType sObjType = ermt__M_Classification__c.getSObjectType();
        query = '';
        query += 'SELECT Id';
        fieldNameMap.put('Id', 'Id');
        dispFieldNames.add('ermt__Label__c');
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
        query += ' FROM ermt__M_Classification__c';
        query += ' WHERE Id IN :classiIdSet';
        query += ' ORDER BY Name';
        Map<Id, List<Map<String, Object>>> data = new Map<Id, List<Map<String, Object>>>();
        Map<Id, List<Map<String, Object>>> result = new Map<Id, List<Map<String, Object>>>();
        for (ermt__M_Classification__c c : Database.query(query)) {
            Id controlId = c.Id;
            Map<String, Object> rec = new Map<String, Object>();
            Object value = DAM_CommonUtil.getFieldValue(c, 'ermt__Label_Pick__c') != null ? DAM_CommonUtil.getFieldValue(c, 'ermt__Label_Pick__c'):DAM_CommonUtil.getFieldValue(c, 'ermt__Label__c');
            rec.put('ermt__Label_Pick__c', value);
            List<ermt__Risk_Classification_Junc__c> riskClassification = riskClassiByClassiId.get(controlId);
            if (riskClassification != null) {
                for (ermt__Risk_Classification_Junc__c riskCls : riskClassification) {
                    Map<String, Object> rec2 = rec.clone();
                    rec2.put('riskControlId', riskCls.Id);
                    List<Map<String, Object>> recs = data.get(riskCls.ermt__Risk__c);
                    if (recs == null) {
                        recs = new List<Map<String, Object>>();
                        data.put(riskCls.ermt__Risk__c, recs);
                    }
                    recs.add(rec2);
                }

            }
        }
        //add more label picklist in 1 line
        for(Id riskId : data.keySet()){
            List<String> pickVal = new List<String>();
            Object riskClassiId;
            for (Map<String, Object> t: data.get(riskId)){
                pickVal.add(String.valueOf(t.get('ermt__Label_Pick__c')));
                riskClassiId = t.get('riskControlId');
            }
            Map<String, Object> rec = new Map<String, Object>();
            rec.put('ermt__Label_Pick__c', String.join(pickVal, '；'));
            rec.put('riskControlId', riskClassiId);
            List<Map<String, Object>> recs = new List<Map<String, Object>>();
            recs.add(rec);
            result.put(riskId, recs);
        }
        return new Map<String, Object>{
            'data' => result
            , 'lastId' => lastId
            , 'lastName' => lastName
            , 'isContinue' => isContinue
        };
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getGroupClassiSels(Id projectId, String classiGroupRecordTypeName) {
        List<Map<String, String>> ret = new List<Map<String, String>>();
        for (ermt__Project_Classification_Junc__c pcj : [
            SELECT ermt__M_Classification__c
            , toLabel(ermt__M_Classification__r.ermt__Kind__c)
            , toLabel(ermt__M_Classification__r.ermt__Label_Pick__c)
            , ermt__M_Classification__r.ermt__Label__c
            FROM ermt__Project_Classification_Junc__c
            WHERE ermt__Project__c = :projectId
            AND ermt__M_Classification__r.RecordType.DeveloperName = :classiGroupRecordTypeName
            AND ermt__M_Classification__r.ermt__invalid__c = false
            ORDER BY ermt__M_Classification__r.ermt__ViewNo__c
        ]) {
            String label = '';
            if (String.isNotEmpty(pcj.ermt__M_Classification__r.ermt__Kind__c)) {
                label += pcj.ermt__M_Classification__r.ermt__Kind__c;
            }
            if (String.isNotEmpty(pcj.ermt__M_Classification__r.ermt__Label_Pick__c)) {
                label += (String.isEmpty(label) ? '' : ': ');
                label += pcj.ermt__M_Classification__r.ermt__Label_Pick__c;
            } else if (String.isNotEmpty(pcj.ermt__M_Classification__r.ermt__Label__c)) {
                label += (String.isEmpty(label) ? '' : ': ');
                label += pcj.ermt__M_Classification__r.ermt__Label__c;
            }
            label = (String.isEmpty(label) ? System.Label.Select_NotSet : label);
            ret.add(new Map<String, String>{
                'label' => label
                , 'value' => label
            });
        }
        return ret;
    }

    @AuraEnabled
	public static Boolean saveRisklistDisplayFieldName(Id projectId, String fieldName) {
        ermt__Project__c prj = new ermt__Project__c(
            Id = projectId
            , RisklistDisplayFieldNameApproval__c = fieldName
        );
        update prj;
        return true;
    }

    @AuraEnabled
	public static List<String> getApprovalStatusSetting() {
        ProjectRisklistApprovalStatusSetting__c setting = ProjectRisklistApprovalStatusSetting__c.getInstance();
        List<String> approvalStatusList = new List<String>();
        if (setting.ApprovalStatusList__c != null) {
            approvalStatusList = setting.ApprovalStatusList__c.split(';');
        }
        return approvalStatusList;
    }

    private static ApprovalAssign__c insertApprovalAssign(String comment, String projectId, List<String> riskIds){
        Id contextUserId = UserInfo.getUserId();
        List<User> contextUsers = [SELECT ID, Name, AccountNumber__c FROM User WHERE ID =: contextUserId LIMIT 1];
        List<Account> accounts;
        if(!contextUsers.isEmpty()) accounts = [SELECT ID FROM Account WHERE AccountNumber =: contextUsers[0].AccountNumber__c LIMIT 1];

        ApprovalAssign__c appAss = new ApprovalAssign__c(
            Project__c = projectId,
            Organization__c = !accounts.isEmpty() ? accounts[0].Id : null,
            Applicant__c = contextUserId,
            Application_Comment__c = comment,
            Application_Type__c = '一覧'
        );

        insert appAss;
        insertApprovalAssignRiskJuncs(appAss, riskIds);

        return appAss;
    }

    private static void insertApprovalAssignRiskJuncs(ApprovalAssign__c appAss, List<String> riskIds){
        List<ApprovalAssign_Risk_Junc__c> arjs = new List<ApprovalAssign_Risk_Junc__c>();
        for(String riskId : riskIds){
            arjs.add(new ApprovalAssign_Risk_Junc__c(
                Risk__c = riskId,
                ApprovalAssign__c = appAss.Id
            ));
        }
        insert arjs;
    }

    public static void sendApprovalRiskRequestMail(String approvalAssigner, ID approvalAssignId){
        if(String.isBlank(approvalAssigner)) return;
        List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
        List<ApprovalAssign__c> approvalAssign = [SELECT ID,
                                                Name,
                                                Project__r.Name,
                                                Organization__r.Name,
                                                Applicant__r.Name,
                                                Application_Type__c,
                                                Application_Comment__c,
                                                OwnerId
                                            FROM ApprovalAssign__c
                                            WHERE ID =: approvalAssignId
                                            LIMIT 1];
        if(approvalAssign.isEmpty()) return;
        List<EmailTemplate> emailTemplate = [SELECT ID, Subject, Body FROM EmailTemplate WHERE DeveloperName = 'EmailTemplate_Risk_Application' LIMIT 1];

        if(!emailTemplate.isEmpty()){
            // get recipient user email
            Set<Id> recipientUserIds = new Set<Id>();
            if(approvalAssigner.startsWith(GROUP_PREFIX_KEY)) recipientUserIds = recursiveGetUserIds(new Set<Id>{approvalAssigner});
            if(approvalAssigner.startsWith(USER_PREFIX_KEY)) recipientUserIds.add(approvalAssigner);

            if(recipientUserIds.isEmpty()) return;
            List<String> recipientEmails = new List<String>(); //list of emails to sent to
            for(User user : [SELECT ID, Name, Email FROM User WHERE ID IN :recipientUserIds]){
                recipientEmails.add(user.Email);
            }

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setTemplateId(emailTemplate[0].Id);
            mail.setTargetObjectId(UserInfo.getUserId());
            mail.setTreatTargetObjectAsRecipient(false);
            mail.setToAddresses(recipientEmails);
            mail.setTreatBodiesAsTemplate(true);

            // format Body
            String body = emailTemplate[0].Body;
            String approvalAssignRecordPageUrl = URL.getSalesforceBaseUrl().toExternalForm() + '/' + approvalAssign[0].Id;
            body = body.replace('{!ApprovalAssign__c.OwnerId}', approvalAssign[0].OwnerId);
            body = body.replace('{!ApprovalAssign__c.Link}', approvalAssignRecordPageUrl);
            body = body.replace('{!ApprovalAssign__c.ProjectId__c}', approvalAssign[0].Project__c);
            body = body.replace('{!ApprovalAssign__c.Organization__c}', approvalAssign[0].Organization__r.Name);
            body = body.replace('{!ApprovalAssign__c.Applicant__c}', approvalAssign[0].Applicant__r.Name);
            body = body.replace('{!ApprovalAssign__c.Application_Type__c}', approvalAssign[0].Application_Type__c);
            body = body.replace('{!ApprovalAssign__c.Application_Comment__c}', approvalAssign[0].Application_Comment__c);
            mail.setPlainTextBody(body);

            mails.add(mail);
            if(!mails.isEmpty()) Messaging.sendEmail(mails);
        }
    }

    public static Set<Id> recursiveGetUserIds(Set<Id> userOrGroupIds){
        Set<Id> userIds = new Set<Id>();
        Set<Id> groupIds = new Set<Id>();
        List<GroupMember> groupMemberList = [SELECT UserOrGroupId FROM GroupMember WHERE GroupId IN :userOrGroupIds];
        for(GroupMember gm : groupMemberList){
            String userOrGroupId = gm.UserOrGroupId;
            if(userOrGroupId.startsWith(USER_PREFIX_KEY)){
                userIds.add(gm.UserOrGroupId);
            }else{
                groupIds.add(gm.UserOrGroupId);
            }
        }
        if(groupIds.size() > 0){
            Set<Id> groupId = new Set<Id>();
            Set<Id> roleId = new Set<Id>();
            Set<Id> roleAndSubId = new Set<Id>();

            for(Group gp : [SELECT Id, Type, relatedId FROM Group WHERE Id =:groupIds AND (Type = 'Role' OR Type = 'RoleAndSubordinates' OR Type = 'Regular')]){
                if(gp.Type == 'Role'){
                    roleId.add(gp.relatedId);
                }
                else if(gp.Type == 'RoleAndSubordinates'){
                    roleAndSubId.add(gp.relatedId);
                }
                else if(gp.Type == 'Regular'){
                    groupId.add(gp.id);
                }
            }
            if(roleAndSubId.size() > 0){
                roleId.addAll(getAllSubRoleIds(roleAndSubId));
            }
            if(roleId.size() > 0){
                List<user> userList = [SELECT Id FROM User WHERE UserRoleId IN :roleId];
                for(User u: userList){
                    userIds.add(u.id);
                }
            }
            if(groupId.size() > 0){
                userIds.addAll(recursiveGetUserIds(groupId));
            }
        }
        return userIds;
    }

    public static Set<ID> getAllSubRoleIds(Set<Id> roleIds) {
        Set<Id> currentRoleIds = new Set<Id>();
        for(UserRole userRole :[SELECT Id FROM UserRole WHERE ParentRoleId IN :roleIds]){
            currentRoleIds.add(userRole.Id);
        }
        if(currentRoleIds.size() > 0){
            currentRoleIds.addAll(getAllSubRoleIds(currentRoleIds));
        }
        return currentRoleIds;
    }

    public class FieldDescribe {
        @AuraEnabled public String name;
        @AuraEnabled public String label;
        @AuraEnabled public String type;
        @AuraEnabled public Boolean isNillable;
        @AuraEnabled public Boolean isUpdateable;

        public FieldDescribe(
            String name
            , String label
            , String type
            , Boolean isNillable
            , Boolean isUpdateable
        ) {
            this.name = name;
            this.label = label;
            this.type = type;
            this.isNillable = isNillable;
            this.isUpdateable = isUpdateable;
        }
    }

    public class ApprovalResult {
        @AuraEnabled public Integer successCount {get;set;}
        @AuraEnabled public Integer failCount {get;set;}
        @AuraEnabled public Boolean isSuccess {get;set;}
        @AuraEnabled public String errorMessage {get;set;}
    }
}