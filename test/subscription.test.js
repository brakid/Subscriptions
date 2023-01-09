const Subscription = artifacts.require('Subscription');
const assert = require('chai').assert;
const truffleAssert = require('truffle-assertions');

const SUBSCRIPTION_FEE = 1_000_000_000_000_000; // 0.01 ETH

contract('Subscription', (accounts) => {
  const [accountOne, accountTwo, accountThree] = accounts;
  it('test all contract functions', async () => {
    const instance = await Subscription.new(SUBSCRIPTION_FEE, { from: accountOne });
    await truffleAssert.reverts(instance.subscribe({ from: accountTwo, value: 1 }), 'Not matching the subscription fee');
    await truffleAssert.reverts(instance.subscribe({ from: accountTwo, value: SUBSCRIPTION_FEE + 1 }), 'Not matching the subscription fee');
    const tx = await instance.subscribe({ from: accountTwo, value: SUBSCRIPTION_FEE });
    truffleAssert.eventEmitted(tx, 'Subscribed', (ev) => ev.user == accountTwo);
    assert.equal((await instance.balanceOf(accountTwo)).toNumber(), 1);
    assert.equal(await instance.isSubscribed({ from: accountTwo }), true);
    assert.equal(await web3.eth.getBalance(instance.address), SUBSCRIPTION_FEE);
    assert.equal((await instance.balanceOf(accountOne)).toNumber(), 0);
    assert.equal(await instance.isSubscribed({ from: accountOne }), false);
    const expiryDate = await instance.subscriptionExpiryDate({ from: accountTwo });
    assert.isTrue(expiryDate.toNumber() > 0);
    await truffleAssert.reverts(instance.subscriptionExpiryDate({ from: accountOne }), 'Message sender is not holding a subscription');
    await truffleAssert.reverts(instance.subscribe({ from: accountTwo }), 'Message sender must not be a holder of a Subscription Nft, use refresh instead');
    const tx2 = await instance.unsubscribe({ from: accountTwo });
    truffleAssert.eventEmitted(tx2, 'Unsubscribed', (ev) => ev.user == accountTwo);
    assert.equal((await instance.balanceOf(accountTwo)).toNumber(), 0);
    assert.equal(await instance.isSubscribed({ from: accountTwo }), false);

    await truffleAssert.reverts(instance.collectSubscriptionFees({ from: accountTwo }), 'Ownable: caller is not the owner');
    assert.equal(await web3.eth.getBalance(instance.address), SUBSCRIPTION_FEE);
    
    const oldBalance = await web3.eth.getBalance(accountOne);
    await instance.collectSubscriptionFees({ from: accountOne });
    assert.equal(await web3.eth.getBalance(instance.address), 0);
    const newBalance = await web3.eth.getBalance(accountOne);
    assert.isTrue(newBalance > oldBalance);

    await instance.subscribe({ from: accountTwo, value: SUBSCRIPTION_FEE });
    const tx3 = await instance.refreshSubscription({ from: accountTwo, value: SUBSCRIPTION_FEE });
    truffleAssert.eventEmitted(tx3, 'RefreshedSubscription', (ev) => ev.user == accountTwo);
    await instance.refreshSubscription({ from: accountTwo, value: SUBSCRIPTION_FEE });
    await instance.refreshSubscription({ from: accountTwo, value: SUBSCRIPTION_FEE });
    await truffleAssert.reverts(instance.refreshSubscription({ from: accountTwo, value: SUBSCRIPTION_FEE }), 'Can not refresh for more than 1 year in the future');
    await truffleAssert.reverts(instance.refreshSubscription({ from: accountThree, value: SUBSCRIPTION_FEE }), 'Message sender is not holding a subscription');

    await instance.setSubscriptionFee(SUBSCRIPTION_FEE - 1, { from: accountOne });
    assert.equal(await instance.getSubscriptionFee(), SUBSCRIPTION_FEE - 1);
    await truffleAssert.reverts(instance.setSubscriptionFee(0, { from: accountOne }), 'Fee needs to be larger than 0 Wei');
    await truffleAssert.reverts(instance.setSubscriptionFee(web3.utils.toBN('100000000000000000'), { from: accountOne }), 'Fee must not be larger than 0.01 Ether');
    await truffleAssert.reverts(instance.setSubscriptionFee(SUBSCRIPTION_FEE - 1, { from: accountOne }), 'New and old fees need to be different');
    await truffleAssert.reverts(instance.setSubscriptionFee(SUBSCRIPTION_FEE, { from: accountTwo }), 'Ownable: caller is not the owner');
  });
});
