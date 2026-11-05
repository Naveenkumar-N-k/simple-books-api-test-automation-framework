import { expect, APIResponse } from "@playwright/test";
import process from 'node:process';
import { APIClient } from "../services/authentication";

// helpers
export const throwingError = (message:string) => { throw new Error(message) }; 

export async function verifyStatusCodeandReturnJSON(response:APIResponse, expectedStatusCode:number):Promise<unknown>{
    expect(response.status()).toBe(expectedStatusCode); 
    if (response.status() !== 204) { return await response.json() }
};

export function verifyAPIClientDataStructure(client:APIClient):void{
    expect(client).toEqual({
        clientName:expect.any(String),
        clientEmail:expect.any(String),
        accessToken:expect.any(String),
    })
};

export async function readAPIClientData():Promise<APIClient>{
    const existingRegisteredClient = {
        clientName: process.env.CLIENT_NAME,
        clientEmail: process.env.CLIENT_EMAIL,
        accessToken: process.env.ACCESS_TOKEN
    } as APIClient
    verifyAPIClientDataStructure(existingRegisteredClient);
    return existingRegisteredClient;
};

export async function getAccessToken():Promise<string>{
    const clientData = await readAPIClientData();
    return clientData.accessToken;
}

export async function authorizationHeader():Promise<{'Authorization':string}>{
    return { 'Authorization': `Bearer ${await getAccessToken()}` }
}