## Tools Used:
* [Truffle](https://trufflesuite.com/docs/truffle/): Solidity Compiler, Testing Libraries
* [Ganache](https://trufflesuite.com/docs/ganache/): Test-Blockchain

### Commands
1. Compile contracts: ```truffle compile```
2. Test contracts: ```truffle test```
3. Start Test-Blockchain: ```ganache```
4. Deploy Contracts to the Test-Blockchain:
 * have a migration script
 * run: ```truffle migrate```

## Process
* when you have a subscription: login via REST API -> returns a JWT Token, refresh token
* max expiry for the JWT Token: expiry date of the subscription
* login into pages with the JWT Token

### Architecture
* Backend - linked to Blockchain
 * sign requests
* Frontend plugin - login form
 * sign in, write JWT Token into browser cache
 * refresh subscription
 * cancel subscription
 * view subscription statistics

 ### Technologies
 * Frontend: React JS & Next JS?
 * Backend: 