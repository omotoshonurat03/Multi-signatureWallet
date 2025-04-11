Multi-Signature Wallet
A secure Clarity smart contract for managing shared funds on the Stacks blockchain, requiring multiple approvals before transactions can be executed.
Overview
This Multi-Signature Wallet implements a collaborative custody solution where a group of designated owners must collectively approve transactions before funds can be spent. The contract requires a minimum threshold of signatures from authorized owners, providing enhanced security for shared funds.
Features

Multi-owner Management: Support for up to 10 wallet owners
Configurable Threshold: Customizable number of required signatures
Transaction Proposals: Any owner can propose a new transaction
Multi-step Approval: Transactions require multiple signatures before execution
Expiration Controls: Transactions expire after a specified block height
Duplicate Protection: Prevents owners from signing multiple times

How It Works

Initialization: The wallet is set up with a list of owner addresses and a threshold (minimum number of required signatures)
Transaction Proposal: Any owner can propose a new transaction specifying recipient, amount, and expiration
Signature Collection: Other owners review and sign the proposed transaction
Execution: Once the threshold of signatures is met, the transaction can be executed

Functions
Administrative

initialize: Set up wallet with owner list and signature threshold

Transaction Management

propose-transaction: Create a new spending proposal
sign-transaction: Add your signature to an existing proposal
execute-transaction: Complete a transaction once threshold is met

Read-Only

get-signature-count: Check how many signatures a transaction has
has-signed: Verify if a specific owner has signed a transaction
get-owners: View the current list of wallet owners
get-threshold: Check the current signature threshold requirement

Error Codes

ERR_NOT_AUTHORIZED (u100): Caller is not an authorized owner
ERR_INVALID_THRESHOLD (u101): Threshold must be >0 and ≤ total owners
ERR_ALREADY_SIGNED (u102): Owner has already signed this transaction
ERR_INSUFFICIENT_SIGNATURES (u103): Not enough signatures to execute
ERR_TX_DOESNT_EXIST (u104): Referenced transaction ID doesn't exist
ERR_TX_EXPIRED (u105): Transaction has passed its expiration block
ERR_TX_ALREADY_EXECUTED (u106): Transaction has already been executed

Security Considerations

All transactions have expiration timestamps to prevent pending transactions from being executed far in the future
Signature tracking prevents double-signing by the same owner
Threshold system prevents single points of failure
Transaction execution status prevents double-execution

Use Cases

Team treasury management
Organizational fund administration
Secure storage for high-value assets
Controlled spending for joint ventures