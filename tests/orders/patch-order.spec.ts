import { test, expect } from "@playwright/test";
import { OrdersService, OrderSubmissionResponse, randomCustomerName } from "../../services/orders";
import { verifyStatusCodeandReturnJSON } from "../../utilities/basic-utils";
import { Orders } from "../../services/orders";

test('patch a customer name of an existing order', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // submitting order
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const currentCustomerName = submitOrderRequestBody.customerName; 
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });

    // patching customer name
    let newCustomerName:string;
    while (true) {
        newCustomerName = randomCustomerName();
        if (currentCustomerName !== newCustomerName) break;
    }
    const modifySpecificOrderRequestBody = { customerName: newCustomerName };
    const modifySpecificOrderResponse = await ordersService.modifySpecificOrder(submitOrderResponseData.orderId, modifySpecificOrderRequestBody);
    await verifyStatusCodeandReturnJSON(modifySpecificOrderResponse, 204);

    // verifying patched data
    const getSpecificOrderResponse = await ordersService.getSpecificOrder(submitOrderResponseData.orderId);
    const getSpecificOrderResponseData = await verifyStatusCodeandReturnJSON(getSpecificOrderResponse, 200) as Orders[0];
    expect(getSpecificOrderResponseData.customerName).toBe(modifySpecificOrderRequestBody.customerName);
    
    // cleaning up
    await ordersService.cleanupSpecificOrder(ordersService, submitOrderResponseData.orderId);
})

test('patch a customer name without authorization', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // submitting order
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });

    // patching customer name without authorization
    const modifySpecificOrderResponse = await ordersService.modifySpecificOrder(submitOrderResponseData.orderId, submitOrderRequestBody, null);
    const modifySpecificOrderResponseData = await verifyStatusCodeandReturnJSON(modifySpecificOrderResponse, 401) as {error: string};
    expect(modifySpecificOrderResponseData).toEqual({
        error: 'Missing Authorization header.'
    })

    // cleaning up
    await ordersService.cleanupSpecificOrder(ordersService, submitOrderResponseData.orderId);
});