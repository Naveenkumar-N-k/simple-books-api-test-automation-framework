import { test, expect } from '@playwright/test';
import { verifyStatusCodeandReturnJSON, throwingError } from '../../utilities/basic-utils';
import { OrderSubmissionResponse, Orders, OrdersService } from '../../services/orders';

test('get orders', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // submitting orders (3)
    const submitOrderRequestBody = [
        await ordersService.validOrderingData(),
        await ordersService.validOrderingData(), 
        await ordersService.validOrderingData(),
    ];
    const orderIds:string[] = [];
    for (let orderCount = 1; orderCount <= 3; orderCount++) {
        const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody[orderCount-1]);
        const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
        expect(submitOrderResponseData).toEqual({
            created: true,
            orderId: expect.any(String),
        });
        orderIds.push(submitOrderResponseData.orderId);
    }
    expect(orderIds).toHaveLength(3);

    // getting current orders
    let getOrdersResponse = await ordersService.getOrders();
    let getOrdersResponseData = await verifyStatusCodeandReturnJSON(getOrdersResponse, 200) as Orders;
    const currentOrders = getOrdersResponseData.filter(order => orderIds.includes(order.id));
    expect(currentOrders).toHaveLength(3);
    
    // ensuring consistent orders
    ordersService.ensuringNoDuplicateOrders(currentOrders);
    ordersService.ensuringConsistentOrders(currentOrders, orderIds, submitOrderRequestBody);

    // cleaning up
    for (const orderId of orderIds) { await ordersService.cleanupSpecificOrder(ordersService, orderId) } 
    getOrdersResponse = await ordersService.getOrders();
    getOrdersResponseData = await verifyStatusCodeandReturnJSON(getOrdersResponse, 200) as Orders;
    let errorMessage = '';
    getOrdersResponseData.forEach(order => {
        orderIds.includes(order.id) ? errorMessage += `Order Id (${order.id}) has not cleaned, yet.` : undefined
    });
    errorMessage === '' ? undefined : throwingError(errorMessage);
});

test('get orders without authorization', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // getting orders without authorization
    const getOrdersResponse = await ordersService.getOrders(null);
    const getOrdersResponseData = await verifyStatusCodeandReturnJSON(getOrdersResponse, 401) as {error: string};
    
    // ensuring unauthorized response data
    expect(getOrdersResponseData).toEqual({
        error: 'Missing Authorization header.'
    })
});

test('get an order', async ({request}) => {
    const ordersService = new OrdersService(request);

    // submitting order
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });
    
    // getting order
    const order = await ordersService.getSpecificOrder(submitOrderResponseData.orderId);
    const orderData = await verifyStatusCodeandReturnJSON(order, 200) as Orders[0];
    ordersService.ensuringConsistentOrders([orderData], [submitOrderResponseData.orderId], [submitOrderRequestBody]);
    
    // cleaning up
    await ordersService.cleanupSpecificOrder(ordersService, submitOrderResponseData.orderId);
});

test('get an order without authorization', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // submitting order
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });

    // getting order without authorization
    const getSpecificOrderResponse = await ordersService.getSpecificOrder(submitOrderResponseData.orderId, null);
    const getSpecificOrderResponseData = await verifyStatusCodeandReturnJSON(getSpecificOrderResponse, 401) as {error: string};
    expect(getSpecificOrderResponseData).toEqual({
        error: 'Missing Authorization header.'
    });

    // cleaning up
    await ordersService.cleanupSpecificOrder(ordersService, submitOrderResponseData.orderId);
});
