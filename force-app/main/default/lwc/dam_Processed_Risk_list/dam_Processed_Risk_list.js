import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import LOCALE from '@salesforce/i18n/locale';
import CURRENCY from '@salesforce/i18n/currency';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import label_title from '@salesforce/label/ermt.ProjectRisklist_Title';
import label_risk from '@salesforce/label/ermt.ObjectLabel_Risk';
import label_control from '@salesforce/label/ermt.ObjectLabel_Control';
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
import label_true from '@salesforce/label/ermt.Value_True';
import label_false from '@salesforce/label/ermt.Value_False';
import label_referToTheSameControl from '@salesforce/label/c.ProjectRisklist_ReferToTheSameControl';
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
import getRisklistDisplayFieldName from '@salesforce/apex/DAM_ProjectRisklistCtlr.getRisklistDisplayFieldName';
import getRiskFieldDescByName from '@salesforce/apex/DAM_ProjectRisklistCtlr.getRiskFieldDescByName';
import getControlFieldDescByName from '@salesforce/apex/DAM_ProjectRisklistCtlr.getControlFieldDescByName';
import getRisks from '@salesforce/apex/DAM_Processed_Risk_List_Ctlr.getRisks';
import getControlsByRiskId from '@salesforce/apex/DAM_ProjectRisklistCtlr.getControlsByRiskId';
import getApprovalAssignById from '@salesforce/apex/DAM_BulkApproval.getApprovalAssignById';

export default class Dam_Processed_Risk_list extends LightningElement {
    @api recordId; // レコードID
    @api listType;
    // ラベル
    label = {
        title: label_title
        , risk: label_risk
        , control: label_control
        , list_number: label_list_number
        , list_page: label_list_page
        , list_first: label_list_first
        , list_last: label_list_last
        , list_next: label_list_next
        , list_previous: label_list_previous
        , riskLabel: ''
    };

    errorMessages = null; // エラーメッセージリスト
    isProcessing = false; // 処理中
    isOriginalStyleRendered = false; // 独自スタイル描画済
    displayFieldName = this.defaultDisplayFieldName; // 表示項目名
    windowHeight = window.innerHeight; // ウィンドウの高さ
    header1 = null; // ヘッダー1
    @track header2 = null; // ヘッダー2
    @track detail = null; // 明細
    @track detailRaw = null; // 明細（元データ）
    @track fixedHeaderTop = this.createFixedHeaderTop(); // 固定ヘッダ（上）
    get riskObjectName() { return RISK_OBJECT.objectApiName; } // リスクオブジェクト名
    get controlObjectName() { return CONTROL_OBJECT.objectApiName; } // 対応策オブジェクト名

    //Approval
    hasCheckedRow = false;
    checklist_count = null;
    approvalAssignInfo;

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

    @wire(getObjectInfo, { objectApiName: RISK_OBJECT })
    riskInfo({ data, error }) {
        if (data) this.label.riskLabel = data.label;
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

    // 初期化時
    async connectedCallback() {
        this.isProcessing = true;
        try {
            this.approvalAssignInfo = await getApprovalAssignById({ recordId: this.recordId });
            // ウィンドウサイズ変更イベントの登録
            window.addEventListener('resize', () => {
                this.windowHeight = window.innerHeight;
            }, false);

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
            const cell1 = rec1[ col ];
            const cell2 = rec2[ col ];
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
        const cell = this.header2[ col ];
        if (cell) {
            cell.colWidthStyle = 'width:' + width + 'px';
        }
        this.detailRaw.forEach(rec => {
            const cell = rec[ col ];
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

        // リスク一覧表示項目名の取得
        let displayFieldName = await getRisklistDisplayFieldName({
            projectId: this.approvalAssignInfo.Project__c
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
            dispFieldNames: this.displayFieldName.control
        });
        //console.log('controlFieldDescByName=' + JSON.stringify(controlFieldDescByName));

        // リスクリストの取得
        const risks = await this.getRisks({
            approvalAssignId: this.recordId
            , approvalAssignProjectId: this.approvalAssignInfo.Project__c
            , approvalAssignOrgId: this.approvalAssignInfo.Organization__c
            , dispFieldNames: this.displayFieldName.risk
            , searchConds: null
            , searchCondLogic: null
        });

        // console.log('risks=' + JSON.stringify(risks));

        // 対応策リストマップの取得
        const controlsByRiskId = await this.getControlsByRiskId({
            projectId: this.approvalAssignInfo.Project__c
            , dispFieldNames: this.displayFieldName.control
            , searchConds: null
            , searchCondLogic: null
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
            const fieldDesc = riskFieldDescByName[ fieldName ];
            if (fieldDesc) {
                col++;
                colspan++;
                header2.push({
                    text: this.getHeaderText(fieldDesc.label, fieldDesc.type)
                    , helpText: fieldDesc.helpText
                    , col: col
                    , colWidthStyle: this.getDefaultColumnWidthStyle(fieldDesc.type)
                    , cellClass: this.getHeader2CellClass(true, false)
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
            const fieldDesc = controlFieldDescByName[ fieldName ];
            if (fieldDesc) {
                col++;
                colspan++;
                header2.push({
                    text: (fieldName == 'Total_Of_Risk_Control_Junctions__c') ? label_referToTheSameControl : this.getHeaderText(fieldDesc.label, fieldDesc.type)
                    , helpText: fieldDesc.helpText
                    , col: col
                    , colWidthStyle: this.getDefaultColumnWidthStyle(fieldDesc.type)
                    , cellClass: this.getHeader2CellClass(true, false)
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
            const controls = controlsByRiskId[ riskId ];

            // 対象の取得
            let isTarget = true;
            if (!controls || controls.length === 0) {
                isTarget = false;
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
                this.displayFieldName.risk.forEach(fieldName => {
                    const fieldDesc = riskFieldDescByName[ fieldName ];
                    if (fieldDesc) {
                        let name = fieldName;
                        const value = undefineToNull(risk[ name ]);
                        name = fieldName + '_Label';
                        const label = undefineToNull(risk[ name ]);
                        let isIncidentLinksField = (fieldName === 'ermt__Incident_Links__c') ? true : false;
                        riskItems.push(this.createDetailItem({
                            value: value
                            , label: label
                            , type: fieldDesc.type
                            , recordTypeId: risk[ 'RecordTypeId' ]
                            , isIncidentLinksField: isIncidentLinksField
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
                            , item: item
                        });
                    });

                    // 対応策
                    let control = null;
                    if (controls && i < controls.length) {
                        control = controls[ i ];
                        const riskControlJuncs = control.RiskControlJuncs;
                    }
                    this.displayFieldName.control.forEach(fieldName => {
                        const fieldDesc = controlFieldDescByName[ fieldName ];
                        if (fieldDesc) {
                            let value = null;
                            let label = null;
                            let type = null;
                            let riskControlId = null;
                            if (control) {
                                if (fieldName === 'Name') {
                                    value = undefineToNull(control.Id);
                                    label = undefineToNull(control[ fieldName ]);
                                    type = TYPE_REFERENCE;
                                    riskControlId = control.riskControlId;
                                } else if (fieldName === 'Total_Of_Risk_Control_Junctions__c') {
                                    value = undefineToNull(control[ fieldName ]) >= 2 ? true : null;
                                    label = value;
                                    type = TYPE_BOOLEAN;
                                } else {
                                    let name = fieldName;
                                    value = undefineToNull(control[ name ]);
                                    name = fieldName + '_Label';
                                    label = undefineToNull(control[ name ]);
                                    type = fieldDesc.type;
                                }
                            } else {
                                if (fieldName === 'Name') {
                                    type = TYPE_REFERENCE;
                                }
                            }
                            col++;
                            rec.push({
                                row: row
                                , col: col
                                , colWidthStyle: this.getDefaultColumnWidthStyle(type)
                                , rowspan: 1
                                , item: this.createDetailItem({
                                    value: value
                                    , label: label
                                    , type: type
                                    , recordTypeId: null
                                    , objectName: CONTROL_OBJECT.objectApiName
                                    , fieldName: fieldName
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
                approvalAssignId: param.approvalAssignId
                , approvalAssignProjectId: param.approvalAssignProjectId
                , approvalAssignOrgId: param.approvalAssignOrgId
                , dispFieldNames: param.dispFieldNames
                , searchConds: param.searchConds
                , searchCondLogic: param.searchCondLogic
                , previousLastId: lastId
                , previousLastRiskNo: lastRiskNo
                , displayType: this.listType
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
                let controls = ret[ riskId ];
                if (!controls) controls = [];
                ret[ riskId ] = controls.concat(result.data[ riskId ]);
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
                , riskId: rec[ 0 ].item.riskId
                , cells: []
            };

            // リスクIDの取得
            let riskId = null;
            if (rec.length > 0) {
                const cell = rec[ 0 ];
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
        let ret = 'width:200px;';
        if (type === null) {
            ret = 'width:auto;';
        } else if (type === TYPE_BOOLEAN) {
            ret = 'width:100px;';
        } else if (
            type === TYPE_INTEGER ||
            type === TYPE_LONG ||
            type === TYPE_DOUBLE ||
            type === TYPE_CURRENCY ||
            type === TYPE_PERCENT ||
            type === TYPE_DATE ||
            type === TYPE_TIME
        ) {
            ret = 'width:120px;';
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

    // 明細の項目の作成
    createDetailItem(data) {
        const item = {
            type: data.type
            , objectName: data.objectName
            , fieldName: data.fieldName
            , riskId: data.riskId
            , recordTypeId: data.recordTypeIdG
        };
        if ('riskControlId' in data) {
            item.riskControlId = data.riskControlId;
        }
        if ('isIncidentLinksField' in data) {
            item.isIncidentLinksField = data.isIncidentLinksField;
        }
        item.value = this.getDetailValue(data.value, item.type);
        item.oldValue = item.value;
        item.label = this.getDetailLabel(data.label, item.type);
        item.oldLabel = item.label;
        item.text = this.getDetailText(item.value, item.label, item.type);
        item.url = this.getDetailUrl(item);
        const inputMode = this.getDetailInputMode(item);
        item.isInputModeNormal = (inputMode === 0);
        item.isInputModeRiskAssessClassi = (inputMode === 1);
        item.isInputModeControl = (inputMode === 2);
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
                const hour = (len < 1 ? 0 : (stringToNumber(arr[ 0 ]) || 0)) * 3600000;
                const minute = (len < 2 ? 0 : (stringToNumber(arr[ 1 ]) || 0)) * 60000;
                const second = (len < 3 ? 0 : (stringToNumber(arr[ 2 ]) || 0)) * 1000;
                const millisecond = (len < 4 ? 0 : (stringToNumber(arr[ 3 ]) || 0));
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
                const hour = (len < 1 ? '00' : arr[ 0 ]);
                const minute = (len < 2 ? '00' : arr[ 1 ]);
                const second = (len < 3 ? '00' : arr[ 2 ]);
                const millisecond = (len < 4 ? '000' : arr[ 3 ]);
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

    handleCloseConfirmApprovalDialog() {
        const dialog = this.template.querySelector('[data-name="display-submit-confirm-dialog"]');
        dialog.classList.add('slds-hide');
        dialog.classList.remove('slds-fade-in-open');
        const backdrop = this.template.querySelector('[data-name="dialog-backdrop"]');
        backdrop.classList.remove('slds-backdrop_open');
    }

    //Approval DAM-ERMT-21
    updateCheckbox() {
        var checkedBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]:checked');
        this.hasCheckedRow = checkedBoxes.length ? true : false;
    }

    handleClickAll() {
        var checkedBoxes = this.template.querySelectorAll('input[name="checkAll"]:checked');
        var childBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]');
        if (checkedBoxes.length == 1) {
            for (var i = 0; i < childBoxes.length; i++) {
                childBoxes[ i ].checked = true;
            }
            this.hasCheckedRow = childBoxes.length ? true : false;
        } else {
            for (var i = 0; i < childBoxes.length; i++) {
                childBoxes[ i ].checked = false;
            }
            this.hasCheckedRow = false;
        }
    }

    handleClearAllCheckbox() {
        let checkedBoxes = this.template.querySelectorAll('input[name="checkAll"]:checked');
        if (checkedBoxes.length == 1) checkedBoxes[ 0 ].checked = false;

        let childBoxes = this.template.querySelectorAll('input[name="approval-checkboxes"]');
        for (let i = 0; i < childBoxes.length; i++) {
            childBoxes[ i ].checked = false;
        }
        this.hasCheckedRow = false;
    }
}