import { expect, test } from '@playwright/test';
import { verifyStatusCodeandReturnJSON, throwingError } from '../../utilities/basic-utils';
import { BooksService, BooksHelper } from '../../services/books'; 
import { GetBooksQueryParam, Book } from '../../services/books';

test('get books without query parameters', async ({request}) => {
  const booksService = new BooksService(request);
  const booksHelper = new BooksHelper();

  // getting books
  const booksResponse = await booksService.getBooks();
  const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 200) as Book[];

  // ensuring consistent list of books
  booksResponseData.forEach( book => {
    expect(book).toEqual(expect.objectContaining({
      id: expect.any(Number),
      type: expect.stringMatching(/(fiction|non-fiction)/i), 
    }))
  })
  booksHelper.ensuringNoDuplicateBooks(booksResponseData);
  booksHelper.ensuringValidBookIds(booksResponseData);
  expect(booksResponseData).toHaveLength(6);       // Ensuring 6 Books in total
});

test('get books with valid query parameters', async ({request}) => {
  const booksService = new BooksService(request);
  const booksHelper = new BooksHelper(); 

  // query parameters
  const queryParams = {
    type:booksHelper.validType(),
    limit:booksHelper.validLimit(),
  } satisfies GetBooksQueryParam;
  booksHelper.validatingValidCredentials(queryParams);

  // getting books with query parameters
  const booksResponse = await booksService.getBooks(queryParams);
  const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 200) as Book[];
  
  // ensuring consistent books received 
  booksResponseData.forEach( book => {
    expect(book).toEqual(expect.objectContaining({
      id: expect.any(Number),
      type: expect.stringMatching(/(fiction|non-fiction)/i), 
    }))
  })
  booksHelper.ensuringNoDuplicateBooks(booksResponseData);
  booksHelper.ensuringValidBookIds(booksResponseData);
    // valid type 
    let errorMessage = '';
    booksResponseData.forEach(book => {
      if(book.type !== queryParams.type) {
        errorMessage += `Got type: ${book.type} (invalid value) on book id: ${book.id}\n`
      }
    })
    if(errorMessage!=='') throwingError(errorMessage)
    
    // valid limit
    if (queryParams.type==='fiction'){
      if (queryParams.limit >= 4) expect(booksResponseData).toHaveLength(4)
      else expect(booksResponseData).toHaveLength(queryParams.limit)
    }else{
      if (queryParams.limit >= 2) expect(booksResponseData).toHaveLength(2)
      else expect(booksResponseData).toHaveLength(queryParams.limit)
    }
});

test(`get books with invalid 'type' query parameter`, async ({request}) => {
  const booksService = new BooksService(request);
  const booksHelper = new BooksHelper();
  
  // query parameters
  const queryParams = {
    type: booksHelper.invalidType(),
    limit: booksHelper.validLimit(),   
  } satisfies GetBooksQueryParam; 
  booksHelper.validatingInvalidCredentials(queryParams, 'type');
  
  // getting books with query parameters
  const booksResponse = await booksService.getBooks(queryParams);
  const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 400) as {error: string};
  
  // ensuring bad request error message
  expect(booksResponseData.error).toBe(`Invalid value for query parameter 'type'. Must be one of: fiction, non-fiction.`)
});

test(`get books with invalid 'limit' query parameter`, async ({request}) => {
  const booksService = new BooksService(request);
  const booksHelper = new BooksHelper();
  
  // query parameters
  const queryParams = {
    type: booksHelper.validType(),
    limit: booksHelper.invalidLimit(),
  } satisfies GetBooksQueryParam; 
  booksHelper.validatingInvalidCredentials(queryParams, 'limit');

  // getting books with query parameters
  const booksResponse = await booksService.getBooks(queryParams);
  const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 400) as {error: string};

  // ensuring bad request error message
  if(queryParams.limit <= 0) expect(booksResponseData.error).toBe(`Invalid value for query parameter 'limit'. Must be greater than 0.`)
  else expect(booksResponseData.error).toBe(`Invalid value for query parameter 'limit'. Cannot be greater than 20.`)
});


test(`get books with both invalid (type & limit) query parameters`, async ({request}) => {
  const booksService = new BooksService(request);
  const booksHelper = new BooksHelper();

  // query parameters
  const queryParams = {
    type: booksHelper.invalidType(),
    limit: booksHelper.invalidLimit(),
  } satisfies GetBooksQueryParam; 
  booksHelper.validatingInvalidCredentials(queryParams, 'both');

  // getting books with query parameters
  const booksResponse = await booksService.getBooks(queryParams);
  const booksResponseData = await verifyStatusCodeandReturnJSON(booksResponse, 400) as {error: string};
  
  // ensuring bad request error message
  if(queryParams.limit <= 0) expect(booksResponseData.error).toBe(`Invalid value for query parameter 'limit'. Must be greater than 0.`)
  else expect(booksResponseData.error).toBe(`Invalid value for query parameter 'limit'. Cannot be greater than 20.`)
});