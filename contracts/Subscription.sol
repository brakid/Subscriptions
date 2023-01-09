// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Subscription is ERC721, Ownable {
  event Subscribed(address indexed user, uint256 expiryDate);
  event Unsubscribed(address indexed user);
  event RefreshedSubscription(address indexed user, uint256 newExpiryDate);
  event SubscriptionFeeChanged(uint256 indexed oldFee, uint256 indexed newFee);

  uint256 private _lastTokenId = 1;
  mapping(uint256 => uint256) private _expiryDates;
  mapping(address => uint256) private _userSubscription;

  uint256 private _subscriptionFee;

  uint256 constant public SUBSCRIPTION_DURATION = 90 days;
  uint256 constant public MAX_FUTURE_SUBSCRIPTION_DURATION = 360 days;
  
  constructor(uint256 subscriptionFee) ERC721("Subscription", "SCP") {
    setSubscriptionFee(subscriptionFee);
  }

  function subscribe() public payable {
    require(balanceOf(msg.sender) == 0, "Message sender must not be a holder of a Subscription Nft, use refresh instead");
    require(_userSubscription[msg.sender] == 0, "Message sender must not be a holder of a Subscription Nft, use refresh instead");
    require(msg.value == _subscriptionFee, "Not matching the subscription fee");

    _safeMint(msg.sender, _lastTokenId);
    _userSubscription[msg.sender] = _lastTokenId;
    _expiryDates[_lastTokenId] = block.timestamp + SUBSCRIPTION_DURATION;
    _lastTokenId++;

    emit Subscribed(msg.sender, _expiryDates[_lastTokenId]);
  }

  function unsubscribe() public {
    require(_userSubscription[msg.sender] != 0, "Message sender is not holding a subscription");
    uint256 tokenId = _userSubscription[msg.sender];
    require(ownerOf(tokenId) == msg.sender, "Message sender must be a holder of a Subscription Nft");

    _burn(tokenId);
    delete _userSubscription[msg.sender];
    delete _expiryDates[tokenId];

    emit Unsubscribed(msg.sender);
  }

  function refreshSubscription() public payable {
    require(_userSubscription[msg.sender] != 0, "Message sender is not holding a subscription");
    uint256 tokenId = _userSubscription[msg.sender];

    require((_expiryDates[tokenId] + SUBSCRIPTION_DURATION) <= (block.timestamp + MAX_FUTURE_SUBSCRIPTION_DURATION), "Can not refresh for more than 1 year in the future");
    require(msg.value == _subscriptionFee, "Not matching the subscription fee");

    _expiryDates[tokenId] += SUBSCRIPTION_DURATION;

    emit RefreshedSubscription(msg.sender, _expiryDates[tokenId]);
  }

  function isSubscribed() public view returns (bool) {
    uint256 tokenId = _userSubscription[msg.sender];
    return (tokenId != 0 && (_expiryDates[tokenId] > block.timestamp));
  }

  function subscriptionExpiryDate() public view returns (uint256) {
    require(_userSubscription[msg.sender] != 0, "Message sender is not holding a subscription");
    uint256 tokenId = _userSubscription[msg.sender];

    return _expiryDates[tokenId];
  }

  function collectSubscriptionFees() public onlyOwner {
    payable(owner()).transfer(address(this).balance);
  }

  function setSubscriptionFee(uint256 subscriptionFee) public onlyOwner {
    require(subscriptionFee != 0, "Fee needs to be larger than 0 Wei");
    require(subscriptionFee < 0.01 ether, "Fee must not be larger than 0.01 Ether");
    require(subscriptionFee != _subscriptionFee, "New and old fees need to be different");

    uint256 oldFee = _subscriptionFee;
    _subscriptionFee = subscriptionFee;
    emit SubscriptionFeeChanged(oldFee, _subscriptionFee);
  }

  function getSubscriptionFee() public view returns (uint256) {
    return _subscriptionFee;
  }
}
