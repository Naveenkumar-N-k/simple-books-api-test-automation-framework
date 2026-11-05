import { test, expect } from '@playwright/test';
import { verifyStatusCodeandReturnJSON, readAPIClientData, verifyAPIClientDataStructure } from '../../utilities/basic-utils';
import { AuthenticationService } from '../../services/authentication';
import { APIClient } from '../../services/authentication';
import { Orders } from '../../services/orders';

test('register valid API client', async ({request}) => {
    const authenticationService = new AuthenticationService(request);

    // new client data
    const newClientNameAndEmail = authenticationService.validClientNameAndEmail();
    
    // existing client data
    const existingRegisteredClient = await readAPIClientData();
    verifyAPIClientDataStructure(existingRegisteredClient);
    const {clientName, clientEmail} = existingRegisteredClient
    const existingClientNameAndEmail = {clientName, clientEmail};
    
    // validating both client data
    authenticationService.validateClientNameAndEmail(newClientNameAndEmail); 
    authenticationService.validateClientNameAndEmail(existingClientNameAndEmail);
    
    // ensuring the new client data is unique
    expect(newClientNameAndEmail).not.toEqual(existingClientNameAndEmail);     
    
    // registering new API Client
    const requestBody = newClientNameAndEmail;
    const registerResponse = await authenticationService.registerAPIClient(requestBody)
    const registerResponseData = await verifyStatusCodeandReturnJSON(registerResponse, 201) as {accessToken: string};
    const newClient = {...newClientNameAndEmail, ...registerResponseData} satisfies APIClient;
    verifyAPIClientDataStructure(newClient);

    // verifying the newly registered client by one of the endpoints requiring authorization (/orders)
    const authorizationHeader = { 'Authorization': `Bearer ${newClient.accessToken}` };
    const ordersResponse = await request.get('/orders', { headers: authorizationHeader}) 
    const ordersResponseData = await verifyStatusCodeandReturnJSON(ordersResponse, 200) as Orders;
    expect(ordersResponseData).toHaveLength(0);
})

test('re-register existing API client', async ({request}) => {
    const authenticationService = new AuthenticationService(request);
    
    // existing client
    const {clientName, clientEmail} = await readAPIClientData();
    const existingClientNameAndEmail = {clientName, clientEmail};
    
    // re-registering the existing client
    const registerResponse = await authenticationService.registerAPIClient(existingClientNameAndEmail);
    const registerResponseData = await verifyStatusCodeandReturnJSON(registerResponse, 409) as {error: string};
    expect(registerResponseData.error).toBe('API client already registered. Try a different email.');
})