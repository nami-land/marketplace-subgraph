import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  NecoMarketplace,
  BuyItem,
  ChangePrice,
  OwnershipTransferred,
  PublishNewItem,
  RevertOnListItem
} from "../generated/NecoMarketplace/NecoMarketplace"
import {
  NecoNFT
} from "../generated/NecoMarketplace/NecoNFT"

import { Marketplace, Item, User } from "../generated/schema"

let ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000")
let BIGINT_ZERO = BigInt.fromI32(0)

export function handleBuyItem(event: BuyItem): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  // let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  // if (!entity) {
  //   entity = new ExampleEntity(event.transaction.from.toHex())

  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0)
  // }

  // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  // entity.buyer = event.params.buyer
  // entity.seller = event.params.seller

  // Entities can be written to the store with `.save()`
  // entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.onERC1155BatchReceived(...)
  // - contract.onERC1155Received(...)
  // - contract.devAddress(...)
  // - contract.fee(...)
  // - contract.getBoughtId(...)
  // - contract.getBoughtIdAmountOfUser(...)
  // - contract.getItem(...)
  // - contract.getItemTotalAmount(...)
  // - contract.getPublishId(...)
  // - contract.getPublishIdAmountOfUser(...)
  // - contract.getSoldId(...)
  // - contract.getSoldIdAmountOfUser(...)
  // - contract.idToItem(...)
  // - contract.locked(...)
  // - contract.necoNFT(...)
  // - contract.nfishToken(...)
  // - contract.owner(...)
  // - contract.supportsInterface(...)
}

export function handleChangePrice(event: ChangePrice): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePublishNewItem(event: PublishNewItem): void {
  let marketAddress = event.address;
  let marketplaceId = marketAddress.toHex();
  let marketplace = Marketplace.load(marketplaceId);
  let marketplaceContract = NecoMarketplace.bind(marketAddress);
  let nftContract = NecoNFT.bind(marketplaceContract.necoNFT())
  if (marketplace == null) {
    marketplace = new Marketplace(marketplaceId);
    marketplace.publishedItems = [];
    marketplace.soldItems = [];
    marketplace.todayPublishedItemAmount = 0;
    marketplace.todaySoldItemAmount = 0;
    marketplace.todayPublishedItemAmount = 0;
    marketplace.todaySoldItemAmount = 0;
  }

  let userId = event.params.account.toHex()
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.address = event.params.account;
  }

  let itemId = event.params.ItemId.toHex();
  let item = Item.load(itemId);
  if (item == null) {
    item = new Item(itemId);
    item.itemId = event.params.ItemId;
    item.seller = user.id;
    item.buyer = ZERO_ADDRESS.toHex();
    item.nftId = event.params.nftId;
    item.nftUri = nftContract.uri(item.nftId);
    item.amount = event.params.amount;
    item.price = event.params.price;
    item.onListTime = event.block.timestamp;
    item.isSoldOut = false;
    item.isOnList = true;
    item.fee = BIGINT_ZERO;
    item.save();
  }

  marketplace.publishedItems.push(item.id);
  marketplace.save();

  user.onListItems.push(item.id);
  user.save()
}

export function handleRevertOnListItem(event: RevertOnListItem): void {}
