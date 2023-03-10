import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import LOCALE from '@salesforce/i18n/locale';
import CURRENCY from '@salesforce/i18n/currency';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import label_title from '@salesforce/label/ermt.ProjectRisklist_Title';
import label_displayFieldsSetting from '@salesforce/label/ermt.ProjectRisklist_DisplayFieldsSetting';
import label_searchCondition from '@salesforce/label/ermt.ProjectRisklist_SearchCondition';
import label_risk from '@salesforce/label/ermt.ObjectLabel_Risk';
import label_control from '@salesforce/label/ermt.ObjectLabel_Control';
import label_editWarning from '@salesforce/label/ermt.ProjectRisklist_EditWarning';
import label_editError from '@salesforce/label/ermt.ProjectRisklist_EditError';
import label_saveSuccess from '@salesforce/label/ermt.ProjectRisklist_SaveSuccess';
import label_classiRecordType_analyseTiming from '@salesforce/label/c.ClassiRecordType_AnalyseTiming';
import label_classiRecordType_probability from '@salesforce/label/c.ClassiRecordType_Probability';
import label_classiRecordType_resultImpact from '@salesforce/label/c.ClassiRecordType_ResultImpact';
import label_classiRecordType_thirdEvaluation from '@salesforce/label/c.ClassiRecordType_ThirdEvaluation';
import label_list_number from '@salesforce/label/ermt.List_Number';
import label_list_page from '@salesforce/label/ermt.List_Page';
import label_list_first from '@salesforce/label/ermt.List_First';
import label_list_last from '@salesforce/label/ermt.List_Last';
import label_list_next from '@salesforce/label/ermt.List_Next';
import label_list_previous from '@salesforce/label/ermt.List_Previous';
import label_input_selectable from '@salesforce/label/ermt.Input_Selectable';
import label_input_selected from '@salesforce/label/ermt.Input_Selected';
import label_true from '@salesforce/label/ermt.Value_True';
import label_false from '@salesforce/label/ermt.Value_False';
import label_save from '@salesforce/label/ermt.Action_Save';
import label_ok from '@salesforce/label/ermt.Action_Ok';
import label_cancel from '@salesforce/label/ermt.Action_Cancel';
import label_functionType_risklist from '@salesforce/label/ermt.FunctionType_Risklist';
import label_settingType_searchCond from '@salesforce/label/ermt.SettingType_SearchCond';
import label_referToTheSameControl from '@salesforce/label/c.ProjectRisklist_ReferToTheSameControl';
import label_editControl from '@salesforce/label/c.ProjectRisllist_EditControlTitle';
import label_approvalSubmit_title from '@salesforce/label/c.ApprovalSubmit_Title';
import label_approvalSubmit_submit_confirm_1 from '@salesforce/label/c.ApprovalSubmit_Submit_Confirm_1';
import label_approvalSubmit_submit_list_count from '@salesforce/label/c.ApprovalSubmit_Submit_List_Count';
import label_approvalSubmit_complete from '@salesforce/label/c.ApprovalSubmit_Complete';
 import label_approvalSubmit_complete_detail from '@salesforce/label/c.ApprovalSubmit_Complete_Detail';
 import label_approvalSubmit_complete_count from '@salesforce/label/c.ApprovalSubmit_Complete_count';
 import label_approvalSubmit_incomplete_count from '@salesforce/label/c.ApprovalSubmit_Incomplete_count';
import RISK_OBJECT from '@salesforce/schema/ermt__Risk__c';
import CONTROL_OBJECT from '@salesforce/schema/ermt__Control__c';
import {
    getErrorMessages
    , isNumber
    , isArray
    , undefineToNull
    , stringToNumber
    , TYPE_BOOLEAN
    , TYPE_DATE
    , TYPE_TIME
    , TYPE_DATETIME
    , TYPE_INTEGER
    , TYPE_LONG
    , TYPE_DOUBLE
    , TYPE_CURRENCY
    , TYPE_PERCENT
    , TYPE_PICKLIST
    , TYPE_MULTIPICKLIST
    , TYPE_STRING
    , TYPE_ID
    , TYPE_REFERENCE
} from 'c/dam_CommonUtil';
import getRiskDisplayFieldNameSels from '@salesforce/apex/DAM_ProjectRisklistCtlr.getRiskDisplayFieldNameSels';
import getControlDisplayFieldNameSels from '@salesforce/apex/DAM_ProjectRisklistCtlr.getControlDisplayFieldNameSels';
import getRisklistDisplayFieldName from '@salesforce/apex/DAM_ProjectRisklistCtlr.getRisklistDisplayFieldName';
import saveRisklistDisplayFieldName from '@salesforce/apex/DAM_ProjectRisklistCtlr.saveRisklistDisplayFieldName';
import getRiskFieldDescByName from '@salesforce/apex/DAM_ProjectRisklistCtlr.getRiskFieldDescByName';
import getControlFieldDescByName from '@salesforce/apex/DAM_ProjectRisklistCtlr.getControlFieldDescByName';
import getRisks from '@salesforce/apex/DAM_ProjectRisklistCtlr.getRisks';
import getControlsByRiskId from '@salesforce/apex/DAM_ProjectRisklistCtlr.getControlsByRiskId';
import updateRiskRelation from '@salesforce/apex/DAM_ProjectRisklistEditCtlr.updateRiskRelation';
import getCustomFunctionSettingValue from '@salesforce/apex/DAM_CustomFunctionSettingCtlr.getCustomFunctionSettingValue';
import setCustomFunctionSettingValue from '@salesforce/apex/DAM_CustomFunctionSettingCtlr.setCustomFunctionSettingValue';
import getApprovalStatusSetting from '@salesforce/apex/DAM_ProjectRisklistApprovalCtrl.getApprovalStatusSetting';
import multiApplyApproval from '@salesforce/apex/DAM_ProjectRisklistApprovalCtrl.multiApplyApproval';
import checkRiskManagerPermission from '@salesforce/apex/DAM_ProjectRisklistApprovalCtrl.checkRiskManagerPermission';

export default class Dam_ProjectRisklistApproval extends LightningElement {
    @api recordId; // ????????????ID
    // ?????????
    label = {
        title: label_title
        , displayFieldsSetting: label_displayFieldsSetting
        , searchCondition: label_searchCondition
        , risk: label_risk
        , control: label_control
        , editWarning: label_editWarning
        , list_number: label_list_number
        , list_page: label_list_page
        , list_first: label_list_first
        , list_last: label_list_last
        , list_next: label_list_next
        , list_previous: label_list_previous
        , selectable: label_input_selectable
        , selected: label_input_selected
        , save: label_save
        , ok: label_ok
        , cancel: label_cancel
        , editControl: label_editControl
        , implementation_period: null
        , approvalSubmit_title: label_approvalSubmit_title
        , approvalSubmit_submit_confirm_1: label_approvalSubmit_submit_confirm_1
        , approvalSubmit_submit_list_count: label_approvalSubmit_submit_list_count
        , approvalSubmit_complete: label_approvalSubmit_complete
        , approvalSubmit_complete_detail: label_approvalSubmit_complete_detail
        , approvalSubmit_complete_count: label_approvalSubmit_complete_count
        , approvalSubmit_incomplete_count: label_approvalSubmit_incomplete_count
    };

    errorMessages = null; // ?????????????????????????????????
    isProcessing = false; // ?????????
    isShowEditControlModal = false; // flags open/close edit ermt__Control__c modal
    isShowDisplayFieldSettingButton = true;
    @track editingControlId = null;
    isOriginalStyleRendered = false; // ???????????????????????????
    displayFieldName = this.defaultDisplayFieldName; // ???????????????
    @track dispFieldNameTemp = this.defaultDisplayFieldName; // ?????????????????????????????????
    riskDisplayFieldNameSels = null; // ???????????????????????????????????????
    controlDisplayFieldNameSels = null; // ???????????????????????????????????????
    searchCondition = this.defaultSearchCondition; // ????????????
    @track searchCondTemp = this.defaultSearchCondition; // ??????????????????????????????
    windowHeight = window.innerHeight; // ????????????????????????
    header1 = null; // ????????????1
    @track header2 = null; // ????????????2
    @track detail = null; // ??????
    @track detailRaw = null; // ????????????????????????
    @track fixedHeaderTop = this.createFixedHeaderTop(); // ????????????????????????
    isEditing = false; // ?????????
    editingCell = null; // ??????????????????
    get riskObjectName() { return RISK_OBJECT.objectApiName; } // ??????????????????????????????
    get controlObjectName() { return CONTROL_OBJECT.objectApiName; } // ??????????????????????????????
    get riskSearchCondClass() { return 'slds-section__content' + (this.searchCondTemp.risk.isEnabled ? '' : ' slds-hide'); } // ??????????????????????????????
    get controlSearchCondClass() { return 'slds-section__content' + (this.searchCondTemp.control.isEnabled ? '' : ' slds-hide'); } // ??????????????????????????????

    //Approval
    hasCheckedRow = false;
    approvalStatusList = [];
    checklist_count = null;
    comment = null;

    // ???????????????
    @track pageInfo = {
        pageNumber: 1
        , lastPageNumber: 1
        , pageSize: 30
        , resultSize: 0
        , rowNumberOffset: 0
    };

    // ????????????
    columnWidthInfo = {
        col: null
        , width: null
        , clientX: null
    }

    // ???????????????????????????????????????
    get risklistWrapStyle() {
        const minHeight = 200;
        const marginHeight = (this.recordId ? 230 : 180);
        let maxHeight = this.windowHeight - marginHeight;
        if (maxHeight < minHeight) maxHeight = minHeight;
        return 'min-height:' + minHeight + 'px;max-height:' + maxHeight + 'px;';
    }

    // ?????????????????????????????????
    get defaultDisplayFieldName() {
        return {
            risk: [
                'Name'
                , 'ermt__Organization__c'
                , 'ermt__AssessmentStatus__c'
            ]
            , riskAssessment: [
                label_classiRecordType_analyseTiming
                , label_classiRecordType_probability
                , label_classiRecordType_resultImpact
                , label_classiRecordType_thirdEvaluation
                , 'ermt__isActive__c'
            ]
            , control: [
                'Name'
                , 'ermt__DescriptionContents__c'
            ]
        };
    }

    // ??????????????????????????????
    get defaultSearchCondition() {
        return {
            risk: {
                isEnabled: false
                , searchConds: null
                , searchCondLogic: null
            }
            , riskAssessment: {
                isEnabled: false
                , searchConds: null
                , searchCondLogic: null
            }
            , riskAssessmentClassi: {
                isEnabled: false
                , analyseTiming: {
                    isEnabled: false
                    , value: null
                }
                , probability: {
                    isEnabled: false
                    , value: null
                }
                , resultImpact: {
                    isEnabled: false
                    , value: null
                }
                , thirdEvaluation: {
                    isEnabled: false
                    , value: null
                }
            }
            , control: {
                isEnabled: false
                , searchConds: null
                , searchCondLogic: null
            }
        };
    }

    // ??????????????????????????????????????????
    get searchCondTempRisk() {
        return {
            searchConds: this.searchCondTemp.risk.searchConds
            , searchCondLogic: this.searchCondTemp.risk.searchCondLogic
        };
    }

    // ??????????????????????????????????????????
    get searchCondTempControl() {
        return {
            searchConds: this.searchCondTemp.control.searchConds
            , searchCondLogic: this.searchCondTemp.control.searchCondLogic
        };
    }

    // ?????????????????????
    get isFirstPageEnable() {
        return (this.pageInfo.pageNumber > 2);
    }

    // ?????????????????????
    get isLastPageEnable() {
        return (this.pageInfo.pageNumber < (this.pageInfo.lastPageNumber - 1));
    }

    // ??????????????????
    get isNextPageEnable() {
        return (this.pageInfo.pageNumber < this.pageInfo.lastPageNumber);
    }

    // ??????????????????
    get isPreviousPageEnable() {
        return (this.pageInfo.pageNumber > 1);
    }

    // Get Implementation_Period__c label for screen flow
    @wire(getObjectInfo, { objectApiName: CONTROL_OBJECT })
    controlInfo({ data, error }) {
        if (data) this.label.implementation_period = data.fields.Implementation_Period__c.label;
    }

    // Get Approval Status from Custom Setting
    @wire(getApprovalStatusSetting)
    approvalStatusSetting({ data, error }) {
        if (data) this.approvalStatusList = data;
    }

    // Variables for screen flow
    get flowVariables() {
        return [
            {
                name: 'ControlId',
                type: 'String',
                value: this.editingControlId
            },
            {
                name: 'ImplementationPeriodLabel',
                type: 'String',
                value: this.label.implementation_period
            }
        ];
    }

    // ????????????
    async connectedCallback() {
        this.isProcessing = true;
        try {
            // ???????????????????????????????????????????????????
            window.addEventListener('resize', () => {
                this.windowHeight = window.innerHeight;
            }, false);

            // ??????????????????????????
            this.isShowDisplayFieldSettingButton = await checkRiskManagerPermission();
            await this.loadSearchCondition();

            // ???????????????????????????
            await this.loadRisklist();
        } catch (error) {
            //console.log('error=' + JSON.stringify(error));
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // ???????????????
    renderedCallback() {
        // ????????????????????????
        this.addOriginalStyle();
    }

    // ???????????????????????????
    handleMainClick(event) {
        // ???????????????????????????????????????
        this.finishDetailCellEdit();
    }

    // ?????????????????????????????????
    async handleDisplayFieldsSettingClick() {
        this.errorMessages = null;
        try {
            // ????????????????????????????????????????????????
            this.riskDisplayFieldNameSels = await getRiskDisplayFieldNameSels();

            // ????????????????????????????????????????????????
            this.controlDisplayFieldNameSels = await getControlDisplayFieldNameSels();

            // ?????????????????????????????????????????????
            this.dispFieldNameTemp.risk = [...this.displayFieldName.risk];

            // ???????????????????????????????????????????????????????????????
            this.dispFieldNameTemp.riskAssessment = [...this.displayFieldName.riskAssessment];

            // ?????????????????????????????????????????????
            this.dispFieldNameTemp.control = [...this.displayFieldName.control];

            // ??????????????????????????????????????????
            this.openDisplayFieldsSettingDialog();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
    }

    // ????????????????????????????????????
    handleRiskDisplayFieldNameChange(event) {
        this.dispFieldNameTemp.risk = event.detail.value;
    }

    // ????????????????????????????????????
    handleControlDisplayFieldNameChange(event) {
        this.dispFieldNameTemp.control = event.detail.value;
    }

    // ??????????????????????????????????????????????????????
    handleDisplayFieldsSettingCancelClick() {
        // ?????????????????????????????????????????????
        this.closeDisplayFieldsSettingDialog();
    }

    // ?????????????????????OK??????????????????
    async handleDisplayFieldsSettingOkClick() {
        // ??????????????????
        let isValid = true;
        const dialog = this.template.querySelector('[data-name="display-fields-setting-dialog"]');
        isValid = [...dialog.querySelectorAll('lightning-dual-listbox')]
            .reduce((isValidSoFar, inputCmp) => {
                    //console.log('inputCmp.name=' + inputCmp.name);
                    inputCmp.reportValidity();
                    return isValidSoFar && inputCmp.checkValidity();
                }
                , isValid
            );
        if (!isValid) return;

        this.isProcessing = true;
        this.errorMessages = null;
        try {
            // ???????????????????????????????????????
            await saveRisklistDisplayFieldName({
                projectId: this.recordId
                , fieldName : JSON.stringify(this.dispFieldNameTemp)
            });

            // ?????????????????????????????????????????????
            this.closeDisplayFieldsSettingDialog();

            // ???????????????????????????
            await this.loadRisklist();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // ??????????????????????????????
    async handleSearchConditionClick() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        this.errorMessages = null;
        try {
            // ?????????????????????
            // ??????????????????
            this.searchCondTemp.risk.isEnabled = this.searchCondition.risk.isEnabled;
            this.searchCondTemp.riskAssessment.isEnabled = this.searchCondition.riskAssessment.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.isEnabled = this.searchCondition.riskAssessmentClassi.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled = this.searchCondition.riskAssessmentClassi.analyseTiming.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.probability.isEnabled = this.searchCondition.riskAssessmentClassi.probability.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled = this.searchCondition.riskAssessmentClassi.resultImpact.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled = this.searchCondition.riskAssessmentClassi.thirdEvaluation.isEnabled;
            this.searchCondTemp.control.isEnabled = this.searchCondition.control.isEnabled;
1
            // ????????????????????????
            if (this.searchCondition.risk.searchConds) {
                this.searchCondTemp.risk.searchConds = this.searchCondition.risk.searchConds.map(searchCond => { return {...searchCond}; });
            } else {
                this.searchCondTemp.risk.searchConds = null;
            }
            this.searchCondTemp.risk.searchCondLogic = this.searchCondition.risk.searchCondLogic;
            // if (this.searchCondTemp.risk.isEnabled) {
            //     const cmp = dialog.querySelector('[data-name="risk-serach-condition"]');
            //     if (cmp) {
            //         cmp.restore();
            //     }
            // }
            // ??????????????????????????????????????????
            if (this.searchCondition.riskAssessment.searchConds) {
                this.searchCondTemp.riskAssessment.searchConds = this.searchCondition.riskAssessment.searchConds.map(searchCond => { return {...searchCond}; });
            } else {
                this.searchCondTemp.riskAssessment.searchConds = null;
            }
            this.searchCondTemp.riskAssessment.searchCondLogic = this.searchCondition.riskAssessment.searchCondLogic;
            // if (this.searchCondTemp.riskAssessment.isEnabled) {
            //     const cmp = dialog.querySelector('[data-name="riskAssessment-serach-condition"]');
            //     if (cmp) {
            //         cmp.restore();
            //     }
            // }
            // ????????????????????????
            if (this.searchCondition.control.searchConds) {
                this.searchCondTemp.control.searchConds = this.searchCondition.control.searchConds.map(searchCond => { return {...searchCond}; });
            } else {
                this.searchCondTemp.control.searchConds = null;
            }
            this.searchCondTemp.control.searchCondLogic = this.searchCondition.control.searchCondLogic;
            // if (this.searchCondTemp.control.isEnabled) {
            //     const cmp = dialog.querySelector('[data-name="control-serach-condition"]');
            //     if (cmp) {
            //         cmp.restore();
            //     }
            // }

            // ????????????????????????????????????
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.analyseTiming.value = (
                    !this.searchCondition.riskAssessmentClassi.analyseTiming.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.analyseTiming.value]
                );
            }

            // ??????????????????????????????
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.probability.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.probability.value = (
                    !this.searchCondition.riskAssessmentClassi.probability.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.probability.value]
                );
            }

            // ??????????????????????????????
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.resultImpact.value = (
                    !this.searchCondition.riskAssessmentClassi.resultImpact.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.resultImpact.value]
                );
            }

            // ???????????????????????????
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.value = (
                    !this.searchCondition.riskAssessmentClassi.thirdEvaluation.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.thirdEvaluation.value]
                );
            }

            // ????????????????????????????????????
            this.openSearchConditionDialog();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
    }

    // ???????????????????????????????????????
    handleRiskSearchCondEnableChange(event) {
        this.searchCondTemp.risk.isEnabled = event.detail.checked;
    }

    // ?????????????????????????????????
    handleRiskSearchCondEdit(event) {
        this.searchCondTemp.risk.searchConds = event.detail.searchConditions;
        this.searchCondTemp.risk.searchCondLogic = event.detail.searchConditionLogic;
    }


    // ???????????????????????????????????????
    handleControlSearchCondEnableChange(event) {
        this.searchCondTemp.control.isEnabled = event.detail.checked;
    }

    // ?????????????????????????????????
    handleControlSearchCondEdit(event) {
        this.searchCondTemp.control.searchConds = event.detail.searchConditions;
        this.searchCondTemp.control.searchCondLogic = event.detail.searchConditionLogic;
    }

    // ????????????????????????????????????????????????
    handleSearchConditionCancelClick() {
        // ???????????????????????????????????????
        this.closeSearchConditionDialog();
    }

    // ???????????????OK??????????????????
    async handleSearchConditionOkClick() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        // ??????????????????
        let isValid = true;
        // ????????????????????????
        if (this.searchCondTemp.risk.isEnabled) {
            const cmp = dialog.querySelector('[data-name="risk-serach-condition"]');
            if (cmp) {
                const result = await cmp.checkValidity();
                isValid = isValid && result;
            }
        }
        // ??????????????????????????????????????????
        if (this.searchCondTemp.riskAssessment.isEnabled) {
            const cmp = dialog.querySelector('[data-name="riskAssessment-serach-condition"]');
            if (cmp) {
                const result = await cmp.checkValidity();
                isValid = isValid && result;
            }
        }
        // ????????????????????????
        if (this.searchCondTemp.control.isEnabled) {
            const cmp = dialog.querySelector('[data-name="control-serach-condition"]');
            if (cmp) {
                const result = await cmp.checkValidity();
                isValid = isValid && result;
            }
        }
        // ????????????????????????????????????
        if (
            this.searchCondTemp.riskAssessmentClassi.isEnabled &&
            this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled
        ) {
            const cmp = dialog.querySelector('[data-name="analyseTiming-serach-condition"]');
            if (cmp) {
                cmp.reportValidity();
                isValid = isValid && cmp.checkValidity();
            }
        }
        // ??????????????????????????????
        if (
            this.searchCondTemp.riskAssessmentClassi.isEnabled &&
            this.searchCondTemp.riskAssessmentClassi.probability.isEnabled
        ) {
            const cmp = dialog.querySelector('[data-name="probability-serach-condition"]');
            if (cmp) {
                cmp.reportValidity();
                isValid = isValid && cmp.checkValidity();
            }
        }
        // ??????????????????????????????
        if (
            this.searchCondTemp.riskAssessmentClassi.isEnabled &&
            this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled
        ) {
            const cmp = dialog.querySelector('[data-name="resultImpact-serach-condition"]');
            if (cmp) {
                cmp.reportValidity();
                isValid = isValid && cmp.checkValidity();
            }
        }
        // ???????????????????????????
        if (
            this.searchCondTemp.riskAssessmentClassi.isEnabled &&
            this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled
        ) {
            const cmp = dialog.querySelector('[data-name="thirdEvaluation-serach-condition"]');
            if (cmp) {
                cmp.reportValidity();
                isValid = isValid && cmp.checkValidity();
            }
        }

        if (!isValid) return;

        this.isProcessing = true;
        this.errorMessages = null;
        try {
            // ?????????????????????
            // ????????????????????????
            let searchConds = null;
            let searchCondLogic = null;
            if (this.searchCondTemp.risk.isEnabled) {
                const cmp = dialog.querySelector('[data-name="risk-serach-condition"]');
                if (cmp) {
                    const result = cmp.save();
                    searchConds = result.data.searchConditions;
                    searchCondLogic = result.data.searchConditionLogic;
                }
            }
            this.searchCondition.risk.searchConds = searchConds;
            this.searchCondition.risk.searchCondLogic = searchCondLogic;

            // ??????????????????????????????????????????
            searchConds = null;
            searchCondLogic = null;
            if (this.searchCondTemp.riskAssessment.isEnabled) {
                const cmp = dialog.querySelector('[data-name="riskAssessment-serach-condition"]');
                if (cmp) {
                    const result = cmp.save();
                    searchConds = result.data.searchConditions;
                    searchCondLogic = result.data.searchConditionLogic;
                }
            }
            this.searchCondition.riskAssessment.searchConds = searchConds;
            this.searchCondition.riskAssessment.searchCondLogic = searchCondLogic;

            // ????????????????????????
            searchConds = null;
            searchCondLogic = null;
            if (this.searchCondTemp.control.isEnabled) {
                const cmp = dialog.querySelector('[data-name="control-serach-condition"]');
                if (cmp) {
                    const result = cmp.save();
                    searchConds = result.data.searchConditions;
                    searchCondLogic = result.data.searchConditionLogic;
                }
            }
            this.searchCondition.control.searchConds = searchConds;
            this.searchCondition.control.searchCondLogic = searchCondLogic;

            // ????????????????????????????????????
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.analyseTiming.value
            }
            this.searchCondition.riskAssessmentClassi.analyseTiming.value = searchConds;

            // ??????????????????????????????
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.probability.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.probability.value
            }
            this.searchCondition.riskAssessmentClassi.probability.value = searchConds;

            // ??????????????????????????????
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.resultImpact.value
            }
            this.searchCondition.riskAssessmentClassi.resultImpact.value = searchConds;

            // ???????????????????????????
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.value
            }
            this.searchCondition.riskAssessmentClassi.thirdEvaluation.value = searchConds;

            // ??????????????????
            this.searchCondition.risk.isEnabled = this.searchCondTemp.risk.isEnabled;
            this.searchCondition.riskAssessment.isEnabled = this.searchCondTemp.riskAssessment.isEnabled;
            this.searchCondition.riskAssessmentClassi.isEnabled = this.searchCondTemp.riskAssessmentClassi.isEnabled;
            this.searchCondition.riskAssessmentClassi.analyseTiming.isEnabled = this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled;
            this.searchCondition.riskAssessmentClassi.probability.isEnabled = this.searchCondTemp.riskAssessmentClassi.probability.isEnabled;
            this.searchCondition.riskAssessmentClassi.resultImpact.isEnabled = this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled;
            this.searchCondition.riskAssessmentClassi.thirdEvaluation.isEnabled = this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled;
            this.searchCondition.control.isEnabled = this.searchCondTemp.control.isEnabled;

            // ???????????????????????????????????????
            this.closeSearchConditionDialog();

            // ???????????????????????????
            await this.loadRisklist();
            this.handleClearAllCheckbox();

            // ?????????????????????
            await this.saveSearchCondition();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // ??????????????????????????????
    handlePageMoveClick(event) {
        event.preventDefault();
        const name = event.target.dataset.name;
        if (name === 'first-page') {
            this.pageInfo.pageNumber = 1;
        } else if (name === 'last-page') {
            this.pageInfo.pageNumber = this.pageInfo.lastPageNumber;
        } else if (name === 'next-page') {
            this.pageInfo.pageNumber++;
        } else if (name === 'previous-page') {
            this.pageInfo.pageNumber--;
        }

        // ??????????????????????????????????????????
        let detailParPage = this.pagingRisklistDetail(this.detailRaw);
        // ??????????????????????????????????????????
        let detail = this.groupingRisklistDetail(detailParPage);

        this.detail = detail;
        this.handleClearAllCheckbox();
    }

    // ??????????????????????????????
    handleColumnSortClick(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const col = stringToNumber(target.dataset.col);
        if (col === null) return;
        const cell = target.closest('th');
        if (!cell) return;
        let isAscending = true;
        if (
            cell.classList.contains('slds-is-sorted_asc') &&
            cell.classList.contains('slds-is-sorted')
        ) {
            isAscending = false;
        }

        // ?????????2?????????
        this.header2.forEach((cell, index) => {
            if (col === index) {
                cell.cellClass = this.getHeader2CellClass(isAscending, true);
            } else {
                cell.cellClass = this.getHeader2CellClass(true, false);
            }
        });

        // ??????????????????
        this.detailRaw.sort((rec1, rec2) => {
            let ret = 0;
            const cell1 = rec1[col+1];
            const cell2 = rec2[col+1];
            if (cell1 && cell2) {
                const value1 = this.getDetailSortValue(cell1.item.value, cell1.item.text, cell1.item.type);
                const value2 = this.getDetailSortValue(cell2.item.value, cell2.item.text, cell2.item.type);
                if (value1 !== null && value2 !== null) {
                    if (value1 < value2) {
                        ret = -1;
                    } else if (value1 > value2) {
                        ret = 1;
                    }
                } else if (value1 !== null) {
                    ret = 1;
                } else if (value2 !== null) {
                    ret = -1;
                }
                if (ret != 0 && !isAscending) ret *= -1;
            }
            return ret;
        });

        // ????????????????????????
        this.detailRaw.forEach((rec, index) => {
            rec.forEach(cell => {
                cell.row = index;
            });
        });

        // ??????????????????????????????????????????
        const detailParPage = this.pagingRisklistDetail(this.detailRaw);
        // ??????????????????????????????????????????
        const detail = this.groupingRisklistDetail(detailParPage);

        this.detail = detail;
        this.handleClearAllCheckbox();
    }

    // ??????????????????????????????
    handleColumnWidthMousedown(event) {
        const target = event.currentTarget;
        const col = stringToNumber(target.dataset.col);
        const cell = target.closest('th');
        if (cell) {
            const elm = cell.querySelector('.col-width');
            if (elm) {
                this.columnWidthInfo.col = col;
                this.columnWidthInfo.width = elm.offsetWidth;
                this.columnWidthInfo.clientX = event.clientX;
            }
        }
    }

    // ???????????????????????????
    handleColumnWidthMousemove(event) {
        if (this.columnWidthInfo.col === null) return;
        const col = this.columnWidthInfo.col;
        let width = (event.clientX - this.columnWidthInfo.clientX) + this.columnWidthInfo.width;
        if (width < 0) width = 0;
        const cell = this.header2[col];
        if (cell) {
            cell.colWidthStyle = 'width:' + width + 'px';
        }
        this.detailRaw.forEach(rec => {
            const cell = rec[col + 1];
            if (cell) {
                cell.colWidthStyle = 'width:' + width + 'px';
            }
        });
    }

    // ??????????????????????????????
    handleColumnWidthMouseup(event) {
        this.columnWidthInfo.col = null;
    }

    // ?????????????????????????????????????????????
    handleRisklistWrapScroll(event) {
        const target = event.target;

        // ?????????????????????????????????
        this.fixedHeaderTop = this.createFixedHeaderTop(target);
    }

    // ????????????????????????
    handleEditClick(event) {
        event.stopPropagation();

        // ???????????????????????????????????????
        this.finishDetailCellEdit();

        const row = stringToNumber(event.target.dataset.row);
        const col = stringToNumber(event.target.dataset.col);
        if (row === null || col === null) return;
        const rec = this.detailRaw[row];
        if (!rec) return;
        const cell = rec[col];
        if (!cell) return;
        cell.isEditing = true;
        this.editingCell = cell;
    }

    // ?????????????????????????????????????????????
    handleEditPopoverClick(event) {
        event.stopPropagation();
    }

    // ?????????????????????????????????????????????????????????
    handleEditPopoverCloseClick(event) {
        const row = stringToNumber(event.target.dataset.row);
        const col = stringToNumber(event.target.dataset.col);
        if (row === null || col === null) return;
        const rec = this.detailRaw[row];
        if (!rec) return;
        const cell = rec[col];
        if (!cell) return;
        cell.isEditing = false;
        this.editingCell = null;
    }

    // ???????????????
    handleValueChange(event) {
        const value = event.detail.value;
        const label = event.detail.label;
        const row = stringToNumber(event.target.dataset.row);
        const col = stringToNumber(event.target.dataset.col);
        if (row === null || col === null) return;
        const rec = this.detailRaw[row];
        if (!rec) return;
        const cell = rec[col];
        if (!cell) return;
        const item = cell.item;

        // ?????????????????????
        event.target.reportValidity();
        const isError = !event.target.checkValidity();

        // ????????????????????????
        this.editDetailItem(item, {
            value: value
            , label: label
            , isError: isError
        });

        this.isEditing = true;
        this.handleClearAllCheckbox();
    }

    // ??????????????????????????????????????????
    handleEditCancelClick() {
        // ??????????????????????????????
        this.undoDetailEdit();
        this.errorMessages = null;
    }

    // ?????????????????????????????????
    async handleEditSaveClick() {
        // ??????????????????????????????
        if (!this.checkDetailError()) return;

        this.isProcessing = true;
        this.errorMessages = null;
        try {
            // ????????????????????????
            await this.saveDetailEdit();

            // ???????????????????????????
            await this.loadRisklist();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // ???????????????????????????????????????????????????
    handleErrorAlertCloseClick() {
        this.errorMessages = null;
    }

    // ????????????????????????
    addOriginalStyle() {
        if (this.isOriginalStyleRendered) return;
        this.isOriginalStyleRendered = true;

        const style = document.createElement('style');
        style.innerHTML =
            `table.risklist lightning-input lightning-datepicker lightning-calendar div.slds-datepicker {
                top: 32px !important;
            }
            table.risklist lightning-input lightning-timepicker div.slds-listbox {
                top: 32px !important;
            }`;
        this.template.querySelector('lightning-card.main').appendChild(style);
    }

    // ?????????????????????????????????
    createFixedHeaderTop(target) {
        let style = '';
        if (target) {
            style = (target.scrollTop > 0 ? 'top:' + target.scrollTop + 'px;' : '');
        }
        return {
            style: style
        };
    }

    // ???????????????????????????
    async loadRisklist() {

        this.approvalStatusList = await getApprovalStatusSetting();
        // ???????????????????????????????????????????????????
        //const isRiskAssessAllEditable = await checkRiskAssessmentEditPermission();

        // ???????????????????????????????????????
        let displayFieldName = await getRisklistDisplayFieldName({
            projectId: this.recordId
        });
        displayFieldName = !displayFieldName ? null : JSON.parse(displayFieldName);
        this.displayFieldName = displayFieldName || this.defaultDisplayFieldName;
        //console.log('displayFieldName=' + JSON.stringify(this.displayFieldName));

        // ???????????????????????????????????????
        const riskFieldDescByName = await getRiskFieldDescByName({
            dispFieldNames: this.displayFieldName.risk
        });
        //console.log('riskFieldDescByName=' + JSON.stringify(riskFieldDescByName));

        // ???????????????????????????????????????
        const controlFieldDescByName = await getControlFieldDescByName({
            dispFieldNames : this.displayFieldName.control
        });
        //console.log('controlFieldDescByName=' + JSON.stringify(controlFieldDescByName));

        // ???????????????????????????
        const risks = await this.getRisks({
            projectId: this.recordId
            , dispFieldNames: this.displayFieldName.risk
            , searchConds: this.searchCondition.risk.searchConds
            , searchCondLogic: this.searchCondition.risk.searchCondLogic
        });
        // console.log('risks=' + JSON.stringify(risks));

        // ????????????????????????????????????
        const controlsByRiskId = await this.getControlsByRiskId({
            projectId: this.recordId
            , dispFieldNames: this.displayFieldName.control
            , searchConds: this.searchCondition.control.searchConds
            , searchCondLogic: this.searchCondition.control.searchCondLogic
        });

        //console.log('controlsByRiskId=' + JSON.stringify(controlsByRiskId));

        // ????????????????????????????????????
        const header1 = [];
        const header2 = [];
        let colspan;
        let row;
        let col;

        // ?????????
        col = -1;
        colspan = 0;
        this.displayFieldName.risk.forEach(fieldName => {
            const fieldDesc = riskFieldDescByName[fieldName];
            if (fieldDesc) {
                col++;
                colspan++;
                header2.push({
                    text: this.getHeaderText(fieldDesc.label, fieldDesc.type)
                    , helpText: fieldDesc.helpText
                    , col: col
                    , colWidthStyle: this.getDefaultColumnWidthStyle(fieldDesc.type)
                    , cellClass : this.getHeader2CellClass(true, false)
                });
            }
        });
        if (colspan > 0) {
            header1.push({
                text: this.label.risk
                , colspan: colspan
            });
        }

        // ?????????
        colspan = 0;
        this.displayFieldName.control.forEach(fieldName => {
            const fieldDesc = controlFieldDescByName[fieldName];
            if (fieldDesc) {
                col++;
                colspan++;
                header2.push({
                    text: (fieldName == 'Total_Of_Risk_Control_Junctions__c') ? label_referToTheSameControl : this.getHeaderText(fieldDesc.label, fieldDesc.type)
                    , helpText: fieldDesc.helpText
                    , col: col
                    , colWidthStyle: this.getDefaultColumnWidthStyle(fieldDesc.type)
                    , cellClass : this.getHeader2CellClass(true, false)
                });
            }
        });
        if (colspan > 0) {
            header1.push({
                text: this.label.control
                , colspan: colspan
            });
        }
        //console.log('header1=' + JSON.stringify(header1));
        //console.log('header2=' + JSON.stringify(header2));

        // ?????????????????????????????????
        const detailRaw = [];
        row = -1;
        risks.forEach(risk => {
            const riskId = risk.Id;
            const riskApprovalStatus = risk.ermt__ApprovalStatus__c;
            let isApprovalRisk = [...this.approvalStatusList].includes(riskApprovalStatus) ? false : true;
            const controls = controlsByRiskId[riskId];

            // ???????????????
            let isTarget = true;
            if (this.searchCondition.control.searchConds) {
                if (!controls || controls.length === 0) {
                    isTarget = false;
                }
            }

            if (isTarget) {
                // ?????????????????????????????????
                let relationMax = 1;
                if (controls) {
                    relationMax = (relationMax < controls.length ? controls.length : relationMax);
                }

                // ???????????????
                // ?????????
                const riskItems = [];
                riskItems.push({
                    isCheckboxCol: true
                    , riskId: riskId
                    , objectName: RISK_OBJECT.objectApiName
                    , isDisableCheckbox: isApprovalRisk
                    , value: null
                    , label: null
                    , isEditable: false
                    , type: null
                })
                const isRiskEditable = risk['HasEditAccess'] || false;
                this.displayFieldName.risk.forEach(fieldName => {
                    const fieldDesc = riskFieldDescByName[fieldName];
                    if (fieldDesc) {
                        let name = fieldName;
                        const value = undefineToNull(risk[name]);
                        name = fieldName + '_Label';
                        const label = undefineToNull(risk[name]);
                        let isIncidentLinksField = (fieldName === 'ermt__Incident_Links__c') ? true : false;
                        riskItems.push(this.createDetailItem({
                            value: value
                            , label: label
                            , type: fieldDesc.type
                            , recordTypeId: risk['RecordTypeId']
                            , isRequired: (fieldName === 'Name' ? true : !fieldDesc.isNillable)
                            , isIncidentLinksField: isIncidentLinksField
                            , isEditable: (!isRiskEditable || isApprovalRisk || fieldName === 'RecordTypeId' || fieldName === 'ermt__ApprovalStatus__c' || fieldName === 'Name' || isIncidentLinksField ? false : fieldDesc.isUpdateable)
                            , objectName: RISK_OBJECT.objectApiName
                            , fieldName: fieldName
                            , riskId: riskId
                        }));
                    }
                });

                for (let i = 0; i < relationMax; i++) {
                    const rec = [];
                    row++;
                    col = -1;

                    // ?????????
                    riskItems.forEach((item, index) => {
                        col++;
                        rec.push({
                            row: row
                            , col: col
                            , colWidthStyle: this.getDefaultColumnWidthStyle(item.type)
                            , rowspan: (index === 0) ? relationMax : 1
                            , isEditing: false
                            , item: item
                        });
                    });

                    // ?????????
                    let control = null;
                    let hasJuncWithApprovalRisk = false;
                    if (controls && i < controls.length) {
                        control = controls[i];

                        const riskControlJuncs = control.RiskControlJuncs;
                        hasJuncWithApprovalRisk = riskControlJuncs.some(elm => {
                            return ![...this.approvalStatusList].includes(elm.ermt__Risk__r.ermt__ApprovalStatus__c);
                            //if(![...this.approvalStatusList].includes(elm.ermt__Risk__r.ermt__ApprovalStatus__c)) hasJuncWithApprovalRisk = true;
                        })
                    }
                    this.displayFieldName.control.forEach(fieldName => {
                        const fieldDesc = controlFieldDescByName[fieldName];
                        if (fieldDesc) {
                            let value = null;
                            let label = null;
                            let type = null;
                            let riskControlId = null;
                            let isInspectionSheetNoField = (fieldName === 'Inspection_Sheet_No__c') ? true : false;
                            if (control) {
                                if (fieldName === 'Name') {
                                    value = undefineToNull(control.Id);
                                    label = undefineToNull(control[fieldName]);
                                    type = TYPE_REFERENCE;
                                    riskControlId = control.riskControlId;
                                } else if (fieldName === 'Total_Of_Risk_Control_Junctions__c') {
                                    value = undefineToNull(control[fieldName]) >= 2 ? true : null;
                                    label = value;
                                    type = TYPE_BOOLEAN;
                                } else {
                                    let name = fieldName;
                                    value = undefineToNull(control[name]);
                                    name = fieldName + '_Label';
                                    label = undefineToNull(control[name]);
                                    type = fieldDesc.type;
                                }
                            }
                            col++;
                            rec.push({
                                row: row
                                , col: col
                                , colWidthStyle: this.getDefaultColumnWidthStyle(type)
                                , rowspan: 1
                                , isEditing: false
                                , item: this.createDetailItem({
                                    value: value
                                    , label: label
                                    , type: type
                                    , isRequired: false
                                    , recordTypeId: null
                                    , isEditable: false
                                    , controlId: control ? undefineToNull(control.Id) : undefined
                                    , isInspectionSheetNoField: isInspectionSheetNoField
                                    , hasJuncWithApprovalRisk: hasJuncWithApprovalRisk
                                    , objectName: CONTROL_OBJECT.objectApiName
                                    , fieldName:???fieldName
                                    , riskId: riskId
                                    , riskControlId: riskControlId
                                })
                            });
                        }
                    });
                    detailRaw.push(rec);
                }
            }
        });
        //console.log('detailRaw=' + JSON.stringify(detailRaw));

        // ??????????????????????????????????????????
        const detailParPage = this.pagingRisklistDetail(detailRaw);
        // ??????????????????????????????????????????
        const detail = this.groupingRisklistDetail(detailParPage);

        this.header1 = header1;
        this.header2 = header2;
        this.detailRaw = detailRaw;
        this.detail = detail;
        this.isEditing = false;
    }

    // ????????????????????????????????????????????????????????????????????????????????????
    async getRisks(param) {
        let ret = [];
        let lastId = null;
        let lastRiskNo = null;
        let result;
        do {
            // ???????????????????????????
            result = await getRisks({
                projectId: param.projectId
                , dispFieldNames: param.dispFieldNames
                , searchConds: param.searchConds
                , searchCondLogic: param.searchCondLogic
                , previousLastId: lastId
                , previousLastRiskNo: lastRiskNo
            });
            ret = ret.concat(result.data);
            lastId = result.lastId;
            lastRiskNo = result.lastRiskNo;
        } while (result.isContinue);
        return ret;
    }

    // ?????????????????????????????????????????????????????????????????????????????????????????????
    async getControlsByRiskId(param) {
        const ret = {};
        let lastId = null;
        let lastName = null;
        let result;
        do {
            // ????????????????????????????????????
            result = await getControlsByRiskId({
                projectId: param.projectId
                , dispFieldNames: param.dispFieldNames
                , searchConds: param.searchConds
                , searchCondLogic: param.searchCondLogic
                , previousLastId: lastId
                , previousLastName: lastName
            });
            for (let riskId in result.data) {
                let controls = ret[riskId];
                if (!controls) controls = [];
                ret[riskId] = controls.concat(result.data[riskId]);
            }
            lastId = result.lastId;
            lastName = result.lastName;
        } while (result.isContinue);
        return ret;
    }

    // ??????????????????????????????????????????
    pagingRisklistDetail(detailRaw) {
        this.pageInfo.resultSize = detailRaw.length;
        this.pageInfo.lastPageNumber = (
            this.pageInfo.resultSize === 0 ?
            1 : Math.ceil(this.pageInfo.resultSize / this.pageInfo.pageSize)
        );
        if (this.pageInfo.pageNumber <= 0) {
            this.pageInfo.pageNumber = 1;
        } else if (this.pageInfo.lastPageNumber < this.pageInfo.pageNumber) {
            this.pageInfo.pageNumber = this.pageInfo.lastPageNumber;
        }
        this.pageInfo.rowNumberOffset = (this.pageInfo.pageNumber - 1) * this.pageInfo.pageSize;
        //console.log('pageInfo=' + JSON.stringify(this.pageInfo));

        const startIndex = this.pageInfo.rowNumberOffset;
        const endIndex = this.pageInfo.pageNumber * this.pageInfo.pageSize;
        const detailParPage = detailRaw.slice(startIndex, endIndex);
        //console.log('detailParPage=' + JSON.stringify(detailParPage));

        return detailParPage;
    }

    // ??????????????????????????????????????????
    groupingRisklistDetail(detailParPage) {
        let detail = [];
        let isRiskChange = false;
        let riskIdTemp = null;
        let riskCells = [];
        let riskCnt = 0;
        let rowspan = 1;
        const offset = this.pageInfo.rowNumberOffset;
        detailParPage.forEach((rec, index) => {
            const newRec = {
                no: index + offset + 1
                , riskId: rec[0].item.riskId
                , cells: []
            };

            // ?????????ID?????????
            let riskId = null;
            if (rec.length > 0) {
                const cell = rec[0];
                riskId = cell.item.riskId;
            }

            // ??????????????????????????????
            isRiskChange = (index === 0 || riskId !== riskIdTemp);
            riskIdTemp = riskId;
            if (isRiskChange) {
                riskCnt++;
                // ??????????????????????????????????????????????????????
                if (riskCells.length > 0) {
                    riskCells.forEach(cell => {
                        cell.rowspan = rowspan;
                    });
                }
                riskCells = [];
                rowspan = 1;
            } else {
                rowspan++;
            }

            // ????????????????????????
            newRec.rowClass = 'slds-hint-parent' + (riskCnt % 2 === 1 ? '' : ' striped');

            // ?????????????????????????????????
            rec.forEach(cell => {
                if (cell.item.objectName === RISK_OBJECT.objectApiName) {
                    if (isRiskChange) {
                        newRec.cells.push(cell);
                        riskCells.push(cell);
                    }
                } else {
                    newRec.cells.push(cell);
                }
            });

            detail.push(newRec);
        });

        // ?????????????????????????????????????????????
        if (riskCells.length > 0) {
            riskCells.forEach(cell => {
                cell.rowspan = rowspan;
            });
        }
        //console.log('detail=' + JSON.stringify(detail));

        return detail;
    }

    // ?????????????????????????????????????????????
    getDefaultColumnWidthStyle(type) {
        let ret = 'width: 120px;';
        if (type === null) {
            ret = 'width:auto;';
        } else if (type === TYPE_BOOLEAN) {
            ret = 'width:80px;';
        } else if (
            type === TYPE_INTEGER ||
            type === TYPE_LONG ||
            type === TYPE_DOUBLE ||
            type === TYPE_CURRENCY ||
            type === TYPE_PERCENT ||
            type === TYPE_DATE ||
            type === TYPE_TIME
        ) {
            ret = 'width:100px;';
        }
        return ret;
    }

    // ?????????????????????????????????
    getHeaderText(label, type) {
        let ret = null;
        if (type === TYPE_REFERENCE) {
            if (label) {
                ret = label.replace(/\s*ID$/i, '');
            }
        } else {
            ret = label;
        }
        return ret;
    }

    // ?????????2???????????????????????????
    getHeader2CellClass(isAscending, isSorted) {
        let ret = 'slds-is-resizable slds-is-sortable';
        ret += (isAscending ? ' slds-is-sorted_asc' : ' slds-is-sorted_desc');
        if (isSorted) {
            ret += ' slds-is-sorted';
        }
        return ret;
    }

    // ??????????????????????????????
    undoDetailEdit() {
        this.detailRaw.forEach(rec => {
            rec.forEach(cell => {
                if (cell.item.isEdited) {
                    this.undoDetailItemEdit(cell.item);
                }
            });
        });
        this.isEditing = false;
    }

    // ????????????????????????
    async saveDetailEdit() {
        // ??????????????????????????????
        const addedRiskIds = [];
        const risks = [];
        const riskAssessments = [];
        const riskAssessmentClassis = [];
        const riskControls = [];
        this.detailRaw.forEach((rec, index) => {
            const no = index + 1;
            const risk = {};
            const riskAssess = {};
            const riskControl = {};
            let addedRiskId = null;
            rec.forEach(cell => {
                const item = cell.item;
                if (item.isEdited) {
                    if (item.objectName === RISK_OBJECT.objectApiName) {
                        // ?????????????????????????????????????????????
                        if (addedRiskIds.indexOf(item.riskId) < 0) {
                            addedRiskId = item.riskId;
                            if (!('Id' in risk)) {
                                risk['Id'] = {
                                    value: item.riskId
                                    , type: TYPE_ID
                                    , no: no
                                };
                            }
                            risk[item.fieldName] = {
                                value: item.value
                                , type: item.type
                                , no: no
                            };
                        }
                    } else if (item.objectName === CONTROL_OBJECT.objectApiName) {
                        if (item.fieldName === 'Name') {
                            riskControl['Id'] = {
                                value: item.riskControlId
                                , type: TYPE_ID
                                , no: no
                            };
                            riskControl['ermt__Risk__c'] = {
                                value: item.riskId
                                , type: TYPE_REFERENCE
                                , no: no
                            };
                            riskControl['ermt__Control__c'] = {
                                value: item.value
                                , type: TYPE_REFERENCE
                                , no: no
                            };
                        }
                    }
                }
            });
            if (addedRiskId) {
                addedRiskIds.push(addedRiskId);
            }
            if (Object.keys(risk).length > 0) {
                risks.push(risk);
            }
            if (Object.keys(riskAssess).length > 0) {
                riskAssessments.push(riskAssess);
            }
            if (Object.keys(riskControl).length > 0) {
                riskControls.push(riskControl);
            }
        });
        // console.log('risks=' + JSON.stringify(risks));
        // console.log('riskAssessments=' + JSON.stringify(riskAssessments));
        // console.log('riskAssessmentClassis=' + JSON.stringify(riskAssessmentClassis));
        // console.log('riskControls=' + JSON.stringify(riskControls));

        // ????????????????????????
        await updateRiskRelation({
            risks: risks
            , riskAssessments: riskAssessments
            , riskAssessmentClassis: riskAssessmentClassis
            , riskControls: riskControls
        });

        this.isEditing = false;

        // ?????????????????????
        this.dispatchEvent(
            new ShowToastEvent({
                message: label_saveSuccess
                , variant: 'success'
            })
        );
    }

    // ??????????????????????????????
    checkDetailError() {
        const errNos = [];
        this.detailRaw.forEach((rec, index) => {
            rec.forEach(cell => {
                if (cell.item.isError) {
                    const no = index + 1;
                    if (errNos.indexOf(no) < 0) {
                        errNos.push(no);
                    }
                }
            });
        });
        let errMsg = null;
        if (errNos.length > 0) {
            errMsg = label_editError + '(No.' + errNos.join(', ') + ')';
        }
        this.errorMessages = (!errMsg ? null : getErrorMessages(errMsg));
        return !errMsg;
    }

    // ???????????????????????????????????????
    finishDetailCellEdit() {
        if (this.editingCell) {
            this.editingCell.isEditing = false;
            this.editingCell = null;
        }
    }

    // ????????????????????????
    createDetailItem(data) {
        const item = {
            type: data.type
            , isRequired: data.isRequired || false
            , isEditable: data.isEditable || false
            , isEdited: false
            , isError: false
            , objectName: data.objectName
            , fieldName: data.fieldName
            , riskId: data.riskId
            , recordTypeId: data.recordTypeId
        };
        if ('riskControlId' in data) {
            item.riskControlId = data.riskControlId;
        }
        if ('isIncidentLinksField' in data) {
            item.isIncidentLinksField = data.isIncidentLinksField;
        }
        if( 'isInspectionSheetNoField' in data) {
            item.isInspectionSheetNoField = data.isInspectionSheetNoField;
            item.controlId = data.controlId
        }
        if( 'hasJuncWithApprovalRisk' in data) {
            item.hasJuncWithApprovalRisk = data.hasJuncWithApprovalRisk;
        }
        if( 'isDisableCheckbox' in data) {
            item.isDisableCheckbox = data.isDisableCheckbox;
        }
        item.value = this.getDetailValue(data.value, item.type);
        item.oldValue = item.value;
        item.label = this.getDetailLabel(data.label, item.type);
        item.oldLabel = item.label;
        item.text = this.getDetailText(item.value, item.label, item.type);
        item.url = this.getDetailUrl(item);
        item.cellClass = this.getDetailCellClass(item.isEditable, item.isEdited, item.isError);
        const inputMode = this.getDetailInputMode(item);
        item.isInputModeNormal = (inputMode === 0);
        item.isInputModeRiskAssessClassi = (inputMode === 1);
        item.isInputModeControl = (inputMode === 2);
        return item;
    }

    // ????????????????????????
    editDetailItem(item, data) {
        item.value = this.getDetailValue(data.value, item.type);
        item.label = this.getDetailLabel(data.label, item.type);
        item.text = this.getDetailText(item.value, item.label, item.type);
        item.url = this.getDetailUrl(item);
        item.isEdited = (JSON.stringify(item.value) !== JSON.stringify(item.oldValue));
        item.isError = data.isError || false;
        item.cellClass = this.getDetailCellClass(item.isEditable, item.isEdited, item.isError);
        return item;
    }

    // ???????????????????????????????????????
    undoDetailItemEdit(item) {
        item.value = item.oldValue;
        item.label = item.oldLabel;
        item.text = this.getDetailText(item.value, item.label, item.type);
        item.url = this.getDetailUrl(item);
        item.isEdited = false;
        item.isError = false;
        item.cellClass = this.getDetailCellClass(item.isEditable, item.isEdited, item.isError);
        return item;
    }

    // ?????????????????????
    getDetailValue(value, type) {
        let ret = value;
        if (type === TYPE_TIME) {
            if (value !== null) {
                if (isNumber(value)) {
                    ret = new Intl.DateTimeFormat(LOCALE, {
                        hour: 'numeric'
                        , minute: 'numeric'
                        , second: 'numeric'
                        , timeZone: 'UTC'
                    }).format(new Date(value));
                }
            }
        } else if (type === TYPE_MULTIPICKLIST) {
            if (!isArray(ret)) {
                ret = (!ret ? [] : ret.split(';'));
            }
        }
        return ret;
    }

    // ?????????????????????????????????
    getDetailLabel(label, type) {
        let ret = label;
        if (type === TYPE_MULTIPICKLIST) {
            if (!isArray(ret)) {
                ret = (!ret ? [] : ret.split(';'));
            }
        }
        return ret;
    }

    // ??????????????????????????????
    getDetailSortValue(value, text, type) {
        let ret = null;
        if (
            type === TYPE_INTEGER ||
            type === TYPE_LONG ||
            type === TYPE_DOUBLE ||
            type === TYPE_CURRENCY ||
            type === TYPE_PERCENT
        ) {
            if (value !== null) {
                ret = stringToNumber(value);
            }
        } else if (
            type === TYPE_DATE ||
            type === TYPE_DATETIME
        ) {
            if (value !== null) {
                ret = new Date(value).getTime();
            }
        } else if (type === TYPE_TIME) {
            if (value !== null) {
                const arr = value.split(/[:.Z]/);
                const len = arr.length;
                const hour = (len < 1 ? 0 : (stringToNumber(arr[0]) || 0)) * 3600000;
                const minute = (len < 2 ? 0 : (stringToNumber(arr[1]) || 0)) * 60000;
                const second = (len < 3 ? 0 : (stringToNumber(arr[2]) || 0)) * 1000;
                const millisecond = (len < 4 ? 0 : (stringToNumber(arr[3]) || 0));
                return hour + minute + second + millisecond;
            }
        } else {
            ret = text;
        }
        return ret;
    }

    // ??????????????????????????????
    getDetailText(value, label, type) {
        let ret = null;
        if (type === TYPE_BOOLEAN) {
            if (value !== null) {
                ret = (value ? label_true : label_false);
            }
        } else if (
            type === TYPE_INTEGER ||
            type === TYPE_LONG ||
            type === TYPE_DOUBLE
        ) {
            if (value !== null) {
                ret = new Intl.NumberFormat(LOCALE, {
                    style: 'decimal',
                }).format(value);
            }
        } else if (type === TYPE_CURRENCY) {
            if (value !== null) {
                ret = new Intl.NumberFormat(LOCALE, {
                    style: 'currency',
                    currency: CURRENCY,
                    currencyDisplay: 'symbol'
                }).format(value);
            }
        } else if (type === TYPE_PERCENT) {
            if (value !== null) {
                ret = new Intl.NumberFormat(LOCALE, {
                    style: 'percent',
                }).format(value / 100);
            }
        } else if (type === TYPE_DATE) {
            if (value !== null) {
                ret = new Intl.DateTimeFormat(LOCALE, {
                    year: 'numeric'
                    , month: 'numeric'
                    , day: 'numeric'
                }).format(new Date(value));
            }
        } else if (type === TYPE_TIME) {
            if (value !== null) {
                const arr = value.split(/[:.Z]/);
                const len = arr.length;
                const hour = (len < 1 ? '00' : arr[0]);
                const minute = (len < 2 ? '00' : arr[1]);
                const second = (len < 3 ? '00' : arr[2]);
                const millisecond = (len < 4 ? '000' : arr[3]);
                ret = '';
                ret += (stringToNumber(hour) || 0);
                ret += ':' + minute;
                ret += ':' + second;
                if ((stringToNumber(millisecond) || 0) !== 0) {
                    ret += '.' + millisecond;
                }
            }
        } else if (type === TYPE_DATETIME) {
            if (value !== null) {
                ret = new Intl.DateTimeFormat(LOCALE, {
                    year: 'numeric'
                    , month: 'numeric'
                    , day: 'numeric'
                    , hour: 'numeric'
                    , minute: 'numeric'
                    , second: 'numeric'
                    , timeZone: TIME_ZONE
                }).format(new Date(value));
            }
        } else if (
            type === TYPE_REFERENCE ||
            type === TYPE_PICKLIST
        ) {
            ret = (label ? label : value);
        } else if (type === TYPE_MULTIPICKLIST) {
            if (isArray(label)) {
                ret = label.join();
            } else {
                ret = label;
            }
            if (!ret) {
                if (isArray(value)) {
                    ret = value.join();
                } else {
                    ret = value;
                }
            }
        } else {
            ret = value;
        }
        return ret;
    }

    // ?????????URL?????????
    getDetailUrl(item) {
        let ret = null;
        if (item.objectName === RISK_OBJECT.objectApiName) {
            if (item.fieldName === 'Name' && item.riskId) {
                ret = '/' + item.riskId;
            }
        } else if (item.objectName === CONTROL_OBJECT.objectApiName) {
            if (item.fieldName === 'Name' && item.value) {
                ret = '/' + item.value;
            }
        }
        return ret;
    }

    // ?????????????????????????????????
    getDetailCellClass(isEditable, isEdited, isError) {
        let ret = '';
        if (isEditable) {
            ret += 'slds-cell-edit';
            if (isError) {
                ret += ' is-error';
            } else {
                if (isEdited) {
                    ret += ' is-edited';
                }
            }
        }
        return ret;
    }

    // ?????????????????????????????????
    // 0:?????????1:?????????????????????????????????????????????2:??????????????????????????????
    getDetailInputMode(item) {
        let ret = 0;
        if (item.objectName === CONTROL_OBJECT.objectApiName) {
            if (item.fieldName === 'Name') {
                ret = 2;
            }
        }
        return ret;
    }

    // ??????????????????????????????????????????
    openDisplayFieldsSettingDialog() {
        const dialog = this.template.querySelector('[data-name="display-fields-setting-dialog"]');
        dialog.classList.remove('slds-hide');
        dialog.classList.add('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.add('slds-backdrop_open');
    }

    // ?????????????????????????????????????????????
    closeDisplayFieldsSettingDialog() {
        const dialog = this.template.querySelector('[data-name="display-fields-setting-dialog"]');
        dialog.classList.add('slds-hide');
        dialog.classList.remove('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.remove('slds-backdrop_open');
    }

    // ????????????????????????????????????
    openSearchConditionDialog() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        dialog.classList.remove('slds-hide');
        dialog.classList.add('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.add('slds-backdrop_open');
    }

    // ???????????????????????????????????????
    closeSearchConditionDialog() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        // ??????????????????????????????????????????????????????????????????????????????
        // ???????????????????????????????????????????????????????????????????????????????????????????????????????????????
        // ????????????slds-hide?????????????????????????????????????????????
        dialog.classList.add('slds-hide');
        dialog.classList.remove('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.remove('slds-backdrop_open');
    }

    handleOpenCommentApprovalDialog() {
        const dialog = this.template.querySelector('[data-name="display-comment-dialog"]');
        dialog.classList.remove('slds-hide');
        dialog.classList.add('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.add('slds-backdrop_open');
        this.checklist_count = this.template.querySelectorAll('input[name="approval-checkboxes"]:checked').length;
    }

    handleCloseCommentApprovalDialog() {
        const dialog = this.template.querySelector('[data-name="display-comment-dialog"]');
        dialog.classList.add('slds-hide');
        dialog.classList.remove('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.remove('slds-backdrop_open');
    }

    handleConfirmCommentApprovalDialog() {
        this.handleCloseCommentApprovalDialog();
        const dialog = this.template.querySelector('[data-name="display-submit-confirm-dialog"]');
        dialog.classList.remove('slds-hide');
        dialog.classList.add('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.add('slds-backdrop_open');
    }

     handleCloseConfirmApprovalDialog() {
        const dialog = this.template.querySelector('[data-name="display-submit-confirm-dialog"]');
        dialog.classList.add('slds-hide');
        dialog.classList.remove('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.remove('slds-backdrop_open');
    }

    // ????????????????????????
    async loadSearchCondition() {
        // ?????????????????????????????????
        const value = await getCustomFunctionSettingValue({
            functionType: label_functionType_risklist
            , settingType: label_settingType_searchCond
            , projectId: this.recordId
        });
        if (value) {
            const data = JSON.parse(value);
            const searchCond = data.searchCondition;
            if (searchCond) {
                if (searchCond.risk) {
                    const risk = searchCond.risk;
                    this.searchCondition.risk.isEnabled = risk.isEnabled || false;
                    this.searchCondition.risk.searchConds = risk.searchConds || null;
                    this.searchCondition.risk.searchCondLogic = risk.searchCondLogic || null;
                }
                if (searchCond.riskAssessment) {
                    const riskAss = searchCond.riskAssessment;
                    this.searchCondition.riskAssessment.isEnabled = riskAss.isEnabled || false;
                    this.searchCondition.riskAssessment.searchConds = riskAss.searchConds || null;
                    this.searchCondition.riskAssessment.searchCondLogic = riskAss.searchCondLogic || null;
                }
                if (searchCond.riskAssessmentClassi) {
                    const riskAssCls = searchCond.riskAssessmentClassi;
                    this.searchCondition.riskAssessmentClassi.isEnabled = riskAssCls.isEnabled || false;
                    if (riskAssCls.analyseTiming) {
                        const analyseTiming = riskAssCls.analyseTiming;
                        this.searchCondition.riskAssessmentClassi.analyseTiming.isEnabled = analyseTiming.isEnabled || false;
                        this.searchCondition.riskAssessmentClassi.analyseTiming.value = analyseTiming.value || null;
                    }
                    if (riskAssCls.probability) {
                        const probability = riskAssCls.probability;
                        this.searchCondition.riskAssessmentClassi.probability.isEnabled = probability.isEnabled || false;
                        this.searchCondition.riskAssessmentClassi.probability.value = probability.value || null;
                    }
                    if (riskAssCls.resultImpact) {
                        const resultImpact = riskAssCls.resultImpact;
                        this.searchCondition.riskAssessmentClassi.resultImpact.isEnabled = resultImpact.isEnabled || false;
                        this.searchCondition.riskAssessmentClassi.resultImpact.value = resultImpact.value || null;
                    }
                    if (riskAssCls.thirdEvaluation) {
                        const thirdEvaluation = riskAssCls.thirdEvaluation;
                        this.searchCondition.riskAssessmentClassi.thirdEvaluation.isEnabled = thirdEvaluation.isEnabled || false;
                        this.searchCondition.riskAssessmentClassi.thirdEvaluation.value = thirdEvaluation.value || null;
                    }
                }
                if (searchCond.control) {
                    const control = searchCond.control;
                    this.searchCondition.control.isEnabled = control.isEnabled || false;
                    this.searchCondition.control.searchConds = control.searchConds || null;
                    this.searchCondition.control.searchCondLogic = control.searchCondLogic || null;
                }
            }
        }
    }

    // ?????????????????????
    async saveSearchCondition() {
        const data = {
            searchCondition: this.searchCondition
        };
        const value = JSON.stringify(data);

        // ????????????????????????????????????
        await setCustomFunctionSettingValue({
            functionType: label_functionType_risklist
            , settingType: label_settingType_searchCond
            , projectId: this.recordId
            , settingValue: value
        });
    }

    handleOpenEditControlModal(event){
        this.editingControlId = event.currentTarget.dataset.control_id;
        this.isShowEditControlModal = true;
    }

    handleCloseEditControlModal(){
        this.editingControlId = null;
        this.isShowEditControlModal = false;
    }

    // Handle Status Change On Screen Flow
    async handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            this.editingControlId = null;
            this.isShowEditControlModal = false;
            this.isProcessing = true;
            this.errorMessages = null;
            try {
                // ???????????????????????????
                await this.loadRisklist();
                this.dispatchEvent(
                    new ShowToastEvent({
                        message: label_saveSuccess
                        , variant: 'success'
                    })
                );
            } catch (error) {
                this.errorMessages = getErrorMessages(error);
            }
            this.isProcessing = false;
        }
    }

    //Approval DAM-ERMT-21
    updateCheckbox() {
        var checkedBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]:checked');
        this.hasCheckedRow = checkedBoxes.length ? true : false;
    }

    handleClickAll(){
        var checkedBoxes = this.template.querySelectorAll('input[name="checkAll"]:checked');
        var childBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]');
        if (checkedBoxes.length == 1){
            for(var i=0; i<childBoxes.length; i++){
                childBoxes[i].checked = true;
            }
            this.hasCheckedRow = childBoxes.length ? true : false;
        } else {
            for(var i=0; i<childBoxes.length; i++){
                childBoxes[i].checked = false;
            }
            this.hasCheckedRow = false;
        }
    }

    handleClearAllCheckbox(){
        let checkedBoxes = this.template.querySelectorAll('input[name="checkAll"]:checked');
        if( checkedBoxes.length == 1) checkedBoxes[0].checked = false;

        let childBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]');
        for(let i = 0; i < childBoxes.length; i++){
            childBoxes[i].checked = false;
        }
        this.hasCheckedRow = false;
    }

    handleCommentChange(event) {
        this.comment = event.detail.value;
    }

    async handleApproval(){
        this.errorMessages = null;
        this.isProcessing = true;
        try {
           await this.multiApplyApproval();

           this.handleCloseConfirmApprovalDialog();
           this.handleClearAllCheckbox();

           await this.loadRisklist();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
   }

   async multiApplyApproval() {


        const listRiskId = [];
        var checkedBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]:checked');
        for(var i=0; i<checkedBoxes.length; i++){
            listRiskId.push(checkedBoxes[i].value);
        }
        let result = await multiApplyApproval({
            comment: this.comment,
            riskIds: listRiskId,
            projectId: this.recordId
        });
        if (result.isSuccess){
            const evt = new ShowToastEvent({
                title: this.label.approvalSubmit_complete,
                message: this.label.approvalSubmit_complete_detail +  this.label.approvalSubmit_complete_count + '???'+result.successCount+' ???' + this.label.approvalSubmit_incomplete_count +'???'+result.failCount,
                variant: 'success',
            });
            this.dispatchEvent(evt);
        } else {
            this.errorMessages = getErrorMessages(result.errorMessage);
        }
        return result;
    }
}