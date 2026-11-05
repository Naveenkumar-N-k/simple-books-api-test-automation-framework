import { expect } from "@playwright/test";
import { APIRequestContext, APIResponse} from "@playwright/test";
import { throwingError } from "../utilities/basic-utils";

export type GetBooksQueryParam = {
    type: 'fiction' | 'non-fiction' | string;
    limit: number;
};

export type Book = {
    id: number;
    type: 'fiction' | 'non-fiction';
    available: boolean;
    [key:string]: number | string | boolean;
};

export class BooksService{
    constructor(private request:APIRequestContext){}
    
    async getBooks(queryParam?:GetBooksQueryParam):Promise<APIResponse>{
        return await this.request.get('/books', {params:queryParam})
    }
    
    async getSpecificBook(bookId:number):Promise<APIResponse>{
        return await this.request.get(`/books/${bookId}`)
    }
}

export class BooksHelper{
    ensuringNoDuplicateBooks(books:Book[]):void{
        const setIs = new Set();
        let errorMessage = '';
        books.forEach( book => { setIs.has(book.id) ? errorMessage += `Duplicate Book Id (${book.id}) found \n` : setIs.add(book.id)});
        errorMessage === '' ? undefined : throwingError(errorMessage);
    }

    ensuringValidBookIds(books:Book[]):void{
        let errorMessage = '';
        books.forEach( 
            book => { book.id<=6 && book.id>=1 ? undefined : errorMessage += `book with book id (${book.id}) is invalid\n` } 
        )
        errorMessage === '' ? undefined : throwingError(errorMessage);
    }
    
    invalidType():string{
        const randomNumber = Math.floor((Math.random()*100));
        return `Genre-${randomNumber}`;
    }

    invalidLimit(): number{
        const randomNumber = Math.floor(Math.random() * 50) + 1;
        return randomNumber <= 20 ? -randomNumber : randomNumber;
    }

    validType():string{
        return Math.random() < 0.5 ? 'fiction' : 'non-fiction';
    }

    validLimit():number{ return Math.floor(Math.random()*20)+1 }

    validatingValidCredentials(credential:GetBooksQueryParam){
        expect(credential.type).toMatch(/^(fiction|non-fiction)$/);
        expect(String(credential.limit)).toMatch(/^([1-9]|1[0-9]|20)$/);
    }
    
    validatingInvalidCredentials(credential:GetBooksQueryParam, which:"type" | "limit" | "both"){
        if (which === "type" || which === "both"){
            expect(credential.type).not.toMatch(/^(fiction|non-fiction)$/);
            if (which === "type") expect(String(credential.limit)).toMatch(/^([1-9]|1[0-9]|20)$/)
        };
        if (which==="limit" || which === "both") {
            expect(String(credential.limit)).not.toMatch(/^([1-9]|1[0-9]|20)$/);
            if (which === 'limit') expect(credential.type).toMatch(/^(fiction|non-fiction)$/)
        };  
    }
}

