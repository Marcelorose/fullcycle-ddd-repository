import { Sequelize } from 'sequelize-typescript';

import Order from '../../../../domain/checkout/entity/order';
import OrderItem from '../../../../domain/checkout/entity/order_item';
import Customer from '../../../../domain/customer/entity/customer';
import Address from '../../../../domain/customer/value-object/address';
import Product from '../../../../domain/product/entity/product';
import CustomerModel from '../../../customer/repository/sequelize/customer.model';
import CustomerRepository from '../../../customer/repository/sequelize/customer.repository';
import ProductModel from '../../../product/repository/sequelize/product.model';
import ProductRepository from '../../../product/repository/sequelize/product.repository';
import OrderItemModel from './order-item.model';
import OrderModel from './order.model';
import OrderRepository from './order.repository';

type CustomerParams = {
  id: string;
  name: string;
  address: {
    street: string;
    number: number;
    zip: string;
    city: string;
  };
};

type ProductParams = {
  id: string;
  name: string;
  price: number;
};

type OrderItemParams = {
  id: string;
  productId: string;
  quantity: number;
};

type OrderParams = {
  id: string;
  customer: CustomerParams;
  products: ProductParams[];
  orderItems: OrderItemParams[];
}

async function createOrder(order: OrderParams) {
  const customerRepository = new CustomerRepository();
  const customer = new Customer(order.customer.id, order.customer.name);
  const address = new Address(order.customer.address.street, order.customer.address.number, order.customer.address.zip, order.customer.address.city);
  customer.changeAddress(address);
  await customerRepository.create(customer);

  const productRepository = new ProductRepository();
  const products = order.products.map((product) => new Product(product.id, product.name, product.price));
  await products.forEach(async (product) => await productRepository.create(product));

  const orderItems = order.orderItems.map((orderItem) => {
    const product = products.find((product) => product.id === orderItem.productId);
    return new OrderItem(orderItem.id, product.name, product.price, product.id, orderItem.quantity);
  });

  const newOrder = new Order(order.id, customer.id, orderItems);

  const orderRepository = new OrderRepository();
  await orderRepository.create(newOrder);
  return newOrder;
}

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const orderParams = {
      id: "123",
      customer: {
        id: "123",
        name: "Customer 1",
        address: {
          street: "Street 1",
          number: 1,
          zip: "Zipcode 1",
          city: "City 1",
        },
      },
      products: [
        {
          id: "123",
          name: "Product 1",
          price: 10,
        },
      ],
      orderItems: [
        {
          id: "1",
          productId: "123",
          quantity: 2,
        },
      ],
    };
    const order = await createOrder(orderParams);

    const orderModel = await OrderModel.findOne({
      where: { id: orderParams.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: orderParams.id,
      customer_id: orderParams.customer.id,
      total: order.total(),
      items: [
        {
          id: orderParams.orderItems[0].id,
          name: orderParams.products[0].name,
          price: orderParams.products[0].price,
          quantity: orderParams.orderItems[0].quantity,
          order_id: orderParams.id,
          product_id: orderParams.orderItems[0].productId,
        },
      ],
    });
  });

  it("should find an order", async () => {
    const orderParams1 = {
      id: "123",
      customer: {
        id: "123",
        name: "Customer 1",
        address: {
          street: "Street 1",
          number: 1,
          zip: "Zipcode 1",
          city: "City 1",
        },
      },
      products: [
        {
          id: "123",
          name: "Product 1",
          price: 10,
        },
      ],
      orderItems: [
        {
          id: "1",
          productId: "123",
          quantity: 2,
        },
      ],
    };
    const order1 = await createOrder(orderParams1);

    const orderModel = await OrderModel.findOne({
      where: { id: order1.id },
      include: ["items"],
    });

    const orderRepository = new OrderRepository();
    const foundOrder = await orderRepository.find(orderParams1.id);

    expect(orderModel.toJSON()).toStrictEqual({
      id: foundOrder.id,
      customer_id: foundOrder.customerId,
      total: foundOrder.total(),
      items: [
        {
          id: foundOrder.items[0].id,
          name: foundOrder.items[0].name,
          price: foundOrder.items[0].price,
          quantity: foundOrder.items[0].quantity,
          order_id: foundOrder.id,
          product_id: foundOrder.items[0].productId,
        },
      ],
    });
  });

  it("should find all orders", async () => {
    const orderParams = {
      id: "123",
      customer: {
        id: "123",
        name: "Customer 1",
        address: {
          street: "Street 1",
          number: 1,
          zip: "Zipcode 1",
          city: "City 1",
        },
      },
      products: [
        {
          id: "123",
          name: "Product 1",
          price: 10,
        },
      ],
      orderItems: [
        {
          id: "1",
          productId: "123",
          quantity: 2,
        },
      ],
    };
    const order = await createOrder(orderParams);

    const orderParams2 = {
      id: "1234",
      customer: {
        id: "1234",
        name: "Customer 2",
        address: {
          street: "Street 2",
          number: 1,
          zip: "Zipcode 2",
          city: "City 2",
        },
      },
      products: [
        {
          id: "1234",
          name: "Product 2",
          price: 20,
        },
      ],
      orderItems: [
        {
          id: "2",
          productId: "1234",
          quantity: 2,
        },
      ],
    };
    const order2 = await createOrder(orderParams2);

    const orderParams3 = {
      id: "12345",
      customer: {
        id: "12345",
        name: "Customer 3",
        address: {
          street: "Street 3",
          number: 1,
          zip: "Zipcode 3",
          city: "City 3",
        },
      },
      products: [
        {
          id: "12345",
          name: "Product 3",
          price: 20,
        },
      ],
      orderItems: [
        {
          id: "3",
          productId: "12345",
          quantity: 2,
        },
      ],
    };
    const order3 = await createOrder(orderParams3);

    const orderRepository = new OrderRepository();
    const foundOrders = await orderRepository.findAll();

    expect([order, order2, order3]).toEqual(foundOrders);
  });

  it("should update an order", async () => {
    const orderParams = {
      id: "123",
      customer: {
        id: "123",
        name: "Customer 1",
        address: {
          street: "Street 1",
          number: 1,
          zip: "Zipcode 1",
          city: "City 1",
        },
      },
      products: [
        {
          id: "123",
          name: "Product 1",
          price: 10,
        },
      ],
      orderItems: [
        {
          id: "1",
          productId: "123",
          quantity: 2,
        },
      ],
    };
    const order = await createOrder(orderParams);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: order.items[0].id,
          name: order.items[0].name,
          price: order.items[0].price,
          quantity: order.items[0].quantity,
          order_id: order.id,
          product_id: order.items[0].productId,
        },
      ],
    });

    const newProduct = new Product("1234", "Product 2", 40);
    const productRepository = new ProductRepository();
    await productRepository.create(newProduct);

    const newOrderItem = new OrderItem("2", "Product 2", 40, "1234", 3);
    order.addItem(newOrderItem);

    const orderRepository = new OrderRepository();
    await orderRepository.update(order);

    const orderModel2 = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    console.log(orderModel2.toJSON()); // eslint-disable-line no-console

    expect(orderModel2.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: order.items[0].id,
          name: order.items[0].name,
          price: order.items[0].price,
          quantity: order.items[0].quantity,
          order_id: order.id,
          product_id: order.items[0].productId,
        },
        {
          id: order.items[1].id,
          name: order.items[1].name,
          price: order.items[1].price,
          quantity: order.items[1].quantity,
          order_id: order.id,
          product_id: order.items[1].productId,
        },
      ],
    });
  });
});
