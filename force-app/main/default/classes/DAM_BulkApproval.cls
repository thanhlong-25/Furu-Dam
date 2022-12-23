public with sharing class DAM_BulkApproval {
    private static final Integer QUERY_LIMIT = 1000;
    public static final String APPROVE = '承認';
    public static final STRING REJECT = '差し戻し';
    public static final STRING PENDING = '未承認';
    @AuraEnabled
    public static ApprovalAssign__c getApprovalAssignById(String recordId){
        List<ApprovalAssign__c> approvalAssigns = [SELECT ID,
                                                        Name,
                                                        Project__c,
                                                        Organization__c
                                                    FROM ApprovalAssign__c
                                                    WHERE ID =: recordId
                                                    LIMIT 1];
        return !approvalAssigns.isEmpty() ? approvalAssigns[0] : null;
    }

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
        query += 'SELECT Id, Name, Risk_No__c, RecordType.DeveloperName, RecordTypeId, (SELECT Id, Status FROM ProcessInstances WHERE Status = \'Pending\' LIMIT 1)';
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
        query += ' AND Id IN (SELECT TargetObjectId FROM ProcessInstance WHERE Status = \'Pending\')';
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

    @AuraEnabled
    public static void multiApprovalProcess(String action, String comment, List<String> riskIds, String approvalAssignId){
        if(String.isBlank(action)) return;
        if(String.isBlank(approvalAssignId)) return;
        Savepoint sp = Database.setSavepoint();
        try {
            List<ApprovalAssign_Risk_Junc__c> arjs = new List<ApprovalAssign_Risk_Junc__c>();
            for(ApprovalAssign_Risk_Junc__c arj : [SELECT ID, Approval_Status__c
                                                    FROM ApprovalAssign_Risk_Junc__c
                                                    WHERE Risk__c IN : riskIds
                                                    AND ApprovalAssign__c =: approvalAssignId
                                                ])
            {
                arj.Approval_Status__c = action == 'Approve' ? APPROVE : REJECT;
                arjs.add(arj);
            }
            update arjs;

            List<ID> piWorkItemIds = new List<Id>();
            for(ProcessInstanceWorkitem workItem : [SELECT Id
                                                    FROM ProcessInstanceWorkitem p
                                                    WHERE ProcessInstance.TargetObjectId IN :riskIds
                                                    AND ProcessInstance.Status = 'Pending'
                                                ])
            {
                piWorkItemIds.add(workItem.Id);
            }

            // Instantiate the new ProcessWorkitemRequest object and populate it
            List<Approval.ProcessWorkitemRequest> piwRequests = new List<Approval.ProcessWorkitemRequest>();
            for(ID piWorkItemId : piWorkItemIds){
                Approval.ProcessWorkitemRequest piwRequest = new Approval.ProcessWorkitemRequest();
                piwRequest.setComments(comment);
                piwRequest.setAction(action);
                piwRequest.setNextApproverIds(new List<Id>{UserInfo.getUserId()});

                // Use the ID from the newly created item to specify the item to be worked
                piwRequest.setWorkitemId(piWorkItemId);
                piwRequests.add(piwRequest);
            }

            // Submit the request for approval
            List<Approval.ProcessResult> proResult =  Approval.process(piwRequests);
            if(!proResult.isEmpty()) sendApprovalRiskResultMail(approvalAssignId, action);

        } catch (Exception e) {
            Database.rollback(sp);
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static void sendApprovalRiskResultMail(String approvalAssignId, String action) {
        List<ApprovalAssign__c> approvalAssign = [SELECT ID, Project__c, Project__r.Name, Applicant__r.Email, Applicant__r.Name FROM ApprovalAssign__c WHERE Id =: approvalAssignId LIMIT 1];
        if(approvalAssign.isEmpty()) return;

        List<EmailTemplate> emailTemplate;
        if(action == 'Approve'){
            emailTemplate = [SELECT ID, Subject, Body FROM EmailTemplate WHERE DeveloperName = 'EmailTemplate_Risk_Approval' LIMIT 1];
        } else {
            emailTemplate = [SELECT ID, Subject, Body FROM EmailTemplate WHERE DeveloperName = 'EmailTemplate_Risk_Reject' LIMIT 1];
        }

        if(!emailTemplate.isEmpty()){
            List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

            mail.setTemplateId(emailTemplate[0].Id);
            mail.setTargetObjectId(UserInfo.getUserId());
            mail.setTreatTargetObjectAsRecipient(false);
            mail.setToAddresses(new List<String>{approvalAssign[0].Applicant__r.Email});
            mail.setTreatBodiesAsTemplate(true);

            // format Body
            String body = emailTemplate[0].Body;
            String approvalAssignRecordPageUrl = URL.getSalesforceBaseUrl().toExternalForm() + '/' + approvalAssign[0].Id;
            body = body.replace('{!ApprovalAssign__c.Applicant__c}', approvalAssign[0].Applicant__r.Name);
            body = body.replace('{!ApprovalAssign__c.Link}', approvalAssignRecordPageUrl);
            body = body.replace('{!ApprovalAssign__c.ProjectId__c}', approvalAssign[0].Project__c);

            mail.setPlainTextBody(body);
            mails.add(mail);

            if(!mails.isEmpty()) Messaging.sendEmail(mails);
        }
    }
}

