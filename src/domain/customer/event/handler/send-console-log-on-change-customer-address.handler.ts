import EventHandlerInterface from '../../../@shared/event/event-handler.interface';
import CustomerCreatedEvent from '../customer-created.event';

export default class SendConsoleLogOnChangeCustomerAddressHandler
  implements EventHandlerInterface<CustomerCreatedEvent>
{
  handle(event: CustomerCreatedEvent): void {
    const { id, name, address } = event.eventData;
    console.log(`Endereço do cliente: ${id}, ${name} alterado para: ${address}`);
  }
}
