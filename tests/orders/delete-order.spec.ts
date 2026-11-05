import { test, expect } from '@playwright/test'
import { OrdersService } from '../../services/orders';
import { OrderSubmissionResponse, Orders } from '../../services/orders';
import { verifyStatusCodeandReturnJSON } from '../../utilities/basic-utils';

test('delete an order', async ({request}) => {
    const ordersService = new OrdersService(request);

    // submitting order
    const requestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(requestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });

    // deleting order
    const deleteSpecificOrderResponse = await ordersService.deleteSpecificOrder(submitOrderResponseData.orderId);
    await verifyStatusCodeandReturnJSON(deleteSpecificOrderResponse, 204);

});

test('delete an order without authorization', async ({request}) => {
    const ordersService = new OrdersService(request);

    // submitting order
    const requestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(requestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });

    // deleting order without authorization
    const deleteSpecificOrderResponse = await ordersService.deleteSpecificOrder(submitOrderResponseData.orderId, null);
    const deleteSpecificOrderResponseData = await verifyStatusCodeandReturnJSON(deleteSpecificOrderResponse, 401) as {error: string};
    expect(deleteSpecificOrderResponseData).toEqual({
        error: 'Missing Authorization header.'
    });
    
    // cleaning up
    await ordersService.cleanupSpecificOrder(ordersService, submitOrderResponseData.orderId);
});