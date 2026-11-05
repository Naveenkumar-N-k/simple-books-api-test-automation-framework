
import { expect, test } from '@playwright/test';
import { verifyStatusCodeandReturnJSON } from '../../utilities/basic-utils';
import { BooksService, Book } from '../../services/books';

test('get a book with valid book id', async ({request}) => {
    // random valid book id
    const validBookId = Math.floor(Math.random()*6) + 1;         // Valid • 1 ... 6
    expect(String(validBookId)).toMatch(/^[1-6]$/);

    // books service
    const booksService = new BooksService(request);
    
    // getting a specific book
    const booksResponse = await booksService.getSpecificBook(validBookId);
    const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 200) as Book;
    
    // ensuring right data received
    expect(booksResponseData).toEqual(expect.objectContaining({
        id: validBookId,
        type: expect.stringMatching(/^(fiction|non-fiction)$/i),
        author: expect.any(String)
    }))
});

test('get a book with invalid book id', async ({request}) => {
    const invalidBookId = (Math.floor(Math.random()*15) + 1) + 6;    // Invalid • 7 ... 21
    expect(String(invalidBookId)).not.toMatch(/^[1-6]$/);

    // getting a specific book
    const booksService = new BooksService(request);
    const booksResponse = await booksService.getSpecificBook(invalidBookId);
    const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 404) as {error:string}
    
    // ensuring resource not found
    expect(booksResponseData).toEqual({error: `No book with id ${invalidBookId}`});
});