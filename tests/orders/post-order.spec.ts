import { test, expect } from '@playwright/test';
import { verifyStatusCodeandReturnJSON, getAccessToken } from '../../utilities/basic-utils';
import { OrdersService } from '../../services/orders';
import { Orders, OrderSubmissionResponse, submitOrderRequestBody } from '../../services/orders';
import { Book } from '../../services/books';

test('post an order', async ({request}) => {
    const ordersService = new OrdersService(request);

    // submitting order
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 201) as OrderSubmissionResponse;
    expect(submitOrderResponseData).toEqual({
        created: true,
        orderId: expect.any(String),
    });

    // getting orders
    let getOrdersResponse = await ordersService.getOrders();
    let getOrdersResponseData = await verifyStatusCodeandReturnJSON(getOrdersResponse, 200) as Orders;

    // ensuring consistent orders
    let expectedOrder = getOrdersResponseData.filter(orderIs => orderIs.id === submitOrderResponseData.orderId)
    expect(expectedOrder).toHaveLength(1);
    ordersService.ensuringConsistentOrders(expectedOrder, [submitOrderResponseData.orderId], [submitOrderRequestBody]);

    // cleaning up
    await ordersService.cleanupSpecificOrder(ordersService, submitOrderResponseData.orderId);

})

test('post an order with invalid authorization', async ({request}) => {
    const ordersService = new OrdersService(request);

    // invalid access token
    const accessToken = await getAccessToken();
    const invalidAccessToken = [...accessToken].reverse().join('');
    const invalidHeader = {
        'Authorization': `Bearer ${invalidAccessToken}`
    };
    expect(invalidHeader.Authorization).toEqual(expect.any(String));    

    // submitting order with invalid access token
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody, invalidHeader); 
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 401) as {error: string};
    expect(submitOrderResponseData).toEqual({
        error: 'Invalid bearer token.'
    })
});

test('post an order without authorization', async ({request}) => {
    const ordersService = new OrdersService(request);

    // submitting order without authorization
    const submitOrderRequestBody = await ordersService.validOrderingData();
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody, null);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 401) as {error: string};
    expect(submitOrderResponseData).toEqual({
        error: 'Missing Authorization header.'
    })
})

test('post an order without request body', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // submitting order without request body 
    const submitOrderResponse = await ordersService.submitOrder(undefined);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 400) as {error: string};
    expect(submitOrderResponseData).toEqual({
        error: "Invalid or missing bookId."
    })
});

test('post an order with invalid data (unavailable book id)', async ({request}) => {
    const ordersService = new OrdersService(request);
    
    // getting books
    const getBooksResponse = await request.get('/books');
    const getBooksResponseData = await verifyStatusCodeandReturnJSON(getBooksResponse, 200) as Book[];
    const unavailableBooks = getBooksResponseData.filter( book => !(book.available) );

    // submitting order on unavailable book
    const randomUnavailbleBookId = unavailableBooks[Math.floor(Math.random()*unavailableBooks.length)].id;
    const submitOrderRequestBody = {
        bookId: randomUnavailbleBookId,
        customerName: 'Test user 1251',
    } as submitOrderRequestBody;
    const submitOrderResponse = await ordersService.submitOrder(submitOrderRequestBody);
    const submitOrderResponseData = await verifyStatusCodeandReturnJSON(submitOrderResponse, 404) as {error: string};
    expect(submitOrderResponseData).toEqual({
        error: "This book is not in stock. Try again later."
    });
});