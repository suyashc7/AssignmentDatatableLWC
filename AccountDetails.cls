/*
 * Name : Suyash Chiplunkar
 * Description : To retrieve account records
 */

public with sharing class AccountDetails {

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Id, Name, Owner.Name, Phone, Website, AnnualRevenue, Industry
            FROM Account
            WHERE Industry = 'Financial Services'
            WITH SECURITY_ENFORCED
        ];
    }
}