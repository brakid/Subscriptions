const Subscription = artifacts.require('Subscription');

const SUBSCRIPTION_FEE = 1_000_000_000_000_000; // 0.01 ETH

module.exports = async (deployer, network, addresses) => {
  const [admin, _] = addresses;
  await deployer.deploy(Subscription, SUBSCRIPTION_FEE, { from: admin });
  const subscription = await Subscription.deployed();
};