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
    @api recordId; // レコードID
    // ラベル
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

    errorMessages = null; // エラーメッセージリスト
    isProcessing = false; // 処理中
    isShowEditControlModal = false; // flags open/close edit ermt__Control__c modal
    isShowDisplayFieldSettingButton = true;
    @track editingControlId = null;
    isOriginalStyleRendered = false; // 独自スタイル描画済
    displayFieldName = this.defaultDisplayFieldName; // 表示項目名
    @track dispFieldNameTemp = this.defaultDisplayFieldName; // 表示項目名（一時保管）
    riskDisplayFieldNameSels = null; // リスク表示項目名選択リスト
    controlDisplayFieldNameSels = null; // 対応策表示項目名選択リスト
    searchCondition = this.defaultSearchCondition; // 検索条件
    @track searchCondTemp = this.defaultSearchCondition; // 検索条件（一時保管）
    windowHeight = window.innerHeight; // ウィンドウの高さ
    header1 = null; // ヘッダー1
    @track header2 = null; // ヘッダー2
    @track detail = null; // 明細
    @track detailRaw = null; // 明細（元データ）
    @track fixedHeaderTop = this.createFixedHeaderTop(); // 固定ヘッダ（上）
    isEditing = false; // 編集中
    editingCell = null; // 編集中のセル
    get riskObjectName() { return RISK_OBJECT.objectApiName; } // リスクオブジェクト名
    get controlObjectName() { return CONTROL_OBJECT.objectApiName; } // 対応策オブジェクト名
    get riskSearchCondClass() { return 'slds-section__content' + (this.searchCondTemp.risk.isEnabled ? '' : ' slds-hide'); } // リスク検索条件クラス
    get controlSearchCondClass() { return 'slds-section__content' + (this.searchCondTemp.control.isEnabled ? '' : ' slds-hide'); } // 対応策検索条件クラス

    //Approval
    hasCheckedRow = false;
    approvalStatusList = [];
    checklist_count = null;
    comment = null;

    // ページ情報
    @track pageInfo = {
        pageNumber: 1
        , lastPageNumber: 1
        , pageSize: 30
        , resultSize: 0
        , rowNumberOffset: 0
    };

    // 列幅情報
    columnWidthInfo = {
        col: null
        , width: null
        , clientX: null
    }

    // リスクリストラップスタイル
    get risklistWrapStyle() {
        const minHeight = 200;
        const marginHeight = (this.recordId ? 230 : 180);
        let maxHeight = this.windowHeight - marginHeight;
        if (maxHeight < minHeight) maxHeight = minHeight;
        return 'min-height:' + minHeight + 'px;max-height:' + maxHeight + 'px;';
    }

    // デフォルトの表示項目名
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

    // デフォルトの検索条件
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

    // 検索条件（一時保管）：リスク
    get searchCondTempRisk() {
        return {
            searchConds: this.searchCondTemp.risk.searchConds
            , searchCondLogic: this.searchCondTemp.risk.searchCondLogic
        };
    }

    // 検索条件（一時保管）：対応策
    get searchCondTempControl() {
        return {
            searchConds: this.searchCondTemp.control.searchConds
            , searchCondLogic: this.searchCondTemp.control.searchCondLogic
        };
    }

    // 先頭ページ有効
    get isFirstPageEnable() {
        return (this.pageInfo.pageNumber > 2);
    }

    // 最終ページ有効
    get isLastPageEnable() {
        return (this.pageInfo.pageNumber < (this.pageInfo.lastPageNumber - 1));
    }

    // 次ページ有効
    get isNextPageEnable() {
        return (this.pageInfo.pageNumber < this.pageInfo.lastPageNumber);
    }

    // 前ページ有効
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

    // 初期化時
    async connectedCallback() {
        this.isProcessing = true;
        try {
            // ウィンドウサイズ変更イベントの登録
            window.addEventListener('resize', () => {
                this.windowHeight = window.innerHeight;
            }, false);

            // 検索条件の読込みƠ
            this.isShowDisplayFieldSettingButton = await checkRiskManagerPermission();
            await this.loadSearchCondition();

            // リスク一覧の読込み
            await this.loadRisklist();
        } catch (error) {
            //console.log('error=' + JSON.stringify(error));
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // 画面描画時
    renderedCallback() {
        // 独自スタイル追加
        this.addOriginalStyle();
    }

    // メインのクリック時
    handleMainClick(event) {
        // 明細のセルの編集を終了する
        this.finishDetailCellEdit();
    }

    // 表示項目設定クリック時
    async handleDisplayFieldsSettingClick() {
        this.errorMessages = null;
        try {
            // リスク表示項目名選択リストの取得
            this.riskDisplayFieldNameSels = await getRiskDisplayFieldNameSels();

            // 対応策表示項目名選択リストの取得
            this.controlDisplayFieldNameSels = await getControlDisplayFieldNameSels();

            // リスク表示項目名リストのコピー
            this.dispFieldNameTemp.risk = [...this.displayFieldName.risk];

            // リスクアセスメント表示項目名リストのコピー
            this.dispFieldNameTemp.riskAssessment = [...this.displayFieldName.riskAssessment];

            // 対応策表示項目名リストのコピー
            this.dispFieldNameTemp.control = [...this.displayFieldName.control];

            // 表示項目設定ダイアログを開く
            this.openDisplayFieldsSettingDialog();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
    }

    // リスク表示項目名の変更時
    handleRiskDisplayFieldNameChange(event) {
        this.dispFieldNameTemp.risk = event.detail.value;
    }

    // 対応策表示項目名の変更時
    handleControlDisplayFieldNameChange(event) {
        this.dispFieldNameTemp.control = event.detail.value;
    }

    // 表示項目設定のキャンセルのクリック時
    handleDisplayFieldsSettingCancelClick() {
        // 表示項目設定ダイアログを閉じる
        this.closeDisplayFieldsSettingDialog();
    }

    // 表示項目設定のOKのクリック時
    async handleDisplayFieldsSettingOkClick() {
        // 入力チェック
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
            // リスク一覧表示項目名の保存
            await saveRisklistDisplayFieldName({
                projectId: this.recordId
                , fieldName : JSON.stringify(this.dispFieldNameTemp)
            });

            // 表示項目設定ダイアログを閉じる
            this.closeDisplayFieldsSettingDialog();

            // リスク一覧の読込み
            await this.loadRisklist();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // 検索条件のクリック時
    async handleSearchConditionClick() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        this.errorMessages = null;
        try {
            // 検索条件の復元
            // 検索条件有効
            this.searchCondTemp.risk.isEnabled = this.searchCondition.risk.isEnabled;
            this.searchCondTemp.riskAssessment.isEnabled = this.searchCondition.riskAssessment.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.isEnabled = this.searchCondition.riskAssessmentClassi.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled = this.searchCondition.riskAssessmentClassi.analyseTiming.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.probability.isEnabled = this.searchCondition.riskAssessmentClassi.probability.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled = this.searchCondition.riskAssessmentClassi.resultImpact.isEnabled;
            this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled = this.searchCondition.riskAssessmentClassi.thirdEvaluation.isEnabled;
            this.searchCondTemp.control.isEnabled = this.searchCondition.control.isEnabled;
1
            // リスクの検索条件
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
            // リスクアセスメントの検索条件
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
            // 対応策の検索条件
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

            // 分析タイミングの検索条件
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.analyseTiming.value = (
                    !this.searchCondition.riskAssessmentClassi.analyseTiming.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.analyseTiming.value]
                );
            }

            // 発生可能性の検索条件
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.probability.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.probability.value = (
                    !this.searchCondition.riskAssessmentClassi.probability.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.probability.value]
                );
            }

            // 結果影響度の検索条件
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.resultImpact.value = (
                    !this.searchCondition.riskAssessmentClassi.resultImpact.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.resultImpact.value]
                );
            }

            // 第三評価の検索条件
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled
            ) {
                this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.value = (
                    !this.searchCondition.riskAssessmentClassi.thirdEvaluation.value ?
                        null : [...this.searchCondition.riskAssessmentClassi.thirdEvaluation.value]
                );
            }

            // 検索条件ダイアログを開く
            this.openSearchConditionDialog();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
    }

    // リスク検索条件有効の変更時
    handleRiskSearchCondEnableChange(event) {
        this.searchCondTemp.risk.isEnabled = event.detail.checked;
    }

    // リスク検索条件の編集時
    handleRiskSearchCondEdit(event) {
        this.searchCondTemp.risk.searchConds = event.detail.searchConditions;
        this.searchCondTemp.risk.searchCondLogic = event.detail.searchConditionLogic;
    }


    // 対応策検索条件有効の変更時
    handleControlSearchCondEnableChange(event) {
        this.searchCondTemp.control.isEnabled = event.detail.checked;
    }

    // 対応策検索条件の編集時
    handleControlSearchCondEdit(event) {
        this.searchCondTemp.control.searchConds = event.detail.searchConditions;
        this.searchCondTemp.control.searchCondLogic = event.detail.searchConditionLogic;
    }

    // 検索条件のキャンセルのクリック時
    handleSearchConditionCancelClick() {
        // 検索条件ダイアログを閉じる
        this.closeSearchConditionDialog();
    }

    // 検索条件のOKのクリック時
    async handleSearchConditionOkClick() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        // 入力チェック
        let isValid = true;
        // リスクの検索条件
        if (this.searchCondTemp.risk.isEnabled) {
            const cmp = dialog.querySelector('[data-name="risk-serach-condition"]');
            if (cmp) {
                const result = await cmp.checkValidity();
                isValid = isValid && result;
            }
        }
        // リスクアセスメントの検索条件
        if (this.searchCondTemp.riskAssessment.isEnabled) {
            const cmp = dialog.querySelector('[data-name="riskAssessment-serach-condition"]');
            if (cmp) {
                const result = await cmp.checkValidity();
                isValid = isValid && result;
            }
        }
        // 対応策の検索条件
        if (this.searchCondTemp.control.isEnabled) {
            const cmp = dialog.querySelector('[data-name="control-serach-condition"]');
            if (cmp) {
                const result = await cmp.checkValidity();
                isValid = isValid && result;
            }
        }
        // 分析タイミングの検索条件
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
        // 発生可能性の検索条件
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
        // 結果影響度の検索条件
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
        // 第三評価の検索条件
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
            // 検索条件の保存
            // リスクの検索条件
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

            // リスクアセスメントの検索条件
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

            // 対応策の検索条件
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

            // 分析タイミングの検索条件
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.analyseTiming.value
            }
            this.searchCondition.riskAssessmentClassi.analyseTiming.value = searchConds;

            // 発生可能性の検索条件
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.probability.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.probability.value
            }
            this.searchCondition.riskAssessmentClassi.probability.value = searchConds;

            // 結果影響度の検索条件
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.resultImpact.value
            }
            this.searchCondition.riskAssessmentClassi.resultImpact.value = searchConds;

            // 第三評価の検索条件
            searchConds = null;
            if (
                this.searchCondTemp.riskAssessmentClassi.isEnabled &&
                this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled
            ) {
                searchConds = this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.value
            }
            this.searchCondition.riskAssessmentClassi.thirdEvaluation.value = searchConds;

            // 検索条件有効
            this.searchCondition.risk.isEnabled = this.searchCondTemp.risk.isEnabled;
            this.searchCondition.riskAssessment.isEnabled = this.searchCondTemp.riskAssessment.isEnabled;
            this.searchCondition.riskAssessmentClassi.isEnabled = this.searchCondTemp.riskAssessmentClassi.isEnabled;
            this.searchCondition.riskAssessmentClassi.analyseTiming.isEnabled = this.searchCondTemp.riskAssessmentClassi.analyseTiming.isEnabled;
            this.searchCondition.riskAssessmentClassi.probability.isEnabled = this.searchCondTemp.riskAssessmentClassi.probability.isEnabled;
            this.searchCondition.riskAssessmentClassi.resultImpact.isEnabled = this.searchCondTemp.riskAssessmentClassi.resultImpact.isEnabled;
            this.searchCondition.riskAssessmentClassi.thirdEvaluation.isEnabled = this.searchCondTemp.riskAssessmentClassi.thirdEvaluation.isEnabled;
            this.searchCondition.control.isEnabled = this.searchCondTemp.control.isEnabled;

            // 検索条件ダイアログを閉じる
            this.closeSearchConditionDialog();

            // リスク一覧の読込み
            await this.loadRisklist();
            this.handleClearAllCheckbox();

            // 検索条件の保存
            await this.saveSearchCondition();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // ページ移動クリック時
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

        // リスク一覧の明細のページング
        let detailParPage = this.pagingRisklistDetail(this.detailRaw);
        // リスク一覧の明細のグループ化
        let detail = this.groupingRisklistDetail(detailParPage);

        this.detail = detail;
        this.handleClearAllCheckbox();
    }

    // 列ソートのクリック時
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

        // ヘッダ2の設定
        this.header2.forEach((cell, index) => {
            if (col === index) {
                cell.cellClass = this.getHeader2CellClass(isAscending, true);
            } else {
                cell.cellClass = this.getHeader2CellClass(true, false);
            }
        });

        // 明細のソート
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

        // 行番号の振り直し
        this.detailRaw.forEach((rec, index) => {
            rec.forEach(cell => {
                cell.row = index;
            });
        });

        // リスク一覧の明細のページング
        const detailParPage = this.pagingRisklistDetail(this.detailRaw);
        // リスク一覧の明細のグループ化
        const detail = this.groupingRisklistDetail(detailParPage);

        this.detail = detail;
        this.handleClearAllCheckbox();
    }

    // 列幅のマウスダウン時
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

    // 列幅のマウス移動時
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

    // 列幅のマウスアップ時
    handleColumnWidthMouseup(event) {
        this.columnWidthInfo.col = null;
    }

    // リスク一覧ラップのスクロール時
    handleRisklistWrapScroll(event) {
        const target = event.target;

        // 固定ヘッダ（上）の作成
        this.fixedHeaderTop = this.createFixedHeaderTop(target);
    }

    // 編集のクリック時
    handleEditClick(event) {
        event.stopPropagation();

        // 明細のセルの編集を終了する
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

    // 編集ポップオーバーのクリック時
    handleEditPopoverClick(event) {
        event.stopPropagation();
    }

    // 編集ポップオーバーの閉じるのクリック時
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

    // 値の変更時
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

        // エラーチェック
        event.target.reportValidity();
        const isError = !event.target.checkValidity();

        // 明細の項目の編集
        this.editDetailItem(item, {
            value: value
            , label: label
            , isError: isError
        });

        this.isEditing = true;
        this.handleClearAllCheckbox();
    }

    // 編集のキャンセルのクリック時
    handleEditCancelClick() {
        // 明細の編集を元に戻す
        this.undoDetailEdit();
        this.errorMessages = null;
    }

    // 編集の保存のクリック時
    async handleEditSaveClick() {
        // 明細のエラーチェック
        if (!this.checkDetailError()) return;

        this.isProcessing = true;
        this.errorMessages = null;
        try {
            // 明細の編集を保存
            await this.saveDetailEdit();

            // リスク一覧の読込み
            await this.loadRisklist();
        } catch (error) {
            this.errorMessages = getErrorMessages(error);
        }
        this.isProcessing = false;
    }

    // エラーアラートの閉じるのクリック時
    handleErrorAlertCloseClick() {
        this.errorMessages = null;
    }

    // 独自スタイル追加
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

    // 固定ヘッダ（上）の作成
    createFixedHeaderTop(target) {
        let style = '';
        if (target) {
            style = (target.scrollTop > 0 ? 'top:' + target.scrollTop + 'px;' : '');
        }
        return {
            style: style
        };
    }

    // リスク一覧の読込み
    async loadRisklist() {

        this.approvalStatusList = await getApprovalStatusSetting();
        // リスクアセスメントの編集権限の取得
        //const isRiskAssessAllEditable = await checkRiskAssessmentEditPermission();

        // リスク一覧表示項目名の取得
        let displayFieldName = await getRisklistDisplayFieldName({
            projectId: this.recordId
        });
        displayFieldName = !displayFieldName ? null : JSON.parse(displayFieldName);
        this.displayFieldName = displayFieldName || this.defaultDisplayFieldName;
        //console.log('displayFieldName=' + JSON.stringify(this.displayFieldName));

        // リスク項目説明マップの取得
        const riskFieldDescByName = await getRiskFieldDescByName({
            dispFieldNames: this.displayFieldName.risk
        });
        //console.log('riskFieldDescByName=' + JSON.stringify(riskFieldDescByName));

        // 対応策項目説明マップの取得
        const controlFieldDescByName = await getControlFieldDescByName({
            dispFieldNames : this.displayFieldName.control
        });
        //console.log('controlFieldDescByName=' + JSON.stringify(controlFieldDescByName));

        // リスクリストの取得
        const risks = await this.getRisks({
            projectId: this.recordId
            , dispFieldNames: this.displayFieldName.risk
            , searchConds: this.searchCondition.risk.searchConds
            , searchCondLogic: this.searchCondition.risk.searchCondLogic
        });
        // console.log('risks=' + JSON.stringify(risks));

        // 対応策リストマップの取得
        const controlsByRiskId = await this.getControlsByRiskId({
            projectId: this.recordId
            , dispFieldNames: this.displayFieldName.control
            , searchConds: this.searchCondition.control.searchConds
            , searchCondLogic: this.searchCondition.control.searchCondLogic
        });

        //console.log('controlsByRiskId=' + JSON.stringify(controlsByRiskId));

        // リスク一覧のヘッダの作成
        const header1 = [];
        const header2 = [];
        let colspan;
        let row;
        let col;

        // リスク
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

        // 対応策
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

        // リスク一覧の明細の作成
        const detailRaw = [];
        row = -1;
        risks.forEach(risk => {
            const riskId = risk.Id;
            const riskApprovalStatus = risk.ermt__ApprovalStatus__c;
            let isApprovalRisk = [...this.approvalStatusList].includes(riskApprovalStatus) ? false : true;
            const controls = controlsByRiskId[riskId];

            // 対象の取得
            let isTarget = true;
            if (this.searchCondition.control.searchConds) {
                if (!controls || controls.length === 0) {
                    isTarget = false;
                }
            }

            if (isTarget) {
                // リスク関連最大数の取得
                let relationMax = 1;
                if (controls) {
                    relationMax = (relationMax < controls.length ? controls.length : relationMax);
                }

                // 明細の作成
                // リスク
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
                            , isEditable: (!isRiskEditable || isApprovalRisk || fieldName === 'RecordTypeId' || fieldName === 'ermt__ApprovalStatus__c' || isIncidentLinksField ? false : fieldDesc.isUpdateable)
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

                    // リスク
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

                    // 対応策
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
                                    , fieldName:　fieldName
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

        // リスク一覧の明細のページング
        const detailParPage = this.pagingRisklistDetail(detailRaw);
        // リスク一覧の明細のグループ化
        const detail = this.groupingRisklistDetail(detailParPage);

        this.header1 = header1;
        this.header2 = header2;
        this.detailRaw = detailRaw;
        this.detail = detail;
        this.isEditing = false;
    }

    // リスクリストの取得（ガバナ制限対応のため、分割して取得）
    async getRisks(param) {
        let ret = [];
        let lastId = null;
        let lastRiskNo = null;
        let result;
        do {
            // リスクリストの取得
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

    // 対応策リストマップの取得（ガバナ制限対応のため、分割して取得）
    async getControlsByRiskId(param) {
        const ret = {};
        let lastId = null;
        let lastName = null;
        let result;
        do {
            // 対応策リストマップの取得
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

    // リスク一覧の明細のページング
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

    // リスク一覧の明細のグループ化
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

            // リスクIDの取得
            let riskId = null;
            if (rec.length > 0) {
                const cell = rec[0];
                riskId = cell.item.riskId;
            }

            // リスク変更有りの取得
            isRiskChange = (index === 0 || riskId !== riskIdTemp);
            riskIdTemp = riskId;
            if (isRiskChange) {
                riskCnt++;
                // 変更前リスクのグループ化行数をセット
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

            // 行クラスのセット
            newRec.rowClass = 'slds-hint-parent' + (riskCnt % 2 === 1 ? '' : ' striped');

            // 新レコードにセルを追加
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

        // リスクのグループ化行数をセット
        if (riskCells.length > 0) {
            riskCells.forEach(cell => {
                cell.rowspan = rowspan;
            });
        }
        //console.log('detail=' + JSON.stringify(detail));

        return detail;
    }

    // デフォルトの列幅スタイルの取得
    getDefaultColumnWidthStyle(type) {
        console.log("🌻PQ__ __ file: dam_ProjectRisklistApproval.js:1391 __ Dam_ProjectRisklistApproval __ getDefaultColumnWidthStyle __ type", type)
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

    // ヘッダのテキストの取得
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

    // ヘッダ2のセルクラスの取得
    getHeader2CellClass(isAscending, isSorted) {
        let ret = 'slds-is-resizable slds-is-sortable';
        ret += (isAscending ? ' slds-is-sorted_asc' : ' slds-is-sorted_desc');
        if (isSorted) {
            ret += ' slds-is-sorted';
        }
        return ret;
    }

    // 明細の編集を元に戻す
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

    // 明細の編集を保存
    async saveDetailEdit() {
        // 編集済のリストを作成
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
                        // 追加済みでないリスクを追加する
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

        // リスク関連の更新
        await updateRiskRelation({
            risks: risks
            , riskAssessments: riskAssessments
            , riskAssessmentClassis: riskAssessmentClassis
            , riskControls: riskControls
        });

        this.isEditing = false;

        // トーストの表示
        this.dispatchEvent(
            new ShowToastEvent({
                message: label_saveSuccess
                , variant: 'success'
            })
        );
    }

    // 明細のエラーチェック
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

    // 明細のセルの編集を終了する
    finishDetailCellEdit() {
        if (this.editingCell) {
            this.editingCell.isEditing = false;
            this.editingCell = null;
        }
    }

    // 明細の項目の作成
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

    // 明細の項目の編集
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

    // 明細の項目の編集を元に戻す
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

    // 明細の値の取得
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

    // 明細の表示ラベルの取得
    getDetailLabel(label, type) {
        let ret = label;
        if (type === TYPE_MULTIPICKLIST) {
            if (!isArray(ret)) {
                ret = (!ret ? [] : ret.split(';'));
            }
        }
        return ret;
    }

    // 明細のソート値の取得
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

    // 明細のテキストの取得
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

    // 明細のURLの取得
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

    // 明細のセルクラスの取得
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

    // 明細の入力モードの取得
    // 0:通常、1:リスクアセスメント分類の分類、2:リスク対応策の対応策
    getDetailInputMode(item) {
        let ret = 0;
        if (item.objectName === CONTROL_OBJECT.objectApiName) {
            if (item.fieldName === 'Name') {
                ret = 2;
            }
        }
        return ret;
    }

    // 表示項目設定ダイアログを開く
    openDisplayFieldsSettingDialog() {
        const dialog = this.template.querySelector('[data-name="display-fields-setting-dialog"]');
        dialog.classList.remove('slds-hide');
        dialog.classList.add('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.add('slds-backdrop_open');
    }

    // 表示項目設定ダイアログを閉じる
    closeDisplayFieldsSettingDialog() {
        const dialog = this.template.querySelector('[data-name="display-fields-setting-dialog"]');
        dialog.classList.add('slds-hide');
        dialog.classList.remove('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.remove('slds-backdrop_open');
    }

    // 検索条件ダイアログを開く
    openSearchConditionDialog() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        dialog.classList.remove('slds-hide');
        dialog.classList.add('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.add('slds-backdrop_open');
    }

    // 検索条件ダイアログを閉じる
    closeSearchConditionDialog() {
        const dialog = this.template.querySelector('[data-name="search-condition-dialog"]');
        // モーダル内のセクションを開くと、モーダルを閉じても、
        // 見えないセクションが前面に表示されて、リンクをクリックなどができないため、
        // 非表示（slds-hide）の切り替えを追加しています。
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

    // 検索条件の読込み
    async loadSearchCondition() {
        // カスタム機能設定の取得
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

    // 検索条件の保存
    async saveSearchCondition() {
        const data = {
            searchCondition: this.searchCondition
        };
        const value = JSON.stringify(data);

        // カスタム機能設定のセット
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
                // リスク一覧の読込み
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
                message: this.label.approvalSubmit_complete_detail +  this.label.approvalSubmit_complete_count + '：'+result.successCount+' 、' + this.label.approvalSubmit_incomplete_count +'：'+result.failCount,
                variant: 'success',
            });
            this.dispatchEvent(evt);
        } else {
            this.errorMessages = getErrorMessages(result.errorMessage);
        }
        return result;
    }
}