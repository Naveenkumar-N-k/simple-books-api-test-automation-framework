import { expect } from "@playwright/test";
import { APIRequestContext } from "@playwright/test";
import { randomCustomerName as randomClientName } from "./orders";

type RequestBodyForRegisteringAPIClient = {
    clientName: string,
    clientEmail: string,
};

export type APIClient = RequestBodyForRegisteringAPIClient & {accessToken:string};

export class AuthenticationService{
    constructor(private request:APIRequestContext){}
    async registerAPIClient(requestBody:RequestBodyForRegisteringAPIClient){
        return await this.request.post('/api-clients', {data:requestBody})
    }
    
    validClientNameAndEmail():RequestBodyForRegisteringAPIClient{
        const clientNameIs = randomClientName()
        const [clientName, clientEmail] = [clientNameIs, clientNameIs.split(' ').join('_') + '@gmail.com'];
        return {clientName, clientEmail};
    }
    
    validateClientNameAndEmail({clientName, clientEmail}:RequestBodyForRegisteringAPIClient):void{
        expect(clientName).toMatch(/^[a-zA-Z_\d\s]{2,40}$/);                    // Like • Test user ####
        expect(clientEmail).toMatch(/^\w{2,40}@[a-zA-Z]{2,15}\.com$/)           // Like • Test_user_####@gmail.com 
    }
}