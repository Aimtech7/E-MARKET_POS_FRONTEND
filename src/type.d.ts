interface Category {
  categoryName: string;
}
interface UnitOfMeasure {
  unitOfMeasureName: string;
  baseUnitOfMeasure: string;
  conversionFactor: number;
}
interface Product {
  id: string;
  title: string;
  media: string;
  price: number;
  category: Category;
  unitOfMeasure: UnitOfMeasure;
  stockQuantity: number;
  reorderLevel: number;
  expiryDate?: string;
  batchNumber?: string;
  sku?: string;
  barcode?: string;
}
interface CartCeil extends Product{
  qty:number;
}
interface Cart {
  cartId: string;
  description: string;
  tax: number;
  discount: number;
  products: CartCeil[];
}
interface Action{
    type:string;
    data?:any;
}
interface User{
  username:string;
  password:string;
  admin:boolean;
}
interface ResponseResult {
  message: string;
  status: number;
}
interface Invoice {
  _id?: string;
  invoiceNumber: string;
  cart: Cart;
  cashier: string;
  amountPaid: number;
  changeGiven: number;
  paymentMethod: string;
  timestamp: string;
  pdfPath?: string;
}
interface Supplier {
  _id: string;
  supplierName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}
interface PurchaseOrderItem {
  product: Product;
  qty: number;
  price: number;
}
interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: Supplier;
  items: PurchaseOrderItem[];
  status: "Draft" | "Ordered" | "Received" | "Cancelled";
  totalAmount: number;
  timestamp: string;
}