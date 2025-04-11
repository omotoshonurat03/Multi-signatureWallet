
;; Multi-Signature Wallet
;; This contract creates a wallet that requires multiple signatures to authorize transactions


(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_INVALID_THRESHOLD (err u101))
(define-constant ERR_ALREADY_SIGNED (err u102))
(define-constant ERR_INSUFFICIENT_SIGNATURES (err u103))
(define-constant ERR_TX_DOESNT_EXIST (err u104))
(define-constant ERR_TX_EXPIRED (err u105))
(define-constant ERR_TX_ALREADY_EXECUTED (err u106))


;; Data structures

;; Stores the owner addresses
(define-data-var owners (list 10 principal) (list))

;; Number of signatures required to execute a transaction
(define-data-var threshold uint u0)

;; Tracks the transaction count
(define-data-var tx-counter uint u0)
;; Map of transaction ID to transaction details
(define-map transactions
  { tx-id: uint }
  {
    to: principal,
    amount: uint,
    executed: bool,
    expiration: uint,
    signatures: (list 10 principal)
  }
)