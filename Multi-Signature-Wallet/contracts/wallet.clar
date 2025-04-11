
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

;; Initialize the wallet with owners and signature threshold
(define-public (initialize (new-owners (list 10 principal)) (sig-threshold uint))
  (begin
    (asserts! (<= sig-threshold (len new-owners)) ERR_INVALID_THRESHOLD)
    (asserts! (> sig-threshold u0) ERR_INVALID_THRESHOLD)
    (var-set owners new-owners)
    (var-set threshold sig-threshold)
    (ok true)
  )
)

;; Check if the caller is an owner
(define-private (is-owner (caller principal))
  (default-to false (some (lambda (owner) (is-eq owner caller)) (var-get owners)))
)


;; Create a new transaction proposal
(define-public (propose-transaction (to principal) (amount uint) (expiration uint))
  (let ((caller tx-sender)
        (tx-id (var-get tx-counter)))
    (asserts! (is-owner caller) ERR_NOT_AUTHORIZED)
    
    ;; Create the transaction
    (map-set transactions
      { tx-id: tx-id }
      {
        to: to,
        amount: amount,
        executed: false,
        expiration: expiration,
        signatures: (list caller)
      }
    )
    
    ;; Increment transaction counter
    (var-set tx-counter (+ tx-id u1))
    
    (ok tx-id)
  )
)

;; Sign a transaction
(define-public (sign-transaction (tx-id uint))
  (let ((caller tx-sender)
        (tx (get-transaction tx-id)))
    
    ;; Check if transaction exists
    (asserts! (is-some tx) ERR_TX_DOESNT_EXIST)
    
    (let ((unwrapped-tx (unwrap-panic tx)))
      ;; Check if expired
      (asserts! (< block-height (get expiration unwrapped-tx)) ERR_TX_EXPIRED)
      
      ;; Check if already executed
      (asserts! (not (get executed unwrapped-tx)) ERR_TX_ALREADY_EXECUTED)
      
      ;; Check if caller is authorized
      (asserts! (is-owner caller) ERR_NOT_AUTHORIZED)
      
      ;; Check if caller has already signed
      (asserts! (not (default-to false (some (lambda (signer) (is-eq signer caller)) (get signatures unwrapped-tx)))) ERR_ALREADY_SIGNED)
      
      ;; Add signature
      (map-set transactions
        { tx-id: tx-id }
        (merge unwrapped-tx { signatures: (unwrap-panic (as-max-len? (append (get signatures unwrapped-tx) caller) u10)) })
      )
      
      (ok true)
    )
  )
)
