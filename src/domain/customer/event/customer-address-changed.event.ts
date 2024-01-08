import EventInterface from '../../@shared/event/event.interface';
import Customer from '../entity/customer';
import Address from '../value-object/address';

interface CustomerAddressChangedEventData {
  id: Customer["id"];
  name: Customer["name"];
  address: Address;
}

export default class CustomerAddressChangedEvent implements EventInterface {
  dataTimeOccurred: Date;
  eventData: any;

  constructor(eventData: CustomerAddressChangedEventData) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
