public with sharing class RiskTriggerContextCtrl {
    public static RiskAssessmentConfiguration__mdt riskAssessmentConfig {
        get {
            if ( riskAssessmentConfig == null ) {
                 riskAssessmentConfig = getRiskAssessmentConfiguration(); 
            }
            return riskAssessmentConfig;
        } set; 
    }
    public static List<RestrictTriggerRiskExBaseUserId__mdt> restrictUserIdMdtConfiguration {
        get {
            if ( restrictUserIdMdtConfiguration == null ) {
                 restrictUserIdMdtConfiguration = getRestrictTriggerRiskExBaseUserIdConfiguration(); 
            }
            return restrictUserIdMdtConfiguration;
        } set; 
    }
    
   
    /**
     * @description :call handle trigger using System.TriggerOperation
     * @method : onDispatchTrigger
     * @param triggerEvent: containsKey  [AFTER_INSERT , AFTER_UPDATE]
     * @param newMap: Trigger new map
     * @param oldMap : Trigger old map
     */
    public void onDispatchTrigger(
        System.TriggerOperation triggerEvent,
        Map<Id, ermt__Risk__c> newMap,
        Map<Id, ermt__Risk__c> oldMap
    ) {
        Savepoint sp = Database.setSavepoint();
        try {
            List<String> lUserIdRestrict = innerRiskTriggerHelper.lSObjectsFieldValue(restrictUserIdMdtConfiguration, 'UserId__c');
            if(lUserIdRestrict.contains(UserInfo.getUserId())) {
                return;
            }
            this.lNewRiskAssessmentClassificationJ = new List<SObject>();
            this.lNewRiskAssessment                = new List<ermt__RiskAssessment__c>();
            this.lRecordTypeClassification         = innerQueryRiskTriggerHelper.getRecordType(NAME_SOBJECT_CLASSIFICATION);
            this.mClassificationRecordType         = innerRiskTriggerHelper.mGroupFieldValue(
                this.lRecordTypeClassification,
                'DeveloperName',
                'Id'
            );
            this.triggerEventAction = triggerEvent;
            this.mNewRecordTrigger  = newMap;
            this.mOldRecordTrigger  = oldMap;
            switch on triggerEvent {
                when AFTER_INSERT {
                    Map<String, String> mGroupClassificationMDT = innerRiskTriggerHelper.mClassificationMDT(riskAssessmentConfig);
                    this.mGroupMDTClassificationId = innerRiskTriggerHelper.mFilterClassificationMDT(
                        mGroupClassificationMDT,
                        innerQueryRiskTriggerHelper.getClassificationInListId(mGroupClassificationMDT.values())
                    );
                    this.onInsertTriggerEvent();
                }
                when AFTER_UPDATE {
                    this.lDeleteRiskAssessmentClassificationJ = new List<SObject>();
                    this.onEventTriggerUpdate();
                }
            }
        } catch (DispatchTriggerException e) {
            System.debug(e);
            Database.rollback(sp);
            throw e;
        }
    }

    /**
     * @method : onEventTriggerUpdate
     * @description :Trigger event AFTER_INSERT
     * @rule [
     *     step 1: create 2 risk assessment flow each record risk
     *             insert (risk_assessment_1, risk_assessment_2)
     *     step 2: create risk_assessment_classification_juncs
     *            - risk_assessment_1 (Risk field Inherit_Likelihood__c,Inherit_Consequence__c.
     *                                 Custom metadata field Inherit_classification_id__c
     *                                 )
     *            - risk_assessment_2 (Risk field Residual_Likelihood__c, Residual_Consequence__c
     *                                 Custom metadata field Residual_classification_id__c
     *                                 )
     * ]
     */

    private void onInsertTriggerEvent() {

        List<ermt__Risk__c> lRecordNewRisk = this.mNewRecordTrigger.values();
        Map<String, Map<String, SObject>> mRiskRelAssessment = this.mBuildRiskRelAssessmentInsert(lRecordNewRisk);

        insert this.lNewRiskAssessment;
        //Group Field ermt__Project__c list record risk by key ermt__Project__c
        Map<String, List<SObject>> mProjectGroupRelRiskL = innerRiskTriggerHelper.mGroupFilterListRecord(
            lRecordNewRisk,
            'ermt__Project__c'
        );

        //Get ermt__Project_Classification_Junc__c by  projectId
        List<ermt__Project_Classification_Junc__c> lProjectClassificationJ = innerQueryRiskTriggerHelper.getProjectClassificationJ(
            mProjectGroupRelRiskL.keySet()
        );
        //Group Field ermt__Project__c after query lProjectClassificationJ
        Map<String, List<SObject>> mProjectGroupRClassificationJ = innerRiskTriggerHelper.mGroupFilterListRecord(
            lProjectClassificationJ,
            'ermt__Project__c'
        );
        // build record risk_assessment_classifition_juncs by field custom meta data
        this.buildRiskAssClassificationJByMDT(lRecordNewRisk, mRiskRelAssessment);
        // build record risk_assessment_classifition_juncs by record risk field
        this.buildRiskAssClassificationJByFieldRisk(mProjectGroupRelRiskL, mProjectGroupRClassificationJ, mRiskRelAssessment);

        insert this.lNewRiskAssessmentClassificationJ;
    }

    /**
     * @method : onEventTriggerUpdate
     * @description :Trigger event AFTER_UPDATE
     * @rule [
     *     step 1: get record risk_assessment (risk_assessment_1, risk_assessment_2) flow each record risk
     *     step 2: create risk_assessment_classification_juncs if record update field change contains
     *            - risk_assessment_1 (Risk field Inherit_Likelihood__c,Inherit_Consequence__c).
     *            - risk_assessment_2 (Risk field Residual_Likelihood__c, Residual_Consequence__c )
     *     step 3: delete record risk_assessment_classification create before by field risk .
     * ]
     */
    private void onEventTriggerUpdate() {

        List<ermt__Risk__c> lRecordNewRisk = this.mNewRecordTrigger.values();
        //Group Field ermt__Project__c list record risk by key ermt__Project__c
        Map<String, List<SObject>> mProjectGroupRelRiskL = innerRiskTriggerHelper.mGroupFilterListRecord(
            lRecordNewRisk,
            'ermt__Project__c'
        );
        //Get ermt__Project_Classification_Junc__c by  projectId
        List<ermt__Project_Classification_Junc__c> lProjectClassificationJ = innerQueryRiskTriggerHelper.getProjectClassificationJ(
            mProjectGroupRelRiskL.keySet()
        );
        //Group Field ermt__Project__c after query lProjectClassificationJ
        Map<String, List<SObject>> mProjectGroupRClassificationJ = innerRiskTriggerHelper.mGroupFilterListRecord(
            lProjectClassificationJ,
            'ermt__Project__c'
        );
        //Get record risk_assessment_classifition_juncs
        Map<String, Map<String, SObject>> mRiskRelAssessment = this.mGroupRiskRelAssessmentUpdate();
        this.buildRiskAssClassificationJByFieldRisk(mProjectGroupRelRiskL, mProjectGroupRClassificationJ, mRiskRelAssessment);
        insert this.lNewRiskAssessmentClassificationJ;
        delete this.lDeleteRiskAssessmentClassificationJ;
    }

    private void buildRiskAssClassificationJByMDT(
        List<ermt__Risk__c> listNewRisk,
        Map<String, Map<String, SObject>> mRiskRelAssessment
    ) {
        List<String> lRiskAssessmentGName = this.lRiskRelAssessmentGroupName();
        String fieldName;
        for (ermt__Risk__c recordRisk : listNewRisk) {
            fieldName = recordRisk.Id;
            if (mRiskRelAssessment.containsKey(fieldName) == false) {
                continue;
            }
            for (Integer i = 0; i < lRiskAssessmentGName.size(); i++) {
                String fieldGroupName = lRiskAssessmentGName[i];
                Map<String, SObject> mRiskAssessmentByIdRisk = mRiskRelAssessment.get(fieldName);
                if (
                    mRiskAssessmentByIdRisk.get(fieldGroupName) == null ||
                    this.mGroupMDTClassificationId.get(fieldGroupName) == null
                ) {
                    continue;
                }
                String classificationId = this.mGroupMDTClassificationId.get(fieldGroupName);
                String riskAssessmentId = (String) mRiskAssessmentByIdRisk.get(fieldGroupName).get('Id');
                this.addRecordRiskAssessmentClassificationJ(
                    innerQueryRiskTriggerHelper.onNewRiskAssessmentJuns(riskAssessmentId, classificationId)
                );
            }
        }
    }

    private void buildRiskAssClassificationJByFieldRisk(
        Map<String, List<SObject>> mProjectGroupRelRiskL,
        Map<String, List<SObject>> mProjectGroupRClassificationJ,
        Map<String, Map<String, SObject>> mRiskRelAssessment
    ) {
        // Group project values set<String> ClassificationId
        Map<String, Set<String>> mProjectGroupClassification = innerRiskTriggerHelper.mProjectGroupClassification(
            mProjectGroupRelRiskL,
            mProjectGroupRClassificationJ
        );
        Set<String> sGroupClassifcationId = innerRiskTriggerHelper.covertFlattenListSet(mProjectGroupClassification.values());
        // get  ermt__M_Classification__c and child relation ermt__MClassifications_del__r lookup field parentId
        List<ermt__M_Classification__c> listClassification = innerQueryRiskTriggerHelper.getMClassification(
            sGroupClassifcationId
        );
        // group map id and values list classifition
        Map<String, List<SObject>> mGroupClassificationId = innerRiskTriggerHelper.mGroupFilterListRecord(
            listClassification,
            'Id'
        );
        switch on this.triggerEventAction {
            when AFTER_INSERT {
                for (String pId : mProjectGroupRelRiskL.keySet()) {
                    if (mProjectGroupClassification.containsKey(pId) == false) {
                        continue;
                    }
                    Map<String, List<SObject>> mRTypeNameClassificationGroupRel = innerRiskTriggerHelper.mRTypeNameClassificationGroupRel(
                        mProjectGroupClassification.get(pId),
                        mGroupClassificationId
                    );
                    List<SObject> listRisk = mProjectGroupRelRiskL.get(pId);

                    for (SObject recordRisk : listRisk) {
                        this.buildRiskAssClassificationJInsert(recordRisk, mRTypeNameClassificationGroupRel, mRiskRelAssessment);
                    }
                }
            }
            when AFTER_UPDATE {
                for (String pId : mProjectGroupRelRiskL.keySet()) {
                    List<SObject> listRisk = mProjectGroupRelRiskL.get(pId);
                    Map<String, List<SObject>> mRTypeNameClassificationGroupRel = new Map<String, List<SObject>>();
                    if (mProjectGroupClassification.containsKey(pId)) {
                        mRTypeNameClassificationGroupRel = innerRiskTriggerHelper.mRTypeNameClassificationGroupRel(
                            mProjectGroupClassification.get(pId),
                            mGroupClassificationId
                        );
                       
                    } else {
                        mRTypeNameClassificationGroupRel = innerRiskTriggerHelper.mRTypeNameClassificationGroupRel(
                            new Set<String>(),
                            mGroupClassificationId
                        );
                    }

                    for (SObject recordRisk : listRisk) {
                        this.buildRiskAssClassificationJUpdate(recordRisk, mRTypeNameClassificationGroupRel, mRiskRelAssessment);
                    }
                }
            }
        }
    }

    private Map<String, Map<String, SObject>> mBuildRiskRelAssessmentInsert(List<ermt__Risk__c> lRecordNewRisk) {
        Map<String, Map<String, SObject>> mBuildRiskRelAssessmentInsert = new Map<String, Map<String, SObject>>();
        List<String> lRiskAssessmentGName = this.lRiskRelAssessmentGroupName();
        String fieldName;
        for (ermt__Risk__c recordRisk : lRecordNewRisk) {
            fieldName = (String) recordRisk.Id;
            for (Integer i = 0; i < lRiskAssessmentGName.size(); i++) {
                ermt__RiskAssessment__c factoryRiskAssessment = new ermt__RiskAssessment__c(ermt__Risk__c = recordRisk.Id);
                this.lNewRiskAssessment.add(factoryRiskAssessment);
                if (mBuildRiskRelAssessmentInsert.containsKey(fieldName) == false) {
                    mBuildRiskRelAssessmentInsert.put(fieldName, new Map<String, SObject>());
                }
                mBuildRiskRelAssessmentInsert.get(fieldName).put(lRiskAssessmentGName[i], factoryRiskAssessment);
            }
        }
        return mBuildRiskRelAssessmentInsert;
    }

    private void buildRiskAssClassificationJUpdate(
        SObject recordRisk,
        Map<String, List<SObject>> mRTypeNameClassificationGroupRel,
        Map<String, Map<String, SObject>> mRiskRelAssessment
    ) {
        Map<String, Map<String, String>> mapGroupDeveloperName = innerRiskTriggerHelper.mFieldRiskRelAssessmentJClassification();

        Map<String, SObject> mRiskAssessmentByIdRisk = mRiskRelAssessment.get((String) recordRisk.Id);
        SObject recordOldRisk = this.mOldRecordTrigger.get(recordRisk.id);

        //get risk field update values
        Set<String> sFieldsUpdate = innerRiskTriggerHelper.getChangedFields(
            recordRisk,
            recordOldRisk,
            new Set<String>{
                NAME_FIELD_INHERIT_LIKELIHOOD,
                NAME_FIELD_INHERIT_CONSEQUENCE,
                NAME_FIELD_RESIDUAL_LIKELIHOOD,
                NAME_FIELD_RESIDUAL_CONSEQUENCE,
                NAME_FIELD_REL_PROJECT
            }
        );

        for (String groupName : mapGroupDeveloperName.keySet()) {
            if (mRiskAssessmentByIdRisk.get(groupName) == null) {
                continue;
            }

            SObject riskAssessment = mRiskAssessmentByIdRisk.get(groupName);
            Map<String, String> mapRiskFieldGroup = mapGroupDeveloperName.get(groupName);
            Map<String, List<SObject>> riskAssessmentJCurrent = innerRiskTriggerHelper.mGroupFilterListRecord(
                innerRiskTriggerHelper.lSObjectChildRelName(riskAssessment, 'ermt__RiskAssessment_Classification_Junc__r'),
                'ermt__M_Classification__c'
            );
            if (sFieldsUpdate.contains(NAME_FIELD_REL_PROJECT)) {
                List<SObject> riskAssessmentJChange = innerRiskTriggerHelper.getFlattenListSObject(
                    riskAssessmentJCurrent.values()
                );
                this.lDeleteRiskAssessmentClassificationJ.addAll(riskAssessmentJChange);
            }
            for (String classificationDName : mapRiskFieldGroup.keySet()) {
                String fieldName = mapRiskFieldGroup.get(classificationDName);

                if (sFieldsUpdate.contains(fieldName) == false) {
                    continue;
                }

                if (mRTypeNameClassificationGroupRel.containsKey(classificationDName)) {
                    Map<String, Object> mClassificationGroupViewNo = innerRiskTriggerHelper.mGroupFieldValue(
                        mRTypeNameClassificationGroupRel.get(classificationDName),
                        'ermt__ViewNo__c',
                        'Id'
                    );
                    String classificationId = (String) mClassificationGroupViewNo.get(
                        innerRiskTriggerHelper.getClassificationFieldViewNo(recordRisk, fieldName)
                    );

                    this.addRecordRiskAssessmentClassificationJ(
                        innerQueryRiskTriggerHelper.onNewRiskAssessmentJuns((String) riskAssessment.Id, classificationId)
                    );

                    String classificationIdCurrent = (String) mClassificationGroupViewNo.get(
                        innerRiskTriggerHelper.getClassificationFieldViewNo(recordOldRisk, fieldName)
                    );

                    if (classificationIdCurrent != null && riskAssessmentJCurrent.get(classificationIdCurrent) != null) {
                        this.lDeleteRiskAssessmentClassificationJ.addAll(riskAssessmentJCurrent.get(classificationIdCurrent));
                    }
                }
            }
        }
    }

    private void buildRiskAssClassificationJInsert(
        SObject recordRisk,
        Map<String, List<SObject>> mRTypeNameClassificationGroupRel,
        Map<String, Map<String, SObject>> mRiskRelAssessment
    ) {
        Map<String, Map<String, String>> mapGroupDeveloperName = innerRiskTriggerHelper.mFieldRiskRelAssessmentJClassification();
        Map<String, SObject> mRiskAssessmentByIdRisk = mRiskRelAssessment.get((String) recordRisk.Id);

        for (String groupName : mapGroupDeveloperName.keySet()) {
            if (mRiskAssessmentByIdRisk.get(groupName) == null) {
                continue;
            }
            SObject riskAssessment = mRiskAssessmentByIdRisk.get(groupName);
            Map<String, String> mapRiskFieldGroup = mapGroupDeveloperName.get(groupName);
            for (String classificationDName : mapRiskFieldGroup.keySet()) {
                Map<String, Object> mClassificationGroupViewNo = innerRiskTriggerHelper.mGroupFieldValue(
                    mRTypeNameClassificationGroupRel.get(classificationDName),
                    'ermt__ViewNo__c',
                    'Id'
                );
                String fieldName = mapRiskFieldGroup.get(classificationDName);

                String classificationId = (String) mClassificationGroupViewNo.get(
                    innerRiskTriggerHelper.getClassificationFieldViewNo(recordRisk, fieldName)
                );
                this.addRecordRiskAssessmentClassificationJ(
                    innerQueryRiskTriggerHelper.onNewRiskAssessmentJuns((String) riskAssessment.Id, classificationId)
                );
            }
        }
    }

    private Map<String, Map<String, SObject>> mGroupRiskRelAssessmentUpdate() {
        //Get record risk before update
        List<ermt__Risk__c> lRiskOld = this.mOldRecordTrigger.values();
        //Group Field ermt__Project__c list record risk by key ermt__Project__c
        Map<String, List<SObject>> mProjectGroupRelRiskL = innerRiskTriggerHelper.mGroupFilterListRecord(
            lRiskOld,
            'ermt__Project__c'
        );
        //Get ermt__Project_Classification_Junc__c by  projectId
        List<ermt__Project_Classification_Junc__c> lProjectClassificationJ = innerQueryRiskTriggerHelper.getProjectClassificationJ(
            mProjectGroupRelRiskL.keySet()
        );
        //Group Field ermt__Project__c after query lProjectClassificationJ
        Map<String, List<SObject>> mProjectGroupRClassificationJ = innerRiskTriggerHelper.mGroupFilterListRecord(
            lProjectClassificationJ,
            'ermt__Project__c'
        );
        // build record risk_assessment_classifition_juncs by field custom meta data
        Map<String, Map<String, SObject>> mRiskRelAssessment = this.mRiskGroupAssessmentJUpdate(
            mProjectGroupRelRiskL,
            mProjectGroupRClassificationJ
        );
        return mRiskRelAssessment;
    }

    private Map<String, Map<String, SObject>> mRiskGroupAssessmentJUpdate(
        Map<String, List<SObject>> mProjectGroupRelRiskL,
        Map<String, List<SObject>> mProjectGroupRClassificationJ
    ) {
        Map<String, Map<String, SObject>> mRiskRelAssessment = new Map<String, Map<String, SObject>>();
        // Group Project Group ClassificationId
        Map<String, Set<String>> mProjectGroupClassification = innerRiskTriggerHelper.mProjectGroupClassification(
            mProjectGroupRelRiskL,
            mProjectGroupRClassificationJ
        );
        // Convert List<Set<String>> to Set<String>
        Set<String> sGroupClassifcationId = innerRiskTriggerHelper.covertFlattenListSet(mProjectGroupClassification.values());
        // Group map key classificationId values child relation ermt__MClassifications_del__r lookup field parentId
        Map<String, List<SObject>> mapMClassificationList = innerRiskTriggerHelper.mSObjectChildRelName(
            innerQueryRiskTriggerHelper.getMClassification(sGroupClassifcationId),
            'Id',
            'ermt__MClassifications_del__r'
        );
        // Group map key Id record child relationship and values sobjects
        Map<String, List<SObject>> mapMClassificationRelName = innerRiskTriggerHelper.mGroupFilterListRecord(
            innerRiskTriggerHelper.getFlattenListSObject(mapMClassificationList.values()),
            'Id'
        );
        // Get list record risk assessment by id record trigger
        List<ermt__RiskAssessment__c> lRiskAssessment = innerQueryRiskTriggerHelper.getRiskAssessmentWithRelRiskId(
            innerRiskTriggerHelper.convertSetIdToListString(this.mOldRecordTrigger.keySet()),
            mapMClassificationRelName.keySet()
        );

        // Group map key ermt__Risk__c risk assessment values list ermt__Risk__c
        Map<String, List<SObject>> mRiskGroupRelAssessment = innerRiskTriggerHelper.mGroupFilterListRecord(
            lRiskAssessment,
            'ermt__Risk__c'
        );
        // Get define list group name risk assessment
        List<String> lRiskRelAssessmentGroupName = this.lRiskRelAssessmentGroupName();
        for (String recordRiskId : mRiskGroupRelAssessment.keySet()) {
            if (mRiskGroupRelAssessment == null || mRiskGroupRelAssessment.get(recordRiskId) == null) {
                continue;
            }
            List<SObject> lRiskAssessmentGroup = mRiskGroupRelAssessment.get(recordRiskId);
            Integer indexStart = lRiskAssessmentGroup.size();
            for (Integer i = 0; i < lRiskRelAssessmentGroupName.size(); i++) {
                if (indexStart - 1 < i) {
                    continue;
                }
                if (mRiskRelAssessment.containsKey(recordRiskId) == false) {
                    mRiskRelAssessment.put(recordRiskId, new Map<String, SObject>());
                }
                SObject riskAssessment = mRiskGroupRelAssessment.get(recordRiskId).get(i);

                mRiskRelAssessment.get(recordRiskId).put(lRiskRelAssessmentGroupName[i], riskAssessment);
            }
        }

        return mRiskRelAssessment;
    }

    private List<String> lRiskRelAssessmentGroupName() {
        return new List<String>{ NAME_FIELD_INHERIT_GROUP, NAME_FIELD_RESIDUAL_GROUP };
    }

    private void addRecordRiskAssessmentClassificationJ(ermt__RiskAssessment_Classification_Junc__c recordNew) {
        if (recordNew == null) {
            return;
        }
        this.lNewRiskAssessmentClassificationJ.add(recordNew);
    }

    private static List<RestrictTriggerRiskExBaseUserId__mdt> getRestrictTriggerRiskExBaseUserIdConfiguration(){
        String sQuery = 'SELECT UserId__c FROM RestrictTriggerRiskExBaseUserId__mdt WHERE IsActive__c = TRUE ';
        return Database.query(sQuery);
    }

     private static RiskAssessmentConfiguration__mdt getRiskAssessmentConfiguration(){
        List<RiskAssessmentConfiguration__mdt> sQuery = [
            SELECT
                Inherit_classification_id__c,
                Residual_classification_id__c
            FROM
                RiskAssessmentConfiguration__mdt
            WHERE
                DeveloperName = 'Default'
                AND IsActive__c = TRUE
        ];
        return sQuery.isEmpty() ? null : sQuery[0];
    }

    private System.TriggerOperation triggerEventAction;
    private RiskTriggerHelper innerRiskTriggerHelper           = new RiskTriggerHelper();
    private QueryRiskTriggerHelper innerQueryRiskTriggerHelper = new QueryRiskTriggerHelper();
    private Map<Id, ermt__Risk__c> mNewRecordTrigger;
    private Map<Id, ermt__Risk__c> mOldRecordTrigger;
    private List<ermt__RiskAssessment__c> lNewRiskAssessment;
    private Map<String, Object> mRestrictTriggerRiskExBaseUserId ;
    private List<RecordType> lRecordTypeClassification;
    private List<SObject> lNewRiskAssessmentClassificationJ;
    private List<SObject> lDeleteRiskAssessmentClassificationJ;
    private Map<String, Object> mClassificationRecordType;
    private Map<String, String> mGroupMDTClassificationId;
    private static final String NAME_FIELD_INHERIT_GROUP        = 'INHERIT_GROUP';
    private static final String NAME_FIELD_RESIDUAL_GROUP       = 'RESIDUAL_GROUP';
    private static final String NAME_SOBJECT_CLASSIFICATION     = 'ermt__M_Classification__c';
    private static final String NAME_LIKELIHOOD_GROUP           = 'LikelihoodGroup';
    private static final String NAME_CONSEQUENCE_GROUP          = 'ConsequenceGroup';
    private static final String NAME_EVALUATION_PERIOD_GROUP    = 'EvaluationPeriodGroup';
    private static final String NAME_FIELD_INHERIT_LIKELIHOOD   = 'Inherit_Likelihood__c';
    private static final String NAME_FIELD_INHERIT_CONSEQUENCE  = 'Inherit_Consequence__c';
    private static final String NAME_FIELD_RESIDUAL_LIKELIHOOD  = 'Residual_Likelihood__c';
    private static final String NAME_FIELD_RESIDUAL_CONSEQUENCE = 'Residual_Consequence__c';
    private static final String NAME_FIELD_REL_PROJECT          = 'ermt__Project__c';

    private with sharing class QueryRiskTriggerHelper {
        private ermt__RiskAssessment_Classification_Junc__c onNewRiskAssessmentJuns(
            String riskAssessmentId,
            String classificationId
        ) {
            if (String.isBlank(riskAssessmentId) || String.isBlank(classificationId)) {
                return null;
            }
            return new ermt__RiskAssessment_Classification_Junc__c(
                ermt__M_Classification__c = (Id) classificationId,
                ermt__RiskAssessment__c = (Id) riskAssessmentId
            );
        }

        /**
         * @description query ermt__M_Classification__c condition list id
         * @param listIdClassification List Id ermt__M_Classification__c
         * @return List<ermt__M_Classification__c>
         */
        private List<ermt__M_Classification__c> getClassificationInListId(List<String> listIdClassification) {
            if (listIdClassification.isEmpty()) {
                return new List<ermt__M_Classification__c>();
            }
            List<String> lRDeveloperName = new List<String>{ NAME_EVALUATION_PERIOD_GROUP };
            String sQuery = '';
            sQuery += 'SELECT Id, Name, ermt__ViewNo__c, RecordTypeId';
            sQuery += '  FROM ermt__M_Classification__c';
            sQuery += '  WHERE Id IN :listIdClassification';
            sQuery += '  AND  ermt__ParentMClassification_del__r.RecordType.DeveloperName IN : lRDeveloperName ';
            return Database.query(sQuery);
        }

        public List<RecordType> getRecordType(String sobjectType) {
            String sQuery = 'SELECT Id, DeveloperName FROM RecordType';

            if (String.isNotBlank(sobjectType)) {
                sQuery += ' WHERE SobjectType  = :sobjectType';
            }

            List<RecordType> getRecordType = Database.query(sQuery);
            return getRecordType;
        }

        private List<ermt__M_Classification__c> getMClassification(Set<String> setClassificationId) {
            if (setClassificationId.isEmpty()) {
                return new List<ermt__M_Classification__c>();
            }
            String sQuery =
                'SELECT Id, Name, RecordType.DeveloperName, RecordTypeId, ' +
                '( ' +
                '  SELECT Id, Name, ermt__ViewNo__c, ermt__ParentMClassification_del__c, RecordTypeId' +
                '  FROM ermt__MClassifications_del__r' +
                ') ' +
                ' FROM ermt__M_Classification__c' +
                ' WHERE Id IN :setClassificationId';
            return Database.query(sQuery);
        }

        private List<ermt__Project_Classification_Junc__c> getProjectClassificationJ(Set<String> setProjectId) {
            if (setProjectId.isEmpty()) {
                return new List<ermt__Project_Classification_Junc__c>();
            }
            List<String> listRTypeDNameClassification = new List<String>{
                NAME_CONSEQUENCE_GROUP,
                NAME_LIKELIHOOD_GROUP,
                NAME_EVALUATION_PERIOD_GROUP
            };
            String sQuery =
                'SELECT ermt__Project__c, ermt__M_Classification__c' +
                '  FROM ermt__Project_Classification_Junc__c ' +
                'WHERE ermt__M_Classification__r.RecordType.DeveloperName IN :listRTypeDNameClassification ' +
                'AND ermt__Project__c = :setProjectId';
            return Database.query(sQuery);
        }

        private List<ermt__RiskAssessment__c> getRiskAssessmentWithRelRiskId(
            Set<String> setRiskId,
            Set<String> setClassificationId
        ) {
            if (setRiskId.isEmpty()) {
                return new List<ermt__RiskAssessment__c>();
            }
            List<String> listRTypeDNameClassification = new List<String>{ NAME_CONSEQUENCE_GROUP, NAME_LIKELIHOOD_GROUP };
            String sQuery =
                'SELECT Id, Name, ermt__Risk__c, CreatedDate, ' +
                ' (SELECT Id, ermt__M_Classification__c, ermt__RiskAssessment__c, ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName' +
                '       FROM ermt__RiskAssessment_Classification_Junc__r' +
                '   WHERE ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName IN :listRTypeDNameClassification ' +
                ' ) ' +
                'FROM ermt__RiskAssessment__c ' +
                'WHERE ermt__Risk__c IN :setRiskId ';

            if (setClassificationId.size() > 0) {
                String subQuery =
                    '  AND Id IN' +
                    '  (SELECT ermt__RiskAssessment__c ' +
                    '   FROM ermt__RiskAssessment_Classification_Junc__c ' +
                    '   WHERE ermt__M_Classification__r.ermt__ParentMClassification_del__r.RecordType.DeveloperName IN :listRTypeDNameClassification ' +
                    '   AND ermt__M_Classification__c IN :setClassificationId ' +
                    '  ) ';
                sQuery = sQuery + subQuery;
            }
            return Database.query(sQuery);
        }
    }

    private with sharing class RiskTriggerHelper {

        private List<String> lSObjectsFieldValue (List<SObject> listRecord, String fieldKey) {
            List<String> instanceList = new List<String>();
            for(SObject record : listRecord) {
                if(record.get(fieldKey) == null) { 
                    continue;
                }
               instanceList.add((String) record.get(fieldKey));
            }
            return instanceList;
        }

        private Map<String, Object> mGroupFieldValue(List<SObject> listRecord, String fieldKeyMap, String fieldValueMap) {
            Map<String, Object> instanceMap = new Map<String, Object>();
            for (SObject record : listRecord) {
                instanceMap.put(String.ValueOf(record.get(fieldKeyMap)), record.get(fieldValueMap));
            }
            return instanceMap;
        }

        private Map<String, List<SObject>> mGroupFilterListRecord(List<SObject> listSObject, String fieldKeyMap) {
            Map<String, List<SObject>> instanceMap = new Map<String, List<SObject>>();

            String objectKeyMap = null;
            for (SObject record : listSObject) {
                if (record.get(fieldKeyMap) == null) {
                    continue;
                }
                objectKeyMap = (String) record.get(fieldKeyMap);
                if (instanceMap.containsKey(objectKeyMap) == false) {
                    instanceMap.put(objectKeyMap, new List<SObject>());
                }
                instanceMap.get(objectKeyMap).add(record);
            }
            return instanceMap;
        }

        private Map<String, List<SObject>> mSObjectChildRelName(
            List<SObject> listSObject,
            String fieldName,
            String childRelName
        ) {
            Map<String, List<SObject>> instanceMap = new Map<String, List<SObject>>();
            String keyName;

            for (SObject record : listSObject) {
                keyName = (String) record.get(fieldName);
                if (instanceMap.containsKey(keyName) == false) {
                    instanceMap.put(keyName, new List<SObject>());
                }
                if (record.getSObjects(childRelName) == null) {
                    continue;
                }
                instanceMap.get(keyName).addAll(record.getSObjects(childRelName));
            }
            return instanceMap;
        }

        private List<SObject> lSObjectChildRelName(SObject sObjectParent, String childRelName) {
            List<SObject> instanceList = new List<SObject>();
            if (sObjectParent.getSObjects(childRelName) == null) {
                return instanceList;
            }
            instanceList.addAll(sObjectParent.getSObjects(childRelName));
            return instanceList;
        }

        /**
         * @method : covertFlattenListSet
         * @description : conver list<Set<String>> to set<String>
         * @param listRecord: List<Set<String>>
         * @return Set<String>
         */
        private Set<String> covertFlattenListSet(List<Set<String>> listRecord) {
            Set<String> instanceSet = new Set<String>();
            for (Integer i = 0; i < listRecord.size(); i++) {
                instanceSet.addAll(listRecord[i]);
            }
            return instanceSet;
        }

        public Set<String> convertSetIdToListString(Set<Id> setID) {
            return (Set<String>) JSON.deserialize(JSON.serialize(setID), Set<String>.class);
        }

        private List<SObject> getFlattenListSObject(List<List<SObject>> listRecord) {
            List<SObject> instanceListSObject = new List<SObject>();
            for (Integer i = 0; i < listRecord.size(); i++) {
                instanceListSObject.addAll(listRecord[i]);
            }
            return instanceListSObject;
        }

        /**
         * @method : mProjectGroupClassification
         * @description : Group map field key projectId and values is set list record classificationId with rel project
         * @param :  mProjectGroupRelRiskL Map<ProjectId, List<Risk>>
         * @param :  mProjectGroupRClassificationJ Map<ProjectId, List<Classification>>
         * @return : Map<ProjectId , Set<ermt__M_Classification__c.Id>>
         */
        private Map<String, Set<String>> mProjectGroupClassification(
            Map<String, List<SObject>> mProjectGroupRelRiskL,
            Map<String, List<SObject>> mProjectGroupRClassificationJ
        ) {
            Map<String, Set<String>> mProjectGroupClassification = new Map<String, Set<String>>();
            for (String pId : mProjectGroupRelRiskL.keySet()) {
                if (mProjectGroupRClassificationJ.containsKey(pId) == false) {
                    continue;
                }
                List<SObject> lProjectClassificationJ = mProjectGroupRClassificationJ.get(pId);
                Map<String, List<SObject>> mClassification = this.mGroupFilterListRecord(
                    lProjectClassificationJ,
                    'ermt__M_Classification__c'
                );
                if (mProjectGroupClassification.containsKey(pId) == false) {
                    mProjectGroupClassification.put(pId, new Set<String>());
                }
                mProjectGroupClassification.get(pId).addAll(mClassification.keySet());
            }
            return mProjectGroupClassification;
        }

        /**
         * @method mClassificationMDT
         * @description : Group field follow define key and value id classification by custom metadata type
         * @param riskAssessmentMDT Custom metadata record RiskAssessmentConfiguration__mdt:
         * @return Map<String,String>
         */
        private Map<String, String> mClassificationMDT(RiskAssessmentConfiguration__mdt riskAssessmentMDT) {
            Map<String, String> instanceMap = new Map<String, String>();
            String valueFieldInheritGroup = riskAssessmentMDT != null
                ? (String) riskAssessmentMDT.get('Inherit_classification_id__c')
                : null;
            String valueFieldResidualGroup = riskAssessmentMDT != null
                ? (String) riskAssessmentMDT.get('Residual_classification_id__c')
                : null;
            instanceMap.put(NAME_FIELD_INHERIT_GROUP, valueFieldInheritGroup);
            instanceMap.put(NAME_FIELD_RESIDUAL_GROUP, valueFieldResidualGroup);
            return instanceMap;
        }

        /**
         * @method mFilterClassificationMDT
         * @description : filter value setting in custom metadata type
         * @param groupClassificationMDT Group field follow define key and value id classification by custom metadata type.
         * @param listClasification: List<ermt__M_Classification__c> soql query values groupClassificationMDT
         * @return Map<String,String>
         */
        private Map<String, String> mFilterClassificationMDT(
            Map<String, String> groupClassificationMDT,
            List<ermt__M_Classification__c> listClasification
        ) {
            Map<String, Object> mClassification = this.mGroupFieldValue(listClasification, 'Id', 'ermt__ViewNo__c');
            for (String groupName : groupClassificationMDT.keySet()) {
                String classificationID = groupClassificationMDT.get(groupName);
                if (mClassification.containsKey(classificationID) == false) {
                    groupClassificationMDT.remove(groupName);
                }
            }

            return groupClassificationMDT;
        }

        /**
         * @method mRTypeNameClassificationGroupRel
         * @description groupRecordType map key developerName record Parent and values
         * is listRecord with lookup relation parentId
         * @param : Set<setClassificationId>
         * @param : Map<Id, List<Classification>
         * @return : Map<ClassificationDeveloperName, List<ermt__MClassifications_del__r>
         */
        private Map<String, List<SObject>> mRTypeNameClassificationGroupRel(
            Set<String> setClassificationId,
            Map<String, List<SObject>> mGroupClassificationId
        ) {
            Map<String, List<SObject>> mRTypeNameClassificationGroupRel = new Map<String, List<SObject>>();

            for (String classificationId : setClassificationId) {
                if (
                    mGroupClassificationId.containsKey(classificationId) == false ||
                    mGroupClassificationId.get(classificationId).isEmpty()
                ) {
                    continue;
                }

                SObject classification = mGroupClassificationId.get(classificationId)[0];
                String rTypeDeveloperName = (String) classification.getSObject('RecordType').get('DeveloperName');

                if (mRTypeNameClassificationGroupRel.containsKey(rTypeDeveloperName) == false) {
                    mRTypeNameClassificationGroupRel.put(rTypeDeveloperName, new List<SObject>());
                }

                mRTypeNameClassificationGroupRel.get(rTypeDeveloperName)
                    .addAll(classification.getSObjects('ermt__MClassifications_del__r'));
            }
            return mRTypeNameClassificationGroupRel;
        }

        public Set<String> getChangedFields(SObject newRecord, SObject oldRecord, Set<String> systemFieldsRecord) {
            Set<String> fields = new Set<String>();
            Set<String> systemFields = systemFieldsRecord;
            for (String key : systemFieldsRecord) {
                if (oldRecord.get(key) != newRecord.get(key)) {
                    fields.add(key);
                }
            }
            return fields;
        }

        public String getClassificationFieldViewNo(SObject record, String fieldName) {
            String fieldValue = (String) record.get(fieldName);
            if(String.isBlank(fieldValue)) {
                return fieldValue;
            }
            String classificationValue = String.valueOf(Decimal.valueOf(fieldValue).setScale(2));
            return classificationValue;
        }

        public Map<String, Map<String, String>> mFieldRiskRelAssessmentJClassification() {
            Map<String, Map<String, String>> mapGroupDeveloperName = new Map<String, Map<String, String>>();
            mapGroupDeveloperName.put(
                NAME_FIELD_INHERIT_GROUP,
                new Map<String, String>{
                    NAME_LIKELIHOOD_GROUP => NAME_FIELD_INHERIT_LIKELIHOOD,
                    NAME_CONSEQUENCE_GROUP => NAME_FIELD_INHERIT_CONSEQUENCE
                }
            );
            mapGroupDeveloperName.put(
                NAME_FIELD_RESIDUAL_GROUP,
                new Map<String, String>{
                    NAME_LIKELIHOOD_GROUP => NAME_FIELD_RESIDUAL_LIKELIHOOD,
                    NAME_CONSEQUENCE_GROUP => NAME_FIELD_RESIDUAL_CONSEQUENCE
                }
            );
            return mapGroupDeveloperName;
        }

    }

    private class DispatchTriggerException extends Exception {
    }
}