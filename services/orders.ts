import { expect } from "@playwright/test";
import { APIRequestContext, APIResponse } from "@playwright/test";
import { authorizationHeader, throwingError, verifyStatusCodeandReturnJSON } from "../utilities/basic-utils";
import { Book } from "./books";

export type submitOrderRequestBody = {
    bookId: number,
    customerName: string,
}
export type OrderSubmissionResponse = {
    created: boolean,
    orderId: string
};
export type Orders = {
    id: string,
    bookId: number,
    customerName: string,
}[];

export const randomCustomerName = () => `Test user ${String(Math.floor(Math.random()*10000)).padStart(4, '0')}`;

export class OrdersService{
    constructor(private request:APIRequestContext){}
    
    // Service
    async submitOrder(requestBody?:submitOrderRequestBody, invalidAuthorizationHeader?: null | {'Authorization':string}):Promise<APIResponse>{
        const header = await authorizationHeader();
        if (invalidAuthorizationHeader) { return await this.request.post('/orders', { headers:invalidAuthorizationHeader, data:requestBody }) }
        if (invalidAuthorizationHeader === null) { return await this.request.post('/orders', { data:requestBody }) }
        if (!requestBody) { return await this.request.post('/orders', { headers:header }) }
        return await this.request.post('/orders', { headers:header, data:requestBody })
    }

    async getOrders(authorizationHeaderIs?:null):Promise<APIResponse> { 
        if (authorizationHeaderIs === null){ return await this.request.get('/orders') }
        const header = await authorizationHeader();
        return await this.request.get('/orders', { headers:header });
    }

    async getSpecificOrder(orderId:string, authorizationHeaderIs?:null):Promise<APIResponse> { 
        if (authorizationHeaderIs === null) { return await this.request.get(`orders/${orderId}`) }
        const header = await authorizationHeader();
        return await this.request.get(`orders/${orderId}`, { headers:header }) 
    }

    async modifySpecificOrder(orderId:string, requestBody:{ customerName:string }, authorizationHeaderIs?:null):Promise<APIResponse>{
        if (authorizationHeaderIs === null) { return await this.request.patch(`orders/${orderId}`, { data:requestBody }) }        
        const header = await authorizationHeader();
        return await this.request.patch(`orders/${orderId}`, { headers:header, data:requestBody })
    }

    async deleteSpecificOrder(orderId:string, authorizationHeaderIs?:null):Promise<APIResponse>{
        if (authorizationHeaderIs === null) { return await this.request.delete(`orders/${orderId}`) }
        const header = await authorizationHeader();
        return await this.request.delete(`orders/${orderId}`, { headers:header })
    }

    // Helpers
    private validateRequestBodyForOrdering({bookId, customerName}:submitOrderRequestBody){
        expect(String(bookId)).toMatch(/^[1-6]$/);                      // Allowed: 1 ←→ 6 (both, inclusive)
        expect(customerName).toMatch(/^[a-zA-Z\s]{2,40} \d{4}$/);       // like • 'Test user 1542'
    }
    
    async validOrderingData():Promise<submitOrderRequestBody>{
        const listOfBooks = await this.request.get('/books');
        const listOfBooksData = await verifyStatusCodeandReturnJSON(listOfBooks, 200) as Book[];
        const availableBooks = listOfBooksData.filter(book => book.available)
        
        const randomBookId = availableBooks[Math.floor(Math.random()*availableBooks.length)].id;
        const orderingBookData = {
            bookId: randomBookId,
            customerName: randomCustomerName(),
        } satisfies submitOrderRequestBody;
        this.validateRequestBodyForOrdering(orderingBookData);
        return orderingBookData;
    }
    
    ensuringNoDuplicateOrders(orders:Orders):void{
        const setIs = new Set();
        let errorMessage = '';
        orders.forEach( order => {
            setIs.has(order.id) ? errorMessage += `Duplicate Order Id Found: (${order.id})\n` : setIs.add(order.id) 
        })
        errorMessage === '' ? undefined : throwingError(errorMessage);
    }

    ensuringConsistentOrders(orders:Orders, orderIds:string[], requestBodies:submitOrderRequestBody[]){
        const orderedIdsSet = new Set(orderIds);
        let errorMessage = '';
        orders.forEach( order => {
            orderedIdsSet.has(order.id) ? undefined : errorMessage += `Wrong Order Id: (${order.id})\n`
        })
        errorMessage === '' ? undefined : throwingError(errorMessage);

        expect(orders.length).toBe(requestBodies.length);

        requestBodies.sort((a,b) => a.customerName.localeCompare(b.customerName))
        orders.sort((a,b) => a.customerName.localeCompare(b.customerName))
        
        orders.forEach((order, index) => {
            expect(order).toEqual(expect.objectContaining({
                bookId:requestBodies[index].bookId,
                customerName:requestBodies[index].customerName
            }))
        })
    }

    async cleanupSpecificOrder(orderClient:OrdersService, orderID:string){
        const deletingOrder = await orderClient.deleteSpecificOrder(orderID);
        await verifyStatusCodeandReturnJSON(deletingOrder, 204);
        // Ensuring the cleaned order
        const cleanedOrder = await orderClient.getSpecificOrder(orderID);
        const cleanedOrderData = await verifyStatusCodeandReturnJSON(cleanedOrder, 404) as {error:string};
        expect(cleanedOrderData).toEqual({
            error: `No order with id ${orderID}.`
        })
    }
}