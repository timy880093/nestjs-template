export class AfteePreRegisterReq {
  amount: number;
  shop_transaction_no: string;
  user_no: string;
  sales_settled: boolean;
  customer: Customer;
  items: Item[];
  return_url: string;

  constructor(
    amount: number,
    shop_transaction_no: string,
    user_no: string,
    sales_settled: boolean,
    customer: Customer,
    items: Item[],
    return_url: string,
  ) {
    this.amount = amount;
    this.shop_transaction_no = shop_transaction_no;
    this.user_no = user_no;
    this.sales_settled = sales_settled;
    this.customer = customer;
    this.items = items;
    this.return_url = return_url;
  }
}

class Customer {
  customer_name: string;
  phone_number: string;
  address: string;
  email: string;
  additional_info_code: string;

  constructor(
    customer_name: string,
    phone_number: string,
    address: string,
    email: string,
    additional_info_code: string,
  ) {
    this.customer_name = customer_name;
    this.phone_number = phone_number;
    this.address = address;
    this.email = email;
    this.additional_info_code = additional_info_code;
  }
}

class Item {
  shop_item_id: string;
  item_name: string;
  item_category: string;
  item_price: number;
  item_count: number;

  constructor(
    shop_item_id: string,
    item_name: string,
    item_category: string,
    item_price: number,
    item_count: number,
  ) {
    this.shop_item_id = shop_item_id;
    this.item_name = item_name;
    this.item_category = item_category;
    this.item_price = item_price;
    this.item_count = item_count;
  }
}
