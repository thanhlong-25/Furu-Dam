public with sharing class CopyAccountCtlr {
	@AuraEnabled
	public static Id copyAccount(String recordId) {
		try {
			String labelCustom = String.valueOf(System.Label.Label_CopyAccount);
			SobjectCloneUtils cloner = new SobjectCloneUtils(
				(Id) recordId,
				new Map<String, String>{
					// ermt__incident__c
					'ERMT__INCIDENTS__R' => 'INTEGRATEDRECORD__R',
					//ermt__risk__c
					'ERMT__RISKORGANIZATION__R' => 'ERMT__RISKPROFILE__R',
					// ermt_Control__c
					'ERMT__TREATMENTASSIGNEDORG__R' => ''
				}
			);
			cloner.addlookupFieldsMap('INTEGRATEDRECORD__R', 'INTEGRATEDRECORD__C');
			cloner.addlookupFieldsMap('ERMT__RISKPROFILE__R', 'ERMT__RISKPROFILE__C');

			Account beforeCloneAccount = (Account) cloner.clone;
			beforeCloneAccount.Name = beforeCloneAccount.Name + labelCustom;

			return cloner.save();
		} catch (Exception e) {
			throw new AuraHandledException('Error Copy Account ' + e.getMessage());
		}
	}
}