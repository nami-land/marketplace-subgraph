import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import {
  NecoMarketplace,
  BuyItem,
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
  let itemId = event.params.ItemId.toHex();
  let item = Item.load(itemId);

  // update item's properties.
  if (item !== null) {
    item.isOnList = false;
    item.buyer = event.params.buyer.toHex();
    item.isSoldOut = true;
    item.soldTime = event.block.timestamp;
    item.fee = event.params.fee;
    item.save();
  }

  // update marketplace's data
  let marketAddress = event.address;
  let marketplaceId = marketAddress.toHex();
  let marketplace = Marketplace.load(marketplaceId);
  if (marketplace !== null) {
    // change sold items array
    let soldItems: string[] = marketplace.soldItems;
    soldItems.push(itemId);
    marketplace.soldItems = soldItems;

    // change onList items
    let onListItems = marketplace.onListItems;
    let index = marketplace.onListItems.indexOf(itemId);
    if (index > -1) {
      onListItems.splice(index, 1);
    }
    marketplace.onListItems = onListItems;

    marketplace.save();
  }

  // update seller's data
  let sellerId = event.params.seller.toHex();
  let seller = User.load(sellerId);
  if (seller !== null) {
    // change onList items
    let onListItems = seller.onListItems;
    let index = onListItems.indexOf(itemId);
    if (index > -1) {
      onListItems.splice(index, 1);
    }
    seller.onListItems = onListItems;

    let soldItems = seller.soldItems;
    soldItems.push(itemId);
    seller.soldItems = soldItems;
    seller.save();
  }

  // update buyer's data
  let buyerId = event.params.buyer.toHex();
  let buyer = User.load(buyerId);
  if (buyer === null) {
    buyer = new User(buyerId);
    buyer.address = event.params.buyer;
    buyer.onListItems = [];
    buyer.boughtItems = [];
    buyer.save();
  }

  let boughtItems = buyer.boughtItems;
  boughtItems.push(itemId);
  buyer.boughtItems = boughtItems;
  buyer.save();
}

export function handlePublishNewItem(event: PublishNewItem): void {
  let marketAddress = event.address;
  let marketplaceId = marketAddress.toHex();
  let marketplace = Marketplace.load(marketplaceId);

  //  get market place smart contract
  // let marketplaceContract = NecoMarketplace.bind(event.address);
  // log.warning(marketAddress.toHex(), []);
  // let necoNFTAddress = ZERO_ADDRESS;
  // const necoNFTResult = marketplaceContract.try_necoNFT();
  // if (necoNFTResult.reverted) {
  //   log.warning("get neco nft contract address failed.", []);
  // } else {
  //   log.warning(necoNFTResult.value.toHex(), []);
  //   necoNFTAddress = necoNFTResult.value;
  // }

  // get nft smart contract
  // let nftContract = NecoNFT.bind(Address.fromString('0xEB1C424A31490A9B141126838a3c625647f22BDc'));

  if (marketplace === null) {
    marketplace = new Marketplace(marketplaceId);
    marketplace.publishedItems = [];
    marketplace.soldItems = [];
    marketplace.onListItems = [];
    marketplace.revokedItems = [];
    marketplace.save();
  }

  // create a new user
  let userId = event.params.account.toHex()
  let user = User.load(userId);
  if (user === null) {
    user = new User(userId);
    user.address = event.params.account;
    user.onListItems = [];
    user.boughtItems = [];
    user.revokedItems = [];
    user.soldItems = [];
    user.save();
  }

  // create a new item
  let itemId = event.params.ItemId.toHex();
  let item = Item.load(itemId);
  if (item === null) {
    item = new Item(itemId);
    item.itemId = event.params.ItemId;
    item.seller = user.id;
    item.buyer = ZERO_ADDRESS.toHex();
    item.nftId = event.params.nftId;
    // const urlResult = nftContract.try_uri(event.params.nftId);
    // if (urlResult.reverted) {
    //   log.warning("get nft uri failed: ", []);
    // } else {
    //   item.nftUri = urlResult.value;
    //   log.warning("nft uri: {}", [urlResult.value.toString()]);
    // }

    // const nftTypeResult = nftContract.try_getNFTType(event.params.nftId);
    // if (nftTypeResult.reverted) {
    //   log.info("get nft type failed: " + marketplaceContract.necoNFT().toHex(), []);
    // } else {
    //   item.nftType = nftTypeResult.value;
    // }

    item.amount = event.params.amount;
    item.price = event.params.price;
    item.onListTime = event.block.timestamp;
    item.isSoldOut = false;
    item.soldTime = event.block.timestamp;
    item.isOnList = true;
    item.isRevoked = false;
    item.fee = BIGINT_ZERO;
    item.save();
  }

  let publishedItems = marketplace.publishedItems;
  publishedItems.push(item.id);
  marketplace.publishedItems = publishedItems;

  let mOnListItems = marketplace.onListItems;
  mOnListItems.push(item.id);
  marketplace.onListItems = mOnListItems;
  marketplace.save();

  let onListItems = user.onListItems;
  onListItems.push(item.id);
  user.onListItems = onListItems;
  user.save()
}

export function handleRevertOnListItem(event: RevertOnListItem): void {
  let itemId = event.params.ItemId.toHex();
  let item = Item.load(itemId);
  if (item !== null) {
    item.isOnList = false;
    item.isRevoked = true;
    item.save();
  }

  let userId = event.params.account.toHex()
  let user = User.load(userId);
  if (user !== null) {
    let listedItems = user.onListItems;
    let index = listedItems.indexOf(itemId);
    if (index > -1) {
      listedItems.splice(index, 1);
    }
    user.onListItems = listedItems;

    let revertedItems = user.revokedItems;
    revertedItems.push(itemId)
    user.revokedItems = revertedItems;
    user.save();
  }


  // update marketplace's data
  let marketAddress = event.address;
  let marketplaceId = marketAddress.toHex();
  let marketplace = Marketplace.load(marketplaceId);
  if (marketplace !== null) {
    // change onList items
    let onListItems = marketplace.onListItems;
    let index = onListItems.indexOf(itemId);
    if (index > -1) {
      onListItems.splice(index, 1);
    }
    marketplace.onListItems = onListItems;

    let revertedItems = marketplace.revokedItems;
    revertedItems.push(itemId);
    marketplace.revokedItems = revertedItems;
    marketplace.save();
  }
}
