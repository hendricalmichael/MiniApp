export interface Category {
    id : string;
    name : string;
    slug : string;
}

export interface Product {
    id : string;
    name : string;
    slug : string;
    description : string;
    price : string;
    stock : number;
    imageUrl : string;
    category : Category;
}

export interface CartLine {
    product : Product;
    quantity : number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isStaff: boolean;
}